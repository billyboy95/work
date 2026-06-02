const request = require("supertest");
const { createTestContext } = require("./testApp");

describe("Tasks API", () => {
  let context;

  beforeEach(async () => {
    context = await createTestContext();
  });

  afterEach(async () => {
    await context.pool.end();
  });

  it("POST /api/tasks creates and lists a task", async () => {
    const createRes = await request(context.app)
      .post("/api/tasks")
      .send({ title: "Test Task", description: "A test task" });
    expect(createRes.status).toBe(201);
    expect(createRes.body).toHaveProperty("id");
    expect(createRes.body.title).toBe("Test Task");
    expect(createRes.body.status).toBe("pending");

    const listRes = await request(context.app).get("/api/tasks");
    expect(listRes.status).toBe(200);
    expect(listRes.body.tasks).toHaveLength(1);
    expect(listRes.body.tasks[0].id).toBe(createRes.body.id);
  });

  it("GET /api/tasks/:id returns the persisted task", async () => {
    const createRes = await request(context.app).post("/api/tasks").send({ title: "Test Task" });

    const getRes = await request(context.app).get(`/api/tasks/${createRes.body.id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.title).toBe("Test Task");
  });

  it("PUT /api/tasks/:id/status updates task status and result", async () => {
    const createRes = await request(context.app).post("/api/tasks").send({ title: "Test Task" });

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

  it("persists tasks across app re-instantiation", async () => {
    const createRes = await request(context.app).post("/api/tasks").send({ title: "Durable Task" });

    const restartedApp = context.buildApp();
    const getRes = await request(restartedApp).get(`/api/tasks/${createRes.body.id}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.title).toBe("Durable Task");
  });
});
