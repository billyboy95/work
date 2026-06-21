const tasks = new Map();

function listTasks() {
  return Array.from(tasks.values());
}

function getTask(id) {
  return tasks.get(id);
}

function setTask(task) {
  tasks.set(task.id, task);
  return task;
}

function clearTasks() {
  tasks.clear();
}

module.exports = {
  tasks,
  listTasks,
  getTask,
  setTask,
  clearTasks,
};
