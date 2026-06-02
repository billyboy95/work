function serializeResult(result) {
  if (result === null) {
    return null;
  }

  return JSON.stringify(result);
}

class TasksRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async list() {
    const result = await this.pool.query(`
      SELECT
        id,
        title,
        description,
        agent_id AS "agentId",
        status,
        result,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM tasks
      ORDER BY created_at ASC
    `);

    return result.rows;
  }

  async getById(id) {
    const result = await this.pool.query(
      `
        SELECT
          id,
          title,
          description,
          agent_id AS "agentId",
          status,
          result,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM tasks
        WHERE id = $1
      `,
      [id]
    );

    return result.rows[0] || null;
  }

  async create(task) {
    const result = await this.pool.query(
      `
        INSERT INTO tasks (
          id,
          title,
          description,
          agent_id,
          status,
          result,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
        RETURNING
          id,
          title,
          description,
          agent_id AS "agentId",
          status,
          result,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      [
        task.id,
        task.title,
        task.description,
        task.agentId,
        task.status,
        serializeResult(task.result),
        task.createdAt,
        task.updatedAt,
      ]
    );

    return result.rows[0];
  }

  async updateStatus(id, updates) {
    const current = await this.getById(id);
    if (!current) {
      return null;
    }

    const nextTask = {
      ...current,
      status: updates.status || current.status,
      updatedAt: new Date().toISOString(),
    };

    if (Object.prototype.hasOwnProperty.call(updates, "result")) {
      nextTask.result = updates.result;
    }

    const result = await this.pool.query(
      `
        UPDATE tasks
        SET
          status = $2,
          result = $3::jsonb,
          updated_at = $4
        WHERE id = $1
        RETURNING
          id,
          title,
          description,
          agent_id AS "agentId",
          status,
          result,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      [id, nextTask.status, serializeResult(nextTask.result), nextTask.updatedAt]
    );

    return result.rows[0];
  }
}

module.exports = TasksRepository;
