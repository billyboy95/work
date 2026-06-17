const request = require("supertest");
const app = require("../src/app");
const { resetTasksStore } = require("../src/stores/tasksStore");

describe("Tasks API", () => {
  let taskId;

  beforeEach(async () => {
    resetTasksStore();

    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "Seed Task", description: "Fixture task" });

    taskId = res.body.id;
  });

  it("POST /api/tasks creates a task", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "Test Task", description: "A test task" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.title).toBe("Test Task");
    expect(res.body.status).toBe("pending");
    expect(res.body.statusHistory).toEqual([
      expect.objectContaining({ status: "pending" }),
    ]);
  });

  it("GET /api/tasks lists tasks", async () => {
    const res = await request(app).get("/api/tasks");
    expect(res.status).toBe(200);
    expect(res.body.tasks.length).toBeGreaterThan(0);
  });

  it("PUT /api/tasks/:id/status updates task status", async () => {
    const res = await request(app)
      .put(`/api/tasks/${taskId}/status`)
      .send({ status: "completed", result: "Task done" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("completed");
    expect(res.body.result).toBe("Task done");
    expect(res.body.startedAt).toEqual(expect.any(String));
    expect(res.body.completedAt).toEqual(expect.any(String));
    expect(res.body.failedAt).toBeNull();
    expect(res.body.statusHistory).toEqual([
      expect.objectContaining({ status: "pending" }),
      expect.objectContaining({ status: "completed" }),
    ]);
  });

  it("POST /api/tasks without title returns 400", async () => {
    const res = await request(app).post("/api/tasks").send({});
    expect(res.status).toBe(400);
  });
});
