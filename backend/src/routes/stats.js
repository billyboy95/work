const { Router } = require("express");
const { listAgents } = require("../stores/agentsStore");
const { listTasks } = require("../stores/tasksStore");

const router = Router();

const DEFAULT_TASK_STATUSES = ["pending", "running", "completed", "failed"];
const DEFAULT_AGENT_STATUSES = ["idle", "busy"];
const PENDING_STALE_MS = 5 * 60 * 1000;
const RUNNING_STALE_MS = 15 * 60 * 1000;

const buildStatusCounts = (items, defaultStatuses) => {
  const counts = Object.fromEntries(defaultStatuses.map((status) => [status, 0]));

  items.forEach((item) => {
    const status = item.status || "unknown";
    counts[status] = (counts[status] || 0) + 1;
  });

  return counts;
};

const isOlderThan = (timestamp, thresholdMs, nowMs) => {
  const parsed = Date.parse(timestamp);

  if (Number.isNaN(parsed)) {
    return false;
  }

  return nowMs - parsed > thresholdMs;
};

router.get("/", (_req, res) => {
  const generatedAt = new Date().toISOString();
  const nowMs = Date.now();
  const tasks = listTasks();
  const agents = listAgents();

  const pendingOlderThan5m = tasks.filter(
    (task) =>
      task.status === "pending" &&
      isOlderThan(task.createdAt || task.updatedAt, PENDING_STALE_MS, nowMs),
  ).length;

  const runningOlderThan15m = tasks.filter(
    (task) =>
      task.status === "running" &&
      isOlderThan(task.startedAt || task.updatedAt || task.createdAt, RUNNING_STALE_MS, nowMs),
  ).length;

  res.json({
    generatedAt,
    uptimeSeconds: Math.floor(process.uptime()),
    tasks: {
      total: tasks.length,
      byStatus: buildStatusCounts(tasks, DEFAULT_TASK_STATUSES),
      stale: {
        pendingOlderThan5m,
        runningOlderThan15m,
      },
    },
    agents: {
      total: agents.length,
      byStatus: buildStatusCounts(agents, DEFAULT_AGENT_STATUSES),
    },
  });
});

module.exports = router;
