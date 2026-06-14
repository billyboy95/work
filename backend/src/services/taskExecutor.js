function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function shouldFail(task) {
  const combinedInput = `${task.title} ${task.description}`.toLowerCase();
  return combinedInput.includes("fail");
}

async function executeTask(task, options = {}) {
  const { attempt = 1, delayMs = 150 } = options;

  await sleep(delayMs);

  if (shouldFail(task)) {
    throw new Error(`Execution failed for "${task.title}" on attempt ${attempt}`);
  }

  return `Executed "${task.title}" successfully on attempt ${attempt}.`;
}

module.exports = executeTask;
