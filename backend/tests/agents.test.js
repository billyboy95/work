const request = require("supertest");
const app = require("../src/app");
const { resetAgentsStore } = require("../src/stores/agentsStore");

describe("Agents API", () => {
  let agentId;

  beforeEach(async () => {
    resetAgentsStore();

    const res = await request(app)
      .post("/api/agents")
      .send({ name: "Seed Agent", description: "Fixture agent", model: "gpt-4" });

    agentId = res.body.id;
  });

  it("GET /api/agents returns agent list", async () => {
    const res = await request(app).get("/api/agents");
    expect(res.status).toBe(200);
    expect(res.body.agents).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: agentId, name: "Seed Agent" })]),
    );
  });

  it("POST /api/agents creates an agent", async () => {
    const res = await request(app)
      .post("/api/agents")
      .send({ name: "Test Agent", description: "A test agent", model: "gpt-4" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.name).toBe("Test Agent");
  });

  it("GET /api/agents/:id returns the agent", async () => {
    const res = await request(app).get(`/api/agents/${agentId}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Seed Agent");
  });

  it("PUT /api/agents/:id updates the agent", async () => {
    const res = await request(app)
      .put(`/api/agents/${agentId}`)
      .send({ name: "Updated Agent" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated Agent");
  });

  it("DELETE /api/agents/:id removes the agent", async () => {
    const res = await request(app).delete(`/api/agents/${agentId}`);
    expect(res.status).toBe(204);
  });

  it("GET /api/agents/:id returns 404 for deleted agent", async () => {
    await request(app).delete(`/api/agents/${agentId}`);
    const res = await request(app).get(`/api/agents/${agentId}`);
    expect(res.status).toBe(404);
  });

  it("POST /api/agents without name returns 400", async () => {
    const res = await request(app).post("/api/agents").send({});
    expect(res.status).toBe(400);
  });
});
