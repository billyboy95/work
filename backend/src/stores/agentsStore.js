const path = require("path");
const { createJsonStore } = require("./createJsonStore");

function createAgentsStore({ dataDir }) {
  return createJsonStore(path.join(dataDir, "agents.json"));
}

module.exports = { createAgentsStore };
