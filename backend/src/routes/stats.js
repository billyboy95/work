const { Router } = require("express");
const { listAgents } = require("../stores/agentsStore");
const { listTasks } = require("../stores/tasksStore");
const { syncAgentStatuses } = require("../utils/syncAgentStatuses");

const router = Router();

const PENDING_STALE_MS = 5 * 60 * 1000;
const RUNNING_STALE_MS = 15 * 60 * 1000;

function isOlderThan(timestamp, thresholdMs) {
  if (!timestamp) {
    return false;
  }

  return Date.now() - new Date(timestamp).getTime() > thresholdMs;
}

router.get("/", (_req, res) => {
  syncAgentStatuses();

  const tasks = listTasks();
  const agents = listAgents();

  const taskCountsByStatus = {
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
  };

  for (const task of tasks) {
    if (taskCountsByStatus[task.status] !== undefined) {
      taskCountsByStatus[task.status] += 1;
    }
  }

  const agentCountsByStatus = {
    idle: 0,
    busy: 0,
  };

  for (const agent of agents) {
    if (agentCountsByStatus[agent.status] !== undefined) {
      agentCountsByStatus[agent.status] += 1;
    }
  }

  const pendingOlderThan5m = tasks.filter(
    (task) => task.status === "pending" && isOlderThan(task.createdAt, PENDING_STALE_MS),
  ).length;

  const runningOlderThan15m = tasks.filter((task) => {
    if (task.status !== "running") {
      return false;
    }

    return isOlderThan(task.startedAt || task.updatedAt || task.createdAt, RUNNING_STALE_MS);
  }).length;

  res.json({
    generatedAt: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    tasks: {
      total: tasks.length,
      byStatus: taskCountsByStatus,
      stale: {
        pendingOlderThan5m,
        runningOlderThan15m,
      },
    },
    agents: {
      total: agents.length,
      byStatus: agentCountsByStatus,
    },
  });
});

module.exports = router;
