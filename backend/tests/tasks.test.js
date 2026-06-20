const request = require("supertest");
const app = require("../src/app");
const { agents } = require("../src/stores/agentsStore");
const { tasks } = require("../src/stores/tasksStore");

describe("Tasks API", () => {
  beforeEach(() => {
    agents.clear();
    tasks.clear();
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
    await request(app)
      .post("/api/tasks")
      .send({ title: "Listed Task", description: "Task for listing" });
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(200);
    expect(res.body.tasks.length).toBeGreaterThan(0);
  });

  it("PUT /api/tasks/:id/status updates task status", async () => {
    const createRes = await request(app)
      .post("/api/tasks")
      .send({ title: "Test Task", description: "A test task" });
    const res = await request(app)
      .put(`/api/tasks/${createRes.body.id}/status`)
      .send({ status: "completed", result: "Task done" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("completed");
    expect(res.body.result).toBe("Task done");
    expect(Array.isArray(res.body.statusHistory)).toBe(true);
  });

  it("POST /api/tasks without title returns 400", async () => {
    const res = await request(app).post("/api/tasks").send({});
    expect(res.status).toBe(400);
  });

  it("POST /api/tasks rejects unknown agent assignments", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "Assigned Task", agentId: "missing-agent-id" });

    expect(res.status).toBe(400);
  });

  it("PUT /api/tasks/:id/status rejects unsupported statuses", async () => {
    const createRes = await request(app)
      .post("/api/tasks")
      .send({ title: "Test Task", description: "A test task" });
    const res = await request(app)
      .put(`/api/tasks/${createRes.body.id}/status`)
      .send({ status: "blocked" });

    expect(res.status).toBe(400);
  });
});
