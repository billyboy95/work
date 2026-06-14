const createRuntime = require("./runtime");

const runtime = createRuntime();

module.exports = runtime.app;
module.exports.runtime = runtime;
module.exports.createRuntime = createRuntime;
