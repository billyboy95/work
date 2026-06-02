const request = require("supertest");
const { createTestContext } = require("./testApp");

describe("Agents API", () => {
  let context;

  beforeEach(async () => {
    context = await createTestContext();
  });

  afterEach(async () => {
    await context.pool.end();
  });

  it("GET /api/agents returns empty list for a fresh database", async () => {
    const res = await request(context.app).get("/api/agents");
    expect(res.status).toBe(200);
    expect(res.body.agents).toEqual([]);
  });

  it("POST /api/agents creates and lists an agent", async () => {
    const createRes = await request(context.app)
      .post("/api/agents")
      .send({ name: "Test Agent", description: "A test agent", model: "gpt-4" });
    expect(createRes.status).toBe(201);
    expect(createRes.body).toHaveProperty("id");
    expect(createRes.body.name).toBe("Test Agent");

    const listRes = await request(context.app).get("/api/agents");
    expect(listRes.status).toBe(200);
    expect(listRes.body.agents).toHaveLength(1);
    expect(listRes.body.agents[0].id).toBe(createRes.body.id);
  });

  it("GET /api/agents/:id returns the persisted agent", async () => {
    const createRes = await request(context.app).post("/api/agents").send({ name: "Test Agent" });

    const getRes = await request(context.app).get(`/api/agents/${createRes.body.id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.name).toBe("Test Agent");
  });

  it("PUT /api/agents/:id updates the agent", async () => {
    const createRes = await request(context.app).post("/api/agents").send({ name: "Test Agent" });

    const res = await request(context.app)
      .put(`/api/agents/${createRes.body.id}`)
      .send({ name: "Updated Agent" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated Agent");
  });

  it("DELETE /api/agents/:id removes the agent", async () => {
    const createRes = await request(context.app).post("/api/agents").send({ name: "Test Agent" });

    const deleteRes = await request(context.app).delete(`/api/agents/${createRes.body.id}`);
    expect(deleteRes.status).toBe(204);

    const getRes = await request(context.app).get(`/api/agents/${createRes.body.id}`);
    expect(getRes.status).toBe(404);
  });

  it("POST /api/agents without name returns 400", async () => {
    const res = await request(context.app).post("/api/agents").send({});
    expect(res.status).toBe(400);
  });

  it("persists agents across app re-instantiation", async () => {
    const createRes = await request(context.app).post("/api/agents").send({ name: "Durable Agent" });

    const restartedApp = context.buildApp();
    const getRes = await request(restartedApp).get(`/api/agents/${createRes.body.id}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.name).toBe("Durable Agent");
  });
});
