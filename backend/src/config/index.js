require("dotenv").config();
const path = require("path");

module.exports = {
  port: parseInt(process.env.PORT, 10) || 4000,
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "postgresql://zentrix:zentrix@localhost:5432/zentrix",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  dataDir: process.env.DATA_DIR || path.join(__dirname, "..", "..", "data"),
  taskPollIntervalMs: parseInt(process.env.TASK_POLL_INTERVAL_MS, 10) || 200,
};
