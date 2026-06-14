const path = require("path");
const createApp = require("./createApp");
const defaultConfig = require("./config");
const createAgentsStore = require("./stores/agentsStore");
const createTasksStore = require("./stores/tasksStore");
const createTaskService = require("./services/taskService");
const executeTask = require("./services/taskExecutor");

function createRuntime(overrides = {}) {
  const config = {
    ...defaultConfig,
    ...(overrides.config || {}),
  };

  const agentsStore = overrides.agentsStore || createAgentsStore({
    filePath: overrides.agentsFilePath || path.join(config.dataDir, "agents.json"),
  });
  const tasksStore = overrides.tasksStore || createTasksStore({
    filePath: overrides.tasksFilePath || path.join(config.dataDir, "tasks.json"),
  });

  const taskService = overrides.taskService || createTaskService({
    tasksStore,
    agentsStore,
    maxAttempts: config.taskMaxAttempts,
    pollIntervalMs: config.taskWorkerPollIntervalMs,
    retryDelayMs: config.taskRetryDelayMs,
    executor: overrides.executor || ((task, context) => {
      return executeTask(task, {
        ...context,
        delayMs: config.taskExecutionDelayMs,
      });
    }),
  });

  const app = createApp({
    agentsStore,
    taskService,
    nodeEnv: config.nodeEnv,
  });

  return {
    app,
    config,
    agentsStore,
    tasksStore,
    taskService,
  };
}

module.exports = createRuntime;
