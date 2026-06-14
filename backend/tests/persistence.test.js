const request = require("supertest");
const createTestRuntime = require("./helpers/createTestRuntime");

describe("Persistence", () => {
  it("reloads persisted agents and completed tasks from disk", async () => {
    const firstRuntime = createTestRuntime();

    const agentRes = await request(firstRuntime.app)
      .post("/api/agents")
      .send({ name: "Persistent Agent", description: "Stays on disk" });

    firstRuntime.taskService.startWorker();

    const taskRes = await request(firstRuntime.app)
      .post("/api/tasks")
      .send({ title: "Persistent task", agentId: agentRes.body.id });

    await firstRuntime.taskService.waitForTaskStatus(taskRes.body.id, "completed", {
      timeoutMs: 3000,
    });

    await firstRuntime.cleanup({ removeDataDir: false });

    const secondRuntime = createTestRuntime({ dataDir: firstRuntime.dataDir });

    const agentsRes = await request(secondRuntime.app).get("/api/agents");
    const tasksRes = await request(secondRuntime.app).get("/api/tasks");

    expect(agentsRes.status).toBe(200);
    expect(tasksRes.status).toBe(200);
    expect(agentsRes.body.agents).toHaveLength(1);
    expect(tasksRes.body.tasks).toHaveLength(1);
    expect(tasksRes.body.tasks[0].status).toBe("completed");
    expect(tasksRes.body.tasks[0].result).toContain("Executed");

    await secondRuntime.cleanup();
  });

  it("recovers interrupted running tasks on startup", async () => {
    const firstRuntime = createTestRuntime();

    const agentRes = await request(firstRuntime.app)
      .post("/api/agents")
      .send({ name: "Recovery Agent", description: "Recovers work" });

    const taskRes = await request(firstRuntime.app)
      .post("/api/tasks")
      .send({ title: "Recover this task", agentId: agentRes.body.id });

    firstRuntime.tasksStore.set({
      ...firstRuntime.tasksStore.get(taskRes.body.id),
      status: "running",
      attemptCount: 1,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await firstRuntime.cleanup({ removeDataDir: false });

    const secondRuntime = createTestRuntime({ dataDir: firstRuntime.dataDir });
    secondRuntime.taskService.startWorker();

    const recoveredTask = await secondRuntime.taskService.waitForTaskStatus(
      taskRes.body.id,
      "completed",
      { timeoutMs: 3000 },
    );

    expect(recoveredTask.status).toBe("completed");
    expect(recoveredTask.attemptCount).toBe(2);
    expect(recoveredTask.lastError).toBeNull();

    const agentState = await request(secondRuntime.app).get(`/api/agents/${agentRes.body.id}`);
    expect(agentState.status).toBe(200);
    expect(agentState.body.status).toBe("idle");

    await secondRuntime.cleanup();
  });
});
