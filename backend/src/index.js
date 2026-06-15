const { createApp, createRuntime } = require("./app");
const config = require("./config");

const runtime = createRuntime();
const app = createApp(runtime);

runtime.start();

app.listen(config.port, () => {
  console.log(`Zentrix API running on http://localhost:${config.port} [${config.nodeEnv}]`);
});
