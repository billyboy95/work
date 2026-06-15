const request = require("supertest");
const { createTestContext, waitFor } = require("./testUtils");

describe("Tasks API", () => {
  let context;

  beforeEach(() => {
    context = createTestContext();
  });

  afterEach(() => {
    context.cleanup();
  });

  it("POST /api/tasks creates a task", async () => {
    const res = await request(context.app)
      .post("/api/tasks")
      .send({ title: "Test Task", description: "A test task" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.title).toBe("Test Task");
    expect(res.body.status).toBe("pending");
    expect(res.body.attemptCount).toBe(0);
  });

  it("GET /api/tasks lists tasks", async () => {
    await request(context.app).post("/api/tasks").send({ title: "Listed Task" });

    const res = await request(context.app).get("/api/tasks");
    expect(res.status).toBe(200);
    expect(res.body.tasks.length).toBeGreaterThan(0);
  });

  it("PUT /api/tasks/:id/status updates task status", async () => {
    const createRes = await request(context.app).post("/api/tasks").send({ title: "Manual Task" });

    const res = await request(context.app)
      .put(`/api/tasks/${createRes.body.id}/status`)
      .send({ status: "completed", result: "Task done" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("completed");
    expect(res.body.result).toBe("Task done");
  });

  it("POST /api/tasks without title returns 400", async () => {
    const res = await request(context.app).post("/api/tasks").send({});
    expect(res.status).toBe(400);
  });

  it("automatically completes an assigned task and restores the agent to idle", async () => {
    const agentRes = await request(context.app)
      .post("/api/agents")
      .send({ name: "Ops Agent", model: "gpt-4o" });

    const taskRes = await request(context.app)
      .post("/api/tasks")
      .send({
        title: "Prepare onboarding checklist",
        description: "Create the checklist and summarize next steps.",
        agentId: agentRes.body.id,
      });

    const task = await waitFor(async () => {
      const res = await request(context.app).get(`/api/tasks/${taskRes.body.id}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("completed");
      return res.body;
    });

    expect(task.result).toContain("completed successfully");
    expect(task.attemptCount).toBe(1);
    expect(task.startedAt).toBeTruthy();
    expect(task.completedAt).toBeTruthy();

    const agentState = await request(context.app).get(`/api/agents/${agentRes.body.id}`);
    expect(agentState.status).toBe(200);
    expect(agentState.body.status).toBe("idle");
  });

  it("retries failing tasks before marking them failed", async () => {
    const taskRes = await request(context.app)
      .post("/api/tasks")
      .send({
        title: "Fail this task",
        description: "This should fail twice before stopping.",
      });

    const task = await waitFor(async () => {
      const res = await request(context.app).get(`/api/tasks/${taskRes.body.id}`);
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("failed");
      return res.body;
    });

    expect(task.attemptCount).toBe(task.maxAttempts);
    expect(task.lastError).toContain("Simulated task failure");
    expect(task.result).toBeNull();
  });

  it("recovers interrupted running tasks on startup", async () => {
    const task = context.runtime.taskService.createTask({
      title: "Recovered task",
      description: "Should resume after restart recovery",
    });

    context.runtime.tasksStore.set({
      ...task,
      status: "running",
      attemptCount: 1,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const recoveredCount = context.runtime.taskService.recoverInterruptedTasks();
    expect(recoveredCount).toBe(1);

    const recoveredTask = context.runtime.tasksStore.get(task.id);
    expect(recoveredTask.status).toBe("retrying");

    await context.runtime.flush();

    const resumedTask = context.runtime.tasksStore.get(task.id);
    expect(resumedTask.status).toBe("completed");
  });
});
