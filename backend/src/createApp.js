const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const errorHandler = require("./middleware/errorHandler");
const healthRoutes = require("./routes/health");
const createAgentsRouter = require("./routes/agents");
const createTasksRouter = require("./routes/tasks");

function createApp({ agentsStore, taskService, nodeEnv }) {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  if (nodeEnv !== "test") {
    app.use(morgan("dev"));
  }

  app.use("/api/health", healthRoutes);
  app.use("/api/agents", createAgentsRouter({ agentsStore }));
  app.use("/api/tasks", createTasksRouter({ taskService }));

  app.use(errorHandler);

  return app;
}

module.exports = createApp;
