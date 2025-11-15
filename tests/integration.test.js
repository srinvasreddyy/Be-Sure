const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

afterEach(async () => {
  await User.deleteMany();
  await Vehicle.deleteMany();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Auth & Vehicle Flow', () => {
  let token;

  it('should register a user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
  });

  it('should search for a vehicle (Mock API response)', async () => {
    // Register first
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'car@example.com', password: 'password123' });
    token = regRes.body.token;

    // Mocking the vehicle search implies we might fail if no API key, 
    // but here we test validation. For real integration, we'd mock axios.
    // Here we test missing VRM validation.
    const res = await request(app)
      .post('/api/vehicle/search')
      .set('Authorization', `Bearer ${token}`)
      .send({}); // Empty body
    
    expect(res.statusCode).toEqual(400);
  });
});