const request = require("supertest");
const { createTestContext } = require("./testApp");

describe("Health API", () => {
  let context;

  beforeEach(async () => {
    context = await createTestContext();
  });

  afterEach(async () => {
    await context.pool.end();
  });

  it("GET /api/health returns ok", async () => {
    const res = await request(context.app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body).toHaveProperty("timestamp");
  });
});
