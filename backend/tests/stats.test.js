const request = require("supertest");
const app = require("../src/app");
const { clearAgents, setAgent } = require("../src/stores/agentsStore");
const { clearTasks, setTask } = require("../src/stores/tasksStore");

describe("Stats API", () => {
  beforeEach(() => {
    clearAgents();
    clearTasks();
  });

  it("GET /api/stats returns task and agent summaries", async () => {
    const now = Date.now();

    setAgent({
      id: "agent-1",
      name: "Runner",
      description: "",
      model: "gpt-4",
      status: "idle",
      createdAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString(),
    });

    setAgent({
      id: "agent-2",
      name: "Watcher",
      description: "",
      model: "gpt-4",
      status: "idle",
      createdAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString(),
    });

    setTask({
      id: "task-1",
      title: "Pending task",
      description: "",
      agentId: null,
      status: "pending",
      result: null,
      createdAt: new Date(now - 6 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 6 * 60 * 1000).toISOString(),
      startedAt: null,
      completedAt: null,
      failedAt: null,
      statusHistory: [{ status: "pending", timestamp: new Date(now - 6 * 60 * 1000).toISOString() }],
    });

    setTask({
      id: "task-2",
      title: "Running task",
      description: "",
      agentId: "agent-1",
      status: "running",
      result: null,
      createdAt: new Date(now - 20 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 20 * 60 * 1000).toISOString(),
      startedAt: new Date(now - 20 * 60 * 1000).toISOString(),
      completedAt: null,
      failedAt: null,
      statusHistory: [
        { status: "pending", timestamp: new Date(now - 21 * 60 * 1000).toISOString() },
        { status: "running", timestamp: new Date(now - 20 * 60 * 1000).toISOString() },
      ],
    });

    setTask({
      id: "task-3",
      title: "Completed task",
      description: "",
      agentId: null,
      status: "completed",
      result: "done",
      createdAt: new Date(now - 3 * 60 * 1000).toISOString(),
      updatedAt: new Date(now - 2 * 60 * 1000).toISOString(),
      startedAt: new Date(now - 3 * 60 * 1000).toISOString(),
      completedAt: new Date(now - 2 * 60 * 1000).toISOString(),
      failedAt: null,
      statusHistory: [
        { status: "pending", timestamp: new Date(now - 3 * 60 * 1000).toISOString() },
        { status: "running", timestamp: new Date(now - 2.5 * 60 * 1000).toISOString() },
        { status: "completed", timestamp: new Date(now - 2 * 60 * 1000).toISOString() },
      ],
    });

    const res = await request(app).get("/api/stats");

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
          total: 2,
          byStatus: {
            idle: 1,
            busy: 1,
          },
        },
      }),
    );
  });
});
