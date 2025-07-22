const request = require("supertest");
const app = require("../app"); // ✅ make sure this is here

describe("POST /api/rewrite-resume", () => {
  it("should return 400 for missing fields", async () => {
    const res = await request(app).post('/api/rewrite-resume').send({});
    expect(res.statusCode).toBe(400);
  });
});
