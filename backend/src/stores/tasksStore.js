const path = require("path");
const config = require("../config");
const createJsonStore = require("./createJsonStore");

function createTasksStore(options = {}) {
  const store = createJsonStore({
    filePath: options.filePath || path.join(config.dataDir, "tasks.json"),
  });

  store.init();
  return store;
}

module.exports = createTasksStore;
