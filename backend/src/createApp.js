const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const errorHandler = require("./middleware/errorHandler");
const healthRoutes = require("./routes/health");
const createAgentRoutes = require("./routes/agents");
const createTaskRoutes = require("./routes/tasks");

function createApp(runtime) {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  if (process.env.NODE_ENV !== "test") {
    app.use(morgan("dev"));
  }

  app.use("/api/health", healthRoutes);
  app.use("/api/agents", createAgentRoutes(runtime));
  app.use("/api/tasks", createTaskRoutes(runtime));

  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
