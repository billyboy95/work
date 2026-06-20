const { Router } = require("express");
const { agents } = require("../stores/agentsStore");
const { tasks } = require("../stores/tasksStore");
const { syncAgentStatuses } = require("../utils/syncAgentStatuses");

const router = Router();

const taskStatuses = ["pending", "running", "completed", "failed"];
const agentStatuses = ["idle", "busy"];

function createStatusCounts(statuses) {
  return statuses.reduce((counts, status) => {
    counts[status] = 0;
    return counts;
  }, {});
}

function isOlderThan(isoTimestamp, thresholdMs) {
  if (!isoTimestamp) {
    return false;
  }

  const timestamp = Date.parse(isoTimestamp);
  if (Number.isNaN(timestamp)) {
    return false;
  }

  return Date.now() - timestamp > thresholdMs;
}

router.get("/", (_req, res) => {
  syncAgentStatuses(agents, tasks);
  const taskList = Array.from(tasks.values());
  const agentList = Array.from(agents.values());

  const tasksByStatus = createStatusCounts(taskStatuses);
  const agentsByStatus = createStatusCounts(agentStatuses);

  taskList.forEach((task) => {
    if (tasksByStatus[task.status] !== undefined) {
      tasksByStatus[task.status] += 1;
    }
  });

  agentList.forEach((agent) => {
    if (agentsByStatus[agent.status] !== undefined) {
      agentsByStatus[agent.status] += 1;
    }
  });

  const stale = {
    pendingOlderThan5m: taskList.filter(
      (task) => task.status === "pending" && isOlderThan(task.createdAt, 5 * 60 * 1000)
    ).length,
    runningOlderThan15m: taskList.filter(
      (task) =>
        task.status === "running" &&
        isOlderThan(task.startedAt || task.updatedAt || task.createdAt, 15 * 60 * 1000)
    ).length,
  };

  res.json({
    generatedAt: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    tasks: {
      total: taskList.length,
      byStatus: tasksByStatus,
      stale,
    },
    agents: {
      total: agentList.length,
      byStatus: agentsByStatus,
    },
  });
});

module.exports = router;
