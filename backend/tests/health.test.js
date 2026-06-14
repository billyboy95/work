const request = require("supertest");
const createTestRuntime = require("./helpers/createTestRuntime");

describe("Health API", () => {
  let runtime;

  beforeEach(() => {
    runtime = createTestRuntime();
  });

  afterEach(async () => {
    await runtime.cleanup();
  });

  it("GET /api/health returns ok", async () => {
    const res = await request(runtime.app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body).toHaveProperty("timestamp");
  });
});
