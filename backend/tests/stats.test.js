const request = require("supertest");
const app = require("../src/app");
const { agents } = require("../src/stores/agentsStore");
const { tasks } = require("../src/stores/tasksStore");

describe("Stats API", () => {
  beforeEach(() => {
    agents.clear();
    tasks.clear();
  });

  it("GET /api/stats returns an operational summary", async () => {
    const stalePendingTime = new Date(Date.now() - 6 * 60 * 1000).toISOString();
    const staleRunningTime = new Date(Date.now() - 16 * 60 * 1000).toISOString();
    const currentTime = new Date().toISOString();

    agents.set("agent-idle", {
      id: "agent-idle",
      name: "Idle Agent",
      description: "",
      model: "gpt-4",
      status: "idle",
      createdAt: currentTime,
      updatedAt: currentTime,
    });
    agents.set("agent-busy", {
      id: "agent-busy",
      name: "Busy Agent",
      description: "",
      model: "gpt-4",
      status: "busy",
      createdAt: currentTime,
      updatedAt: currentTime,
    });

    tasks.set("task-pending", {
      id: "task-pending",
      title: "Pending Task",
      description: "",
      agentId: null,
      status: "pending",
      result: null,
      createdAt: stalePendingTime,
      updatedAt: stalePendingTime,
      startedAt: null,
      completedAt: null,
      failedAt: null,
      statusHistory: [{ status: "pending", timestamp: stalePendingTime }],
    });
    tasks.set("task-running", {
      id: "task-running",
      title: "Running Task",
      description: "",
      agentId: "agent-busy",
      status: "running",
      result: null,
      createdAt: staleRunningTime,
      updatedAt: staleRunningTime,
      startedAt: staleRunningTime,
      completedAt: null,
      failedAt: null,
      statusHistory: [
        { status: "pending", timestamp: staleRunningTime },
        { status: "running", timestamp: staleRunningTime },
      ],
    });
    tasks.set("task-completed", {
      id: "task-completed",
      title: "Completed Task",
      description: "",
      agentId: null,
      status: "completed",
      result: "Done",
      createdAt: currentTime,
      updatedAt: currentTime,
      startedAt: currentTime,
      completedAt: currentTime,
      failedAt: null,
      statusHistory: [
        { status: "pending", timestamp: currentTime },
        { status: "running", timestamp: currentTime },
        { status: "completed", timestamp: currentTime },
      ],
    });

    const res = await request(app).get("/api/stats");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("generatedAt");
    expect(typeof res.body.uptimeSeconds).toBe("number");
    expect(res.body.tasks).toEqual({
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
    });
    expect(res.body.agents).toEqual({
      total: 2,
      byStatus: {
        idle: 1,
        busy: 1,
      },
    });
  });
});
