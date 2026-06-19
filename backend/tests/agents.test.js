const request = require("supertest");
const app = require("../src/app");
const { agents } = require("../src/stores/agentsStore");
const { tasks } = require("../src/stores/tasksStore");

describe("Agents API", () => {
  beforeEach(() => {
    agents.clear();
    tasks.clear();
  });

  it("GET /api/agents returns empty list", async () => {
    const res = await request(app).get("/api/agents");
    expect(res.status).toBe(200);
    expect(res.body.agents).toEqual([]);
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
    const createRes = await request(app)
      .post("/api/agents")
      .send({ name: "Test Agent", description: "A test agent" });
    const res = await request(app).get(`/api/agents/${createRes.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Test Agent");
  });

  it("PUT /api/agents/:id updates the agent", async () => {
    const createRes = await request(app).post("/api/agents").send({ name: "Test Agent" });
    const res = await request(app)
      .put(`/api/agents/${createRes.body.id}`)
      .send({ name: "Updated Agent" });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated Agent");
  });

  it("DELETE /api/agents/:id removes the agent", async () => {
    const createRes = await request(app).post("/api/agents").send({ name: "Test Agent" });
    const res = await request(app).delete(`/api/agents/${createRes.body.id}`);

    expect(res.status).toBe(204);
  });

  it("GET /api/agents/:id returns 404 for deleted agent", async () => {
    const createRes = await request(app).post("/api/agents").send({ name: "Test Agent" });
    await request(app).delete(`/api/agents/${createRes.body.id}`);

    const res = await request(app).get(`/api/agents/${createRes.body.id}`);
    expect(res.status).toBe(404);
  });

  it("POST /api/agents without name returns 400", async () => {
    const res = await request(app).post("/api/agents").send({});
    expect(res.status).toBe(400);
  });

  it("DELETE /api/agents/:id unassigns linked tasks", async () => {
    const agentRes = await request(app)
      .post("/api/agents")
      .send({ name: "Assigned Agent" });
    const taskRes = await request(app)
      .post("/api/tasks")
      .send({ title: "Assigned Task", agentId: agentRes.body.id });

    const deleteRes = await request(app).delete(`/api/agents/${agentRes.body.id}`);
    expect(deleteRes.status).toBe(204);

    const taskLookupRes = await request(app).get(`/api/tasks/${taskRes.body.id}`);
    expect(taskLookupRes.status).toBe(200);
    expect(taskLookupRes.body.agentId).toBeNull();
  });
});
