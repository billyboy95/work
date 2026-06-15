function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function executeTask(task, agent) {
  await delay(150);

  const text = `${task.title} ${task.description}`.toLowerCase();
  if (text.includes("fail")) {
    throw new Error("Simulated task failure triggered by task contents.");
  }

  const actor = agent ? `${agent.name} (${agent.model})` : "the system runner";
  return `Task "${task.title}" completed successfully by ${actor}.`;
}

module.exports = { executeTask };
