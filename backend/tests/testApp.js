const { newDb } = require("pg-mem");
const { createApp } = require("../src/app");
const { initializeDatabase } = require("../src/db/init");
const AgentsRepository = require("../src/repositories/agentsRepository");
const TasksRepository = require("../src/repositories/tasksRepository");

async function createTestContext() {
  const db = newDb();
  const { Pool } = db.adapters.createPg();
  const pool = new Pool();

  await initializeDatabase(pool);

  const dependencies = {
    agentRepository: new AgentsRepository(pool),
    taskRepository: new TasksRepository(pool),
  };

  return {
    app: createApp(dependencies),
    buildApp: () => createApp(dependencies),
    pool,
  };
}

module.exports = {
  createTestContext,
};
