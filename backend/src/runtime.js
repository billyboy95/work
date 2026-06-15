const config = require("./config");
const { createAgentsStore } = require("./stores/agentsStore");
const { createTasksStore } = require("./stores/tasksStore");
const { createTaskService } = require("./services/taskService");

function createRuntime(options = {}) {
  const dataDir = options.dataDir || config.dataDir;
  const pollIntervalMs = options.pollIntervalMs || config.taskPollIntervalMs;
  const agentsStore = options.agentsStore || createAgentsStore({ dataDir });
  const tasksStore = options.tasksStore || createTasksStore({ dataDir });
  const taskService =
    options.taskService ||
    createTaskService({
      agentsStore,
      tasksStore,
      maxAttempts: options.maxAttempts,
    });

  let intervalHandle = null;

  return {
    dataDir,
    agentsStore,
    tasksStore,
    taskService,
    start() {
      if (intervalHandle) {
        return;
      }

      taskService.recoverInterruptedTasks();
      intervalHandle = setInterval(() => {
        taskService.tick().catch((error) => {
          console.error("Task worker tick failed:", error);
        });
      }, pollIntervalMs);
    },
    async flush() {
      await taskService.tick();
    },
    async waitForIdle() {
      await taskService.waitForIdle();
    },
    stop() {
      if (!intervalHandle) {
        return;
      }

      clearInterval(intervalHandle);
      intervalHandle = null;
    },
  };
}

module.exports = { createRuntime };
