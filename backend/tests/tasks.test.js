const request = require("supertest");
const app = require("../src/app");
const { agents } = require("../src/stores/agentsStore");
const { tasks } = require("../src/stores/tasksStore");

describe("Tasks API", () => {
  let agentId;

  beforeEach(async () => {
    agents.clear();
    tasks.clear();

    const agentRes = await request(app)
      .post("/api/agents")
      .send({ name: "Test Agent", description: "A test agent" });
    agentId = agentRes.body.id;
  });

  it("POST /api/tasks creates a task", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "Test Task", description: "A test task" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.title).toBe("Test Task");
    expect(res.body.status).toBe("pending");
  });

  it("GET /api/tasks lists tasks", async () => {
    await request(app).post("/api/tasks").send({ title: "Listed Task" });
    const res = await request(app).get("/api/tasks");

    expect(res.status).toBe(200);
    expect(res.body.tasks.length).toBeGreaterThan(0);
  });

  it("PUT /api/tasks/:id/status updates task status", async () => {
    const createRes = await request(app).post("/api/tasks").send({ title: "Update Me" });
    const res = await request(app)
      .put(`/api/tasks/${createRes.body.id}/status`)
      .send({ status: "completed", result: "Task done" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("completed");
  });

  it("POST /api/tasks without title returns 400", async () => {
    const res = await request(app).post("/api/tasks").send({});
    expect(res.status).toBe(400);
  });

  it("POST /api/tasks with assigned agent creates an assigned task", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "Assigned Task", agentId });

    expect(res.status).toBe(201);
    expect(res.body.agentId).toBe(agentId);
  });

  it("POST /api/tasks rejects an unknown agent", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "Broken Assignment", agentId: "missing-agent" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Agent not found");
  });

  it("PUT /api/tasks/:id updates the assigned agent", async () => {
    const createRes = await request(app).post("/api/tasks").send({ title: "Reassign Me" });
    const res = await request(app)
      .put(`/api/tasks/${createRes.body.id}`)
      .send({ agentId });

    expect(res.status).toBe(200);
    expect(res.body.agentId).toBe(agentId);
  });

  it("PUT /api/tasks/:id/status rejects invalid statuses", async () => {
    const createRes = await request(app).post("/api/tasks").send({ title: "Invalid Status" });
    const res = await request(app)
      .put(`/api/tasks/${createRes.body.id}/status`)
      .send({ status: "paused" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("Invalid status");
  });

  it("PUT /api/tasks/:id/status marks the assigned agent busy for running tasks", async () => {
    const createRes = await request(app)
      .post("/api/tasks")
      .send({ title: "Run Me", agentId });

    const res = await request(app)
      .put(`/api/tasks/${createRes.body.id}/status`)
      .send({ status: "running" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("running");

    const agentRes = await request(app).get(`/api/agents/${agentId}`);
    expect(agentRes.status).toBe(200);
    expect(agentRes.body.status).toBe("busy");
  });
});
