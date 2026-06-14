const createRuntime = require("./runtime");

const runtime = createRuntime();

runtime.taskService.startWorker();

runtime.app.listen(runtime.config.port, () => {
  console.log(
    `Zentrix API running on http://localhost:${runtime.config.port} [${runtime.config.nodeEnv}]`,
  );
});
