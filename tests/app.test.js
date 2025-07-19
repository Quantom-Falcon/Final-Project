const request = require('supertest');
const app = require('../app');

describe('POST /api/rewrite-resume', () => {
  it('should return an improved resume', async () => {
    const res = await request(app)
      .post('/api/rewrite-resume')
      .send({ resume: 'I am a developer.', job: 'Looking for a React engineer.' });

    expect(res.statusCode).toBe(200);
    expect(res.body.improvedResume).toBeDefined();
  });

  it('should return 400 for missing fields', async () => {
    const res = await request(app).post('/api/rewrite-resume').send({});
    expect(res.statusCode).toBe(400);
  });
});