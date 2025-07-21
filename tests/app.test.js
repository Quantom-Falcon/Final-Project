const request = require("supertest");
const app = require("../app");
const path = require("path");

describe("POST /api/upload-resume", () => {
  it("should return 200 and expected fields with valid PDF and job description", async () => {
    const res = await request(app)
      .post("/api/upload-resume")
      .field("jobDescription", "Looking for a frontend React engineer")
      .attach("resumeFile", path.join(__dirname, "sample.pdf")); // <- make sure this file exists

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("improvedResume");
    expect(res.body).toHaveProperty("score");
    expect(res.body).toHaveProperty("improvements");
    expect(res.body).toHaveProperty("suggestions");
  });

  it("should return 400 if PDF is missing", async () => {
    const res = await request(app)
      .post("/api/upload-resume")
      .field("jobDescription", "Frontend dev");

    expect(res.statusCode).toBe(400);
  });

  it("should return 400 if job description is missing", async () => {
    const res = await request(app)
      .post("/api/upload-resume")
      .attach("resumeFile", path.join(__dirname, "sample.pdf"));

    expect(res.statusCode).toBe(400);
  });
});
