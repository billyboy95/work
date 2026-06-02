const { createApp } = require("./app");
const config = require("./config");
const { createPool } = require("./db/createPool");
const { initializeDatabase } = require("./db/init");
const AgentsRepository = require("./repositories/agentsRepository");
const TasksRepository = require("./repositories/tasksRepository");

async function start() {
  const pool = createPool();

  await initializeDatabase(pool);

  const app = createApp({
    agentRepository: new AgentsRepository(pool),
    taskRepository: new TasksRepository(pool),
  });

  const server = app.listen(config.port, () => {
    console.log(`Zentrix API running on http://localhost:${config.port} [${config.nodeEnv}]`);
  });

  const closeServer = async () => {
    await pool.end();
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", closeServer);
  process.on("SIGTERM", closeServer);
}

start().catch((error) => {
  console.error("Failed to start Zentrix API", error);
  process.exit(1);
});
