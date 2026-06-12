const app = require("./app");
const config = require("./config");
const agentsStore = require("./stores/agentsStore");
const tasksStore = require("./stores/tasksStore");

agentsStore.load();
tasksStore.load();

app.listen(config.port, () => {
  console.log(`Zentrix API running on http://localhost:${config.port} [${config.nodeEnv}]`);
});
