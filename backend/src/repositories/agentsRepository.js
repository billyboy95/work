class AgentsRepository {
  constructor(pool) {
    this.pool = pool;
  }

  async list() {
    const result = await this.pool.query(`
      SELECT
        id,
        name,
        description,
        model,
        status,
        created_at AS "createdAt",
        updated_at AS "updatedAt"
      FROM agents
      ORDER BY created_at ASC
    `);

    return result.rows;
  }

  async getById(id) {
    const result = await this.pool.query(
      `
        SELECT
          id,
          name,
          description,
          model,
          status,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM agents
        WHERE id = $1
      `,
      [id]
    );

    return result.rows[0] || null;
  }

  async create(agent) {
    const result = await this.pool.query(
      `
        INSERT INTO agents (
          id,
          name,
          description,
          model,
          status,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING
          id,
          name,
          description,
          model,
          status,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      [
        agent.id,
        agent.name,
        agent.description,
        agent.model,
        agent.status,
        agent.createdAt,
        agent.updatedAt,
      ]
    );

    return result.rows[0];
  }

  async update(id, updates) {
    const current = await this.getById(id);
    if (!current) {
      return null;
    }

    const nextAgent = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const result = await this.pool.query(
      `
        UPDATE agents
        SET
          name = $2,
          description = $3,
          model = $4,
          status = $5,
          updated_at = $6
        WHERE id = $1
        RETURNING
          id,
          name,
          description,
          model,
          status,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
      `,
      [
        id,
        nextAgent.name,
        nextAgent.description,
        nextAgent.model,
        nextAgent.status,
        nextAgent.updatedAt,
      ]
    );

    return result.rows[0];
  }

  async delete(id) {
    const result = await this.pool.query("DELETE FROM agents WHERE id = $1", [id]);
    return result.rowCount > 0;
  }
}

module.exports = AgentsRepository;
