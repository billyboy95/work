require("dotenv").config();

module.exports = {
  port: parseInt(process.env.PORT, 10) || 4000,
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "postgresql://zentrix:zentrix@localhost:5432/zentrix",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
};
