const request = require("supertest");
const { createTestContext } = require("./testUtils");

describe("Agents API", () => {
  let context;
  let agentId;

  beforeEach(() => {
    context = createTestContext();
  });

  afterEach(() => {
    context.cleanup();
  });

  it("GET /api/agents returns empty list", async () => {
    const res = await request(context.app).get("/api/agents");
    expect(res.status).toBe(200);
    expect(res.body.agents).toEqual([]);
  });

  it("POST /api/agents creates an agent", async () => {
    const res = await request(context.app)
      .post("/api/agents")
      .send({ name: "Test Agent", description: "A test agent", model: "gpt-4" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe("Test Agent");
    agentId = res.body.id;
  });

  it("GET /api/agents/:id returns the agent", async () => {
    const createRes = await request(context.app).post("/api/agents").send({ name: "Test Agent" });
    agentId = createRes.body.id;

    const res = await request(context.app).get(`/api/agents/${agentId}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Test Agent");
  });

  it("PUT /api/agents/:id updates the agent", async () => {
    const createRes = await request(context.app).post("/api/agents").send({ name: "Test Agent" });
    agentId = createRes.body.id;

    const res = await request(context.app)
      .put(`/api/agents/${agentId}`)
      .send({ name: "Updated Agent" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated Agent");
  });

  it("DELETE /api/agents/:id removes the agent", async () => {
    const createRes = await request(context.app).post("/api/agents").send({ name: "Test Agent" });
    agentId = createRes.body.id;

    const res = await request(context.app).delete(`/api/agents/${agentId}`);
    expect(res.status).toBe(204);
  });

  it("GET /api/agents/:id returns 404 for deleted agent", async () => {
    const createRes = await request(context.app).post("/api/agents").send({ name: "Test Agent" });
    agentId = createRes.body.id;
    await request(context.app).delete(`/api/agents/${agentId}`);

    const res = await request(context.app).get(`/api/agents/${agentId}`);
    expect(res.status).toBe(404);
  });

  it("POST /api/agents without name returns 400", async () => {
    const res = await request(context.app).post("/api/agents").send({});
    expect(res.status).toBe(400);
  });
});
