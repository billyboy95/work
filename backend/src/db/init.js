async function initializeDatabase(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS agents (
      id UUID PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      model TEXT NOT NULL,
      status TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id UUID PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      agent_id TEXT,
      status TEXT NOT NULL,
      result JSONB,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);
}

module.exports = {
  initializeDatabase,
};
