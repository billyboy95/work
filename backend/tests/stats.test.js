const request = require("supertest");
const app = require("../src/app");
const { resetAgentsStore, getAgent, setAgent } = require("../src/stores/agentsStore");
const { resetTasksStore, getTask, setTask } = require("../src/stores/tasksStore");

describe("Stats API", () => {
  beforeEach(() => {
    resetAgentsStore();
    resetTasksStore();
  });

  it("GET /api/stats returns aggregate operational summaries", async () => {
    const createdAgent = await request(app)
      .post("/api/agents")
      .send({ name: "Ops Agent", description: "Handles triage", model: "gpt-4" });

    const busyAgent = {
      ...getAgent(createdAgent.body.id),
      status: "busy",
      updatedAt: "2026-06-17T07:00:00.000Z",
    };
    setAgent(busyAgent);

    const pendingTask = await request(app)
      .post("/api/tasks")
      .send({ title: "Review lead list", description: "Sync CRM records" });

    const runningTask = await request(app)
      .post("/api/tasks")
      .send({ title: "Prepare proposal", description: "Generate customer draft" });

    await request(app)
      .put(`/api/tasks/${runningTask.body.id}/status`)
      .send({ status: "running" });

    const completedTask = await request(app)
      .post("/api/tasks")
      .send({ title: "Send invoice", description: "Completed handoff" });

    await request(app)
      .put(`/api/tasks/${completedTask.body.id}/status`)
      .send({ status: "completed", result: "Invoice sent" });

    const stalePending = {
      ...getTask(pendingTask.body.id),
      createdAt: "2026-06-17T06:45:00.000Z",
      updatedAt: "2026-06-17T06:45:00.000Z",
    };
    setTask(stalePending);

    const staleRunning = {
      ...getTask(runningTask.body.id),
      startedAt: "2026-06-17T06:30:00.000Z",
      updatedAt: "2026-06-17T06:30:00.000Z",
    };
    setTask(staleRunning);

    const dateNowSpy = jest.spyOn(Date, "now").mockReturnValue(
      new Date("2026-06-17T07:05:30.000Z").valueOf(),
    );

    const res = await request(app).get("/api/stats");

    dateNowSpy.mockRestore();

    expect(res.status).toBe(200);
    expect(res.body).toEqual(
      expect.objectContaining({
        generatedAt: expect.any(String),
        uptimeSeconds: expect.any(Number),
        tasks: {
          total: 3,
          byStatus: {
            pending: 1,
            running: 1,
            completed: 1,
            failed: 0,
          },
          stale: {
            pendingOlderThan5m: 1,
            runningOlderThan15m: 1,
          },
        },
        agents: {
          total: 1,
          byStatus: {
            idle: 0,
            busy: 1,
          },
        },
      }),
    );
  });
});
