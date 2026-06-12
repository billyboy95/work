const fs = require("fs");
const os = require("os");
const path = require("path");
const request = require("supertest");

describe("Tasks API", () => {
  let app;
  let taskId;
  let dataDir;

  beforeAll(() => {
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "zentrix-tasks-"));
    process.env.DATA_DIR = dataDir;
    jest.resetModules();
    app = require("../src/app");
  });

  afterAll(() => {
    fs.rmSync(dataDir, { recursive: true, force: true });
    delete process.env.DATA_DIR;
    jest.resetModules();
  });

  it("POST /api/tasks creates a task", async () => {
    const res = await request(app)
      .post("/api/tasks")
      .send({ title: "Test Task", description: "A test task" });
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.title).toBe("Test Task");
    expect(res.body.status).toBe("pending");
    taskId = res.body.id;
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
  });

  it("GET /api/tasks/:id returns the task", async () => {
    const res = await request(app).get(`/api/tasks/${taskId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(taskId);
  });

  it("PUT /api/tasks/:id/status returns 404 for missing task", async () => {
    const res = await request(app)
      .put("/api/tasks/missing-task/status")
      .send({ status: "completed" });
    expect(res.status).toBe(404);
  });

  it("POST /api/tasks without title returns 400", async () => {
    const res = await request(app).post("/api/tasks").send({});
    expect(res.status).toBe(400);
  });
});
