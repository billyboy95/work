function syncAgentStatuses(agents, tasks) {
  const busyAgentIds = new Set();

  for (const task of tasks.values()) {
    if (task.agentId && task.status === "running") {
      busyAgentIds.add(task.agentId);
    }
  }

  for (const agent of agents.values()) {
    agent.status = busyAgentIds.has(agent.id) ? "busy" : "idle";
  }
}

module.exports = { syncAgentStatuses };
