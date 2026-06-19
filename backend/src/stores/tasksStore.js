const tasks = new Map();

function agentHasRunningTasks(agentId, excludedTaskId = null) {
  for (const task of tasks.values()) {
    if (task.id === excludedTaskId) {
      continue;
    }

    if (task.agentId === agentId && task.status === "running") {
      return true;
    }
  }

  return false;
}

module.exports = {
  tasks,
  agentHasRunningTasks,
};
