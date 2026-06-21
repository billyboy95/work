const { listAgents, setAgent } = require("../stores/agentsStore");
const { listTasks } = require("../stores/tasksStore");

function getAssignedRunningTaskCounts() {
  return listTasks().reduce((counts, task) => {
    if (task.agentId && task.status === "running") {
      counts.set(task.agentId, (counts.get(task.agentId) || 0) + 1);
    }
    return counts;
  }, new Map());
}

function syncAgentStatuses() {
  const runningTaskCounts = getAssignedRunningTaskCounts();

  for (const agent of listAgents()) {
    const nextStatus = runningTaskCounts.has(agent.id) ? "busy" : "idle";

    if (agent.status !== nextStatus) {
      setAgent({
        ...agent,
        status: nextStatus,
        updatedAt: new Date().toISOString(),
      });
    }
  }
}

module.exports = {
  getAssignedRunningTaskCounts,
  syncAgentStatuses,
};
