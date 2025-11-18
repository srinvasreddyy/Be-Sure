const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const CarQuote = require('../models/CarQuote');

// Use test DB config from setup
beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
});

// Clear collections after each test
afterEach(async () => {
  await User.deleteMany();
  await CarQuote.deleteMany();
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('POST /api/quote/start', () => {
  let token;
  let userId;

  beforeEach(async () => {
    // Register a user and get token
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test@example.com', password: 'password123' });
    token = res.body.token;
    userId = res.body.user.id;
  });

  it('should return 401 if no token is provided', async () => {
    const res = await request(app)
      .post('/api/quote/start')
      .send({
        vehicleDetails: { plate: 'AB12 CDE' }
      });
    expect(res.statusCode).toEqual(401);
  });

  it('should return 400 if vehicleDetails are missing', async () => {
    const res = await request(app)
      .post('/api/quote/start')
      .set('Authorization', `Bearer ${token}`)
      .send({}); // Empty body
    
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toContain('"vehicleDetails" is required');
  });

  it('should create a new in-progress quote', async () => {
    const vehicleDetails = {
      plate: 'AB12 CDE',
      manufacturer: 'FORD',
      model: 'Focus'
    };

    const res = await request(app)
      .post('/api/quote/start')
      .set('Authorization', `Bearer ${token}`)
      .send({ vehicleDetails });

    expect(res.statusCode).toEqual(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('in-progress');
    expect(res.body.data.user).toBe(userId);
    expect(res.body.data.vehicleDetails.plate).toBe('AB12 CDE');
    
    // Verify it's in the DB
    const quote = await CarQuote.findById(res.body.data._id);
    expect(quote).toBeDefined();
    expect(quote.user.toString()).toBe(userId);
  });
});

describe('Quote Step Updates (e.g., /api/quote/:quoteId/driver-info)', () => {
  let token;
  let userId;
  let quoteId;

  // Helper to create a user and a quote before each test
  beforeEach(async () => {
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'test2@example.com', password: 'password123' });
    token = userRes.body.token;
    userId = userRes.body.user.id;

    const quoteRes = await request(app)
      .post('/api/quote/start')
      .set('Authorization', `Bearer ${token}`)
      .send({
        vehicleDetails: { plate: 'TEST1' }
      });
    quoteId = quoteRes.body.data._id;
  });

  it('should update the driverInfo step for the correct quote', async () => {
    const driverInfo = {
      postcode: 'SW1A 1AA',
      employmentStatus: 'Employed'
    };

    const res = await request(app)
      .post(`/api/quote/${quoteId}/driver-info`)
      .set('Authorization', `Bearer ${token}`)
      .send(driverInfo);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.driverInfo.postcode).toBe('SW1A 1AA');
    expect(res.body.data.driverInfo.isFilled).toBe(true);

    // Verify change in DB
    const quote = await CarQuote.findById(quoteId);
    expect(quote.driverInfo.employmentStatus).toBe('Employed');
  });
  
  it('should update the licenseInfo step for the correct quote', async () => {
    const licenseInfo = {
      licenceType: 'Full UK',
      licenceNumber: 'ABCDE123456'
    };

    const res = await request(app)
      .post(`/api/quote/${quoteId}/license-info`)
      .set('Authorization', `Bearer ${token}`)
      .send(licenseInfo);

    expect(res.statusCode).toEqual(200);
    expect(res.body.data.licenseInfo.licenceType).toBe('Full UK');
    expect(res.body.data.licenseInfo.isFilled).toBe(true);
  });

  it('should return 400 for invalid data', async () => {
    const invalidVehicleInfo = {
      mileage: 'not-a-number' // Should be a number
    };

    const res = await request(app)
      .post(`/api/quote/${quoteId}/vehicle-info`)
      .set('Authorization', `Bearer ${token}`)
      .send(invalidVehicleInfo);
    
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toContain('"mileage" must be a number');
  });

  it('should return 404 for a non-existent quote ID', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app)
      .post(`/api/quote/${fakeId}/driver-info`)
      .set('Authorization', `Bearer ${token}`)
      .send({ postcode: 'SW1A 1AA' });

    expect(res.statusCode).toEqual(404);
    expect(res.body.error).toBe('Quote not found');
  });

  it('should return 403 if user tries to update another user\'s quote', async () => {
    // Create a second user
    const user2Res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'attacker@example.com', password: 'password123' });
    const attackerToken = user2Res.body.token;
    
    // Attacker tries to update user 1's quote
    const res = await request(app)
      .post(`/api/quote/${quoteId}/driver-info`)
      .set('Authorization', `Bearer ${attackerToken}`)
      .send({ postcode: 'MALICIOUS' });
      
    expect(res.statusCode).toEqual(403);
    expect(res.body.error).toBe('Not authorized to update this quote');
  });

  it('should return 401 if no token is provided', async () => {
    const res = await request(app)
      .post(`/api/quote/${quoteId}/driver-info`)
      .send({ postcode: 'NO_TOKEN' });

    expect(res.statusCode).toEqual(401);
  });
});