const request = require("supertest");
const createTestRuntime = require("./helpers/createTestRuntime");

describe("Tasks API", () => {
  let runtime;

  beforeEach(() => {
    runtime = createTestRuntime();
  });

  afterEach(async () => {
    await runtime.cleanup();
  });

  it("POST /api/tasks creates a task", async () => {
    const res = await request(runtime.app)
      .post("/api/tasks")
      .send({ title: "Test Task", description: "A test task" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.title).toBe("Test Task");
    expect(res.body.status).toBe("pending");
    expect(res.body.attemptCount).toBe(0);
    expect(res.body.maxAttempts).toBe(2);
  });

  it("GET /api/tasks lists tasks", async () => {
    await request(runtime.app)
      .post("/api/tasks")
      .send({ title: "Queued Task", description: "A test task" });

    const res = await request(runtime.app).get("/api/tasks");
    expect(res.status).toBe(200);
    expect(res.body.tasks.length).toBeGreaterThan(0);
  });

  it("PUT /api/tasks/:id/status updates task status", async () => {
    const createRes = await request(runtime.app)
      .post("/api/tasks")
      .send({ title: "Manual Task", description: "A test task" });

    const res = await request(runtime.app)
      .put(`/api/tasks/${createRes.body.id}/status`)
      .send({ status: "completed", result: "Task done", completedAt: new Date().toISOString() });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("completed");
    expect(res.body.result).toBe("Task done");
  });

  it("worker automatically completes a task and returns a result", async () => {
    runtime.taskService.startWorker();

    const createRes = await request(runtime.app)
      .post("/api/tasks")
      .send({ title: "Automated task", description: "Should complete" });

    const task = await runtime.taskService.waitForTaskStatus(
      createRes.body.id,
      "completed",
      { timeoutMs: 3000 },
    );

    expect(task.status).toBe("completed");
    expect(task.attemptCount).toBe(1);
    expect(task.result).toContain("Executed");
    expect(task.completedAt).toBeTruthy();
  });

  it("worker retries a failing task and marks it failed", async () => {
    runtime.taskService.startWorker();

    const createRes = await request(runtime.app)
      .post("/api/tasks")
      .send({ title: "Fail this task", description: "This should fail" });

    const task = await runtime.taskService.waitForTaskStatus(
      createRes.body.id,
      "failed",
      { timeoutMs: 3000 },
    );

    expect(task.status).toBe("failed");
    expect(task.attemptCount).toBe(2);
    expect(task.lastError).toContain("Execution failed");
    expect(task.completedAt).toBeTruthy();
  });

  it("assigned agent returns to idle after task completion", async () => {
    const agentRes = await request(runtime.app)
      .post("/api/agents")
      .send({ name: "Execution Agent", description: "Handles work" });

    runtime.taskService.startWorker();

    const taskRes = await request(runtime.app)
      .post("/api/tasks")
      .send({ title: "Agent task", agentId: agentRes.body.id });

    await runtime.taskService.waitForTaskStatus(taskRes.body.id, "completed", { timeoutMs: 3000 });

    const agentState = await request(runtime.app).get(`/api/agents/${agentRes.body.id}`);
    expect(agentState.status).toBe(200);
    expect(agentState.body.status).toBe("idle");
  });

  it("POST /api/tasks without title returns 400", async () => {
    const res = await request(runtime.app).post("/api/tasks").send({});
    expect(res.status).toBe(400);
  });

  it("POST /api/tasks rejects an unknown agentId", async () => {
    const res = await request(runtime.app)
      .post("/api/tasks")
      .send({ title: "Task", agentId: "missing-agent" });
    expect(res.status).toBe(400);
  });
});
