const { Pool } = require("pg");
const config = require("../config");

function createPool(connectionString = config.databaseUrl) {
  return new Pool({
    connectionString,
  });
}

module.exports = {
  createPool,
};
