const request = require("supertest");
const app = require("../src/app");
const { clearAgents } = require("../src/stores/agentsStore");
const { clearTasks } = require("../src/stores/tasksStore");

describe("Agents API", () => {
  beforeEach(() => {
    clearAgents();
    clearTasks();
  });

  let agentId;

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
    agentId = res.body.id;
  });

  it("GET /api/agents/:id returns the agent", async () => {
    const res = await request(app).get(`/api/agents/${agentId}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Test Agent");
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
    const res = await request(app).get(`/api/agents/${agentId}`);
    expect(res.status).toBe(404);
  });

  it("POST /api/agents without name returns 400", async () => {
    const res = await request(app).post("/api/agents").send({});
    expect(res.status).toBe(400);
  });

  it("DELETE /api/agents/:id unassigns linked tasks", async () => {
    const agent = await request(app)
      .post("/api/agents")
      .send({ name: "Assigned Agent" });

    const task = await request(app)
      .post("/api/tasks")
      .send({ title: "Assigned Task", agentId: agent.body.id });

    const deleted = await request(app).delete(`/api/agents/${agent.body.id}`);
    const fetchedTask = await request(app).get(`/api/tasks/${task.body.id}`);

    expect(deleted.status).toBe(204);
    expect(fetchedTask.body.agentId).toBeNull();
  });
});
