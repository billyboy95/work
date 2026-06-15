const path = require("path");
const { createJsonStore } = require("./createJsonStore");

function createTasksStore({ dataDir }) {
  return createJsonStore(path.join(dataDir, "tasks.json"));
}

module.exports = { createTasksStore };
