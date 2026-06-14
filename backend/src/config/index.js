require("dotenv").config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 4000,
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "postgresql://zentrix:zentrix@localhost:5432/zentrix",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  dataDir: process.env.DATA_DIR || "data",
  taskWorkerPollIntervalMs: parseInt(process.env.TASK_WORKER_POLL_INTERVAL_MS, 10) || 200,
  taskExecutionDelayMs: parseInt(process.env.TASK_EXECUTION_DELAY_MS, 10) || 150,
  taskRetryDelayMs: parseInt(process.env.TASK_RETRY_DELAY_MS, 10) || 250,
  taskMaxAttempts: parseInt(process.env.TASK_MAX_ATTEMPTS, 10) || 2,
};
