const request = require("supertest");
const app = require("../src/app");
const { clearAgents, setAgent } = require("../src/stores/agentsStore");
const { clearTasks } = require("../src/stores/tasksStore");

describe("Tasks API", () => {
  beforeEach(() => {
    clearAgents();
    clearTasks();
  });

  it("POST /api/tasks creates a task", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "Test Task", description: "A test task" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.title).toBe("Test Task");
    expect(res.body.status).toBe("pending");
    expect(res.body.startedAt).toBeNull();
    expect(res.body.completedAt).toBeNull();
    expect(res.body.failedAt).toBeNull();
    expect(res.body.statusHistory).toEqual([
      expect.objectContaining({ status: "pending" }),
    ]);
  });

  it("GET /api/tasks lists tasks", async () => {
    await request(app)
      .post("/api/tasks")
      .send({ title: "Listed Task" });

    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(200);
    expect(res.body.tasks.length).toBeGreaterThan(0);
  });

  it("PUT /api/tasks/:id/status updates task status", async () => {
    const created = await request(app)
      .post("/api/tasks")
      .send({ title: "Test Task", description: "A test task" });

    const res = await request(app)
      .put(`/api/tasks/${created.body.id}/status`)
      .send({ status: "completed", result: "Task done" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("completed");
    expect(res.body.completedAt).toBeTruthy();
    expect(res.body.result).toBe("Task done");
    expect(res.body.statusHistory).toEqual([
      expect.objectContaining({ status: "pending" }),
      expect.objectContaining({ status: "completed" }),
    ]);
  });

  it("POST /api/tasks without title returns 400", async () => {
    const res = await request(app).post("/api/tasks").send({});
    expect(res.status).toBe(400);
  });

  it("POST /api/tasks rejects unknown agent ids", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "Assigned Task", agentId: "missing-agent" });

    expect(res.status).toBe(400);
  });

  it("PUT /api/tasks/:id/status rejects invalid statuses", async () => {
    const created = await request(app)
      .post("/api/tasks")
      .send({ title: "Invalid Status Task" });

    const res = await request(app)
      .put(`/api/tasks/${created.body.id}/status`)
      .send({ status: "paused" });

    expect(res.status).toBe(400);
  });

  it("GET /api/tasks/:id returns created task", async () => {
    const created = await request(app)
      .post("/api/tasks")
      .send({ title: "Lookup Task" });

    const res = await request(app).get(`/api/tasks/${created.body.id}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(created.body.id);
  });

  it("updates agent status when an assigned task starts running", async () => {
    const agent = {
      id: "agent-1",
      name: "Test Agent",
      description: "",
      model: "gpt-4",
      status: "idle",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setAgent(agent);

    const created = await request(app)
      .post("/api/tasks")
      .send({ title: "Assigned Task", agentId: agent.id });

    const updatedTask = await request(app)
      .put(`/api/tasks/${created.body.id}/status`)
      .send({ status: "running" });

    const agentsResponse = await request(app).get("/api/agents");

    expect(updatedTask.status).toBe(200);
    expect(updatedTask.body.startedAt).toBeTruthy();
    expect(agentsResponse.body.agents).toEqual([
      expect.objectContaining({ id: agent.id, status: "busy" }),
    ]);
  });
});
