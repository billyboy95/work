const fs = require("fs");
const os = require("os");
const path = require("path");
const { createApp, createRuntime } = require("../src/app");

function createTestContext(options = {}) {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "zentrix-test-"));
  const runtime = createRuntime({
    dataDir,
    pollIntervalMs: 25,
    ...options,
  });
  const app = createApp(runtime);

  runtime.start();

  return {
    app,
    runtime,
    cleanup() {
      runtime.stop();
      fs.rmSync(dataDir, { recursive: true, force: true });
    },
  };
}

async function waitFor(check, { timeoutMs = 3000, intervalMs = 50 } = {}) {
  const startedAt = Date.now();
  let lastError = null;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      return await check();
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => {
        setTimeout(resolve, intervalMs);
      });
    }
  }

  throw lastError || new Error("Condition was not met before timeout.");
}

module.exports = {
  createTestContext,
  waitFor,
};
