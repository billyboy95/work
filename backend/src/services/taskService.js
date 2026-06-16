const { v4: uuidv4 } = require("uuid");
const { executeTask } = require("./taskExecutor");

const RETRY_DELAY_MS = 500;
const TERMINAL_STATUSES = new Set(["completed", "failed"]);
const ACTIVE_STATUSES = new Set(["pending", "retrying", "running"]);

function nowIso() {
  return new Date().toISOString();
}

function sortByCreatedAtDescending(records) {
  return [...records].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function createTaskService({ agentsStore, tasksStore, maxAttempts = 2 }) {
  let activeTickPromise = null;

  function listTasks() {
    return sortByCreatedAtDescending(tasksStore.list());
  }

  function getTask(id) {
    return tasksStore.get(id);
  }

  function createTask({ title, description = "", agentId = null }) {
    if (!title) {
      const error = new Error("title is required");
      error.statusCode = 400;
      throw error;
    }

    if (agentId && !agentsStore.get(agentId)) {
      const error = new Error("Assigned agent not found");
      error.statusCode = 400;
      throw error;
    }

    const timestamp = nowIso();
    const task = {
      id: uuidv4(),
      title,
      description,
      agentId,
      status: "pending",
      result: null,
      lastError: null,
      attemptCount: 0,
      maxAttempts,
      startedAt: null,
      completedAt: null,
      nextRetryAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    tasksStore.set(task);
    return task;
  }

  function syncAgentStatus(task, status) {
    if (!task.agentId) {
      return;
    }

    const agent = agentsStore.get(task.agentId);
    if (!agent) {
      return;
    }

    const nextAgentStatus = status === "running" ? "busy" : "idle";
    agentsStore.set({
      ...agent,
      status: nextAgentStatus,
      updatedAt: nowIso(),
    });
  }

  function updateTaskStatus(id, patch) {
    const task = tasksStore.get(id);
    if (!task) {
      const error = new Error("Task not found");
      error.statusCode = 404;
      throw error;
    }

    const nextTask = {
      ...task,
      ...patch,
      updatedAt: nowIso(),
    };

    if (patch.status === "running" && !nextTask.startedAt) {
      nextTask.startedAt = nextTask.updatedAt;
    }

    if (patch.status && TERMINAL_STATUSES.has(patch.status) && !nextTask.completedAt) {
      nextTask.completedAt = nextTask.updatedAt;
    }

    if (patch.status === "pending") {
      nextTask.startedAt = null;
      nextTask.completedAt = null;
      nextTask.nextRetryAt = null;
    }

    tasksStore.set(nextTask);

    if (patch.status) {
      syncAgentStatus(nextTask, patch.status);
    }

    return nextTask;
  }

  async function processTask(task) {
    const latestTask = tasksStore.get(task.id);
    if (!latestTask || !ACTIVE_STATUSES.has(latestTask.status)) {
      return;
    }

    const agent = latestTask.agentId ? agentsStore.get(latestTask.agentId) : null;
    if (latestTask.agentId && !agent) {
      updateTaskStatus(latestTask.id, {
        status: "failed",
        lastError: "Assigned agent is missing.",
      });
      return;
    }

    const runningTask = updateTaskStatus(latestTask.id, {
      status: "running",
      startedAt: latestTask.startedAt || nowIso(),
      completedAt: null,
      nextRetryAt: null,
      attemptCount: latestTask.attemptCount + 1,
      lastError: null,
    });

    try {
      const result = await executeTask(runningTask, agent);
      updateTaskStatus(runningTask.id, {
        status: "completed",
        result,
        lastError: null,
      });
    } catch (error) {
      const nextAttemptCount = runningTask.attemptCount;
      if (nextAttemptCount < runningTask.maxAttempts) {
        updateTaskStatus(runningTask.id, {
          status: "retrying",
          result: null,
          lastError: error.message,
          nextRetryAt: new Date(Date.now() + RETRY_DELAY_MS).toISOString(),
        });
      } else {
        updateTaskStatus(runningTask.id, {
          status: "failed",
          result: null,
          lastError: error.message,
        });
      }
    }
  }

  function getNextEligibleTask() {
    return tasksStore
      .list()
      .filter((task) => {
        if (task.status === "pending") {
          return true;
        }

        if (task.status === "retrying" && task.nextRetryAt) {
          return task.nextRetryAt <= nowIso();
        }

        return false;
      })
      .sort((left, right) => left.createdAt.localeCompare(right.createdAt))[0];
  }

  async function tick() {
    if (activeTickPromise) {
      return activeTickPromise;
    }

    activeTickPromise = (async () => {
      const nextTask = getNextEligibleTask();
      if (!nextTask) {
        return;
      }

      await processTask(nextTask);
    })().finally(() => {
      activeTickPromise = null;
    });

    return activeTickPromise;
  }

  function waitForIdle() {
    return activeTickPromise || Promise.resolve();
  }

  function recoverInterruptedTasks() {
    const timestamp = nowIso();
    const tasks = tasksStore.list().map((task) => {
      if (task.status !== "running") {
        return task;
      }

      syncAgentStatus(task, "idle");

      const canRetry = task.attemptCount < task.maxAttempts;

      return {
        ...task,
        status: canRetry ? "retrying" : "failed",
        lastError: "Recovered after an interrupted worker run.",
        nextRetryAt: canRetry ? timestamp : null,
        completedAt: canRetry ? null : timestamp,
        updatedAt: timestamp,
      };
    });

    tasksStore.replaceAll(tasks);
    return tasks.filter((task) => task.lastError === "Recovered after an interrupted worker run.").length;
  }

  return {
    listTasks,
    getTask,
    createTask,
    updateTaskStatus,
    tick,
    waitForIdle,
    recoverInterruptedTasks,
  };
}

module.exports = { createTaskService };
