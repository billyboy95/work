const fs = require("fs");
const os = require("os");
const path = require("path");

function createTestRuntime(options = {}) {
  const dataDir = options.dataDir || fs.mkdtempSync(path.join(os.tmpdir(), "zentrix-tests-"));

  jest.resetModules();

  const createRuntime = require("../../src/runtime");
  const runtime = createRuntime({
    config: {
      nodeEnv: "test",
      dataDir,
      taskWorkerPollIntervalMs: options.pollIntervalMs || 20,
      taskExecutionDelayMs: options.executionDelayMs || 20,
      taskRetryDelayMs: options.retryDelayMs || 25,
      taskMaxAttempts: options.taskMaxAttempts || 2,
    },
    executor: options.executor,
  });

  return {
    ...runtime,
    dataDir,
    async cleanup(options = {}) {
      await runtime.taskService.stopWorker();
      if (options.removeDataDir !== false) {
        fs.rmSync(dataDir, { recursive: true, force: true });
      }
    },
  };
}

module.exports = createTestRuntime;
