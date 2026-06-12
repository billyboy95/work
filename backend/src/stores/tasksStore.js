const path = require("path");
const config = require("../config");
const createJsonStore = require("./createJsonStore");

module.exports = createJsonStore(path.join(config.dataDir, "tasks.json"));
