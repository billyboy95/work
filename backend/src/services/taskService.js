const { v4: uuidv4 } = require("uuid");

function createHttpError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function createTaskService(options) {
  const {
    tasksStore,
    agentsStore,
    executor,
    maxAttempts = 2,
    pollIntervalMs = 500,
    retryDelayMs = 500,
    now = () => new Date(),
    setIntervalFn = setInterval,
    clearIntervalFn = clearInterval,
    setTimeoutFn = setTimeout,
  } = options;

  let workerInterval = null;
  let activeRun = null;

  function isoNow() {
    return now().toISOString();
  }

  function toDate(value) {
    return value ? new Date(value) : null;
  }

  function listTasks() {
    return tasksStore.list().sort((left, right) => {
      return toDate(right.createdAt) - toDate(left.createdAt);
    });
  }

  function getTask(id) {
    return tasksStore.get(id);
  }

  function setAgentStatus(agentId, status) {
    if (!agentId) {
      return;
    }

    const agent = agentsStore.get(agentId);
    if (!agent) {
      return;
    }

    agentsStore.set({
      ...agent,
      status,
      updatedAt: isoNow(),
    });
  }

  function createTask(input) {
    const title = input.title && input.title.trim();
    if (!title) {
      throw createHttpError("title is required", 400);
    }

    if (input.agentId && !agentsStore.get(input.agentId)) {
      throw createHttpError("agentId is invalid", 400);
    }

    const timestamp = isoNow();
    const task = {
      id: uuidv4(),
      title,
      description: input.description || "",
      agentId: input.agentId || null,
      status: "pending",
      result: null,
      lastError: null,
      attemptCount: 0,
      maxAttempts: input.maxAttempts || maxAttempts,
      createdAt: timestamp,
      updatedAt: timestamp,
      startedAt: null,
      completedAt: null,
      nextRetryAt: null,
    };

    tasksStore.set(task);
    return task;
  }

  function updateTask(id, changes) {
    const task = tasksStore.get(id);
    if (!task) {
      throw createHttpError("Task not found", 404);
    }

    const timestamp = isoNow();
    const nextTask = {
      ...task,
      updatedAt: timestamp,
    };

    if (changes.status !== undefined) {
      nextTask.status = changes.status;
    }

    if (changes.result !== undefined) {
      nextTask.result = changes.result;
    }

    if (changes.lastError !== undefined) {
      nextTask.lastError = changes.lastError;
    }

    if (changes.nextRetryAt !== undefined) {
      nextTask.nextRetryAt = changes.nextRetryAt;
    }

    if (changes.startedAt !== undefined) {
      nextTask.startedAt = changes.startedAt;
    }

    if (changes.completedAt !== undefined) {
      nextTask.completedAt = changes.completedAt;
    }

    if (changes.attemptCount !== undefined) {
      nextTask.attemptCount = changes.attemptCount;
    }

    if (changes.agentId !== undefined) {
      if (changes.agentId && !agentsStore.get(changes.agentId)) {
        throw createHttpError("agentId is invalid", 400);
      }

      nextTask.agentId = changes.agentId;
    }

    if (changes.status === "pending") {
      nextTask.nextRetryAt = null;
      nextTask.completedAt = null;
      nextTask.lastError = null;
    }

    if (changes.status === "running" && !nextTask.startedAt) {
      nextTask.startedAt = timestamp;
    }

    if (["completed", "failed"].includes(changes.status) && !changes.completedAt) {
      nextTask.completedAt = timestamp;
    }

    tasksStore.set(nextTask);

    if (changes.status === "running") {
      setAgentStatus(nextTask.agentId, "busy");
    }

    if (["pending", "retrying", "completed", "failed"].includes(changes.status)) {
      setAgentStatus(nextTask.agentId, "idle");
    }

    return nextTask;
  }

  function getNextDueTask() {
    const currentTime = now();

    return tasksStore
      .list()
      .filter((task) => {
        if (!["pending", "retrying"].includes(task.status)) {
          return false;
        }

        if (!task.nextRetryAt) {
          return true;
        }

        return toDate(task.nextRetryAt) <= currentTime;
      })
      .sort((left, right) => toDate(left.createdAt) - toDate(right.createdAt))[0] || null;
  }

  function startTask(task) {
    const updatedTask = {
      ...task,
      status: "running",
      attemptCount: task.attemptCount + 1,
      startedAt: task.startedAt || isoNow(),
      updatedAt: isoNow(),
      nextRetryAt: null,
      result: null,
      lastError: null,
    };

    tasksStore.set(updatedTask);
    setAgentStatus(updatedTask.agentId, "busy");
    return updatedTask;
  }

  function markTaskCompleted(task, result) {
    const timestamp = isoNow();
    const updatedTask = {
      ...task,
      status: "completed",
      result,
      lastError: null,
      updatedAt: timestamp,
      completedAt: timestamp,
      nextRetryAt: null,
    };

    tasksStore.set(updatedTask);
    setAgentStatus(updatedTask.agentId, "idle");
    return updatedTask;
  }

  function markTaskFailure(task, error) {
    const timestamp = isoNow();
    const canRetry = task.attemptCount < task.maxAttempts;
    const updatedTask = {
      ...task,
      status: canRetry ? "retrying" : "failed",
      result: null,
      lastError: error.message,
      updatedAt: timestamp,
      completedAt: canRetry ? null : timestamp,
      nextRetryAt: canRetry ? new Date(now().getTime() + retryDelayMs).toISOString() : null,
    };

    tasksStore.set(updatedTask);
    setAgentStatus(updatedTask.agentId, "idle");
    return updatedTask;
  }

  function recoverInterruptedTasks() {
    const timestamp = isoNow();

    tasksStore
      .list()
      .filter((task) => task.status === "running")
      .forEach((task) => {
        const canRetry = task.attemptCount < task.maxAttempts;
        const recoveredTask = {
          ...task,
          status: canRetry ? "retrying" : "failed",
          updatedAt: timestamp,
          completedAt: canRetry ? null : timestamp,
          nextRetryAt: canRetry ? timestamp : null,
          lastError: task.lastError || "Execution interrupted before completion",
        };

        tasksStore.set(recoveredTask);
        setAgentStatus(task.agentId, "idle");
      });
  }

  async function runTask(task) {
    const startedTask = startTask(task);

    try {
      const result = await executor(startedTask, { attempt: startedTask.attemptCount });
      return markTaskCompleted(startedTask, result);
    } catch (error) {
      return markTaskFailure(startedTask, error);
    }
  }

  async function runDueTasks() {
    if (activeRun) {
      return activeRun;
    }

    const dueTask = getNextDueTask();
    if (!dueTask) {
      return null;
    }

    activeRun = runTask(dueTask)
      .finally(() => {
        activeRun = null;
      });

    return activeRun;
  }

  function startWorker() {
    if (workerInterval) {
      return;
    }

    workerInterval = setIntervalFn(() => {
      void runDueTasks();
    }, pollIntervalMs);

    void runDueTasks();
  }

  async function stopWorker() {
    if (workerInterval) {
      clearIntervalFn(workerInterval);
      workerInterval = null;
    }

    if (activeRun) {
      await activeRun;
    }
  }

  async function waitForTaskStatus(id, statuses, options = {}) {
    const expectedStatuses = Array.isArray(statuses) ? statuses : [statuses];
    const timeoutMs = options.timeoutMs || 4000;
    const intervalMs = options.intervalMs || 20;
    const startedAt = now().getTime();

    return new Promise((resolve, reject) => {
      function inspect() {
        const task = getTask(id);
        if (task && expectedStatuses.includes(task.status)) {
          resolve(task);
          return;
        }

        if (now().getTime() - startedAt >= timeoutMs) {
          reject(new Error(`Timed out waiting for task ${id} to reach ${expectedStatuses.join(", ")}`));
          return;
        }

        setTimeoutFn(inspect, intervalMs);
      }

      inspect();
    });
  }

  function getWorkerState() {
    return {
      running: Boolean(workerInterval),
      activeTaskId: null,
    };
  }

  return {
    listTasks,
    getTask,
    createTask,
    updateTask,
    recoverInterruptedTasks,
    runDueTasks,
    startWorker,
    stopWorker,
    waitForTaskStatus,
    getWorkerState,
  };
}

module.exports = createTaskService;
