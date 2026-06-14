const path = require("path");
const config = require("../config");
const createJsonStore = require("./createJsonStore");

function createAgentsStore(options = {}) {
  const store = createJsonStore({
    filePath: options.filePath || path.join(config.dataDir, "agents.json"),
  });

  store.init();
  return store;
}

module.exports = createAgentsStore;
