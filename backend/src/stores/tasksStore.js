const tasks = new Map();

const listTasks = () => Array.from(tasks.values());

const getTask = (id) => tasks.get(id);

const setTask = (task) => {
  tasks.set(task.id, task);
  return task;
};

const resetTasksStore = () => {
  tasks.clear();
};

module.exports = {
  listTasks,
  getTask,
  setTask,
  resetTasksStore,
};
