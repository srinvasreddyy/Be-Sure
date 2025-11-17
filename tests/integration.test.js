const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const axios = require('axios'); // Import axios to mock it

// Mock axios
jest.mock('axios');

beforeAll(async () => {
  // Use the setup file's MONGO_URI
  await mongoose.connect(process.env.MONGO_URI);
});

afterEach(async () => {
  await User.deleteMany();
  await Vehicle.deleteMany();
  jest.resetAllMocks(); // Reset mocks after each test
});

afterAll(async () => {
  await mongoose.connection.close();
});

describe('Auth Flow', () => {
  it('should register a user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('token');
  });
});

describe('Vehicle Flow (with Web Scraper)', () => {
  let token;

  // Helper to register and get a token before each vehicle test
  beforeEach(async () => {
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'car@example.com', password: 'password123' });
    token = regRes.body.token;
  });

  it('should return 400 if no VRM is provided', async () => {
    const res = await request(app)
      .post('/api/vehicle/search')
      .set('Authorization', `Bearer ${token}`)
      .send({}); // Empty body
    
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toBe('Please provide a Licence Plate Number (VRM)');
  });

  // ---
  // OPTION 1: Mocked Test (Recommended)
  // This test is fast, reliable, and won't break if the website changes.
  // It tests YOUR parsing logic, not the external website.
  // ---
  it('should scrape and return vehicle data (MOCKED)', async () => {
    // 1. Create fake HTML data that mimics the target website's structure
    const fakeHtml = `
      <html>
        <body>
          <ul>
            <li>Licence plate: EF13GZJ</li>
            <li>Manufacturer: HYUNDAI</li>
            <li>Model: i40 ACTIVE BLUE DRIVE CRDI</li>
            <li>Trim: 4dr saloon 1.7 crdi blue drive dpf ss 136 eu5 active 6spd</li>
            <li>Year: 2013</li>
            <li>Transmission: Manual</li>
            <li>Fuel type: Diesel</li>
            <li>Engine size: 1685</li>
            <li>Import: No</li>
          </ul>
        </body>
      </html>
    `;

    // 2. Mock the axios.get call to return the fake HTML
    axios.get.mockResolvedValue({ data: fakeHtml });

    // 3. Run the test
    const res = await request(app)
      .post('/api/vehicle/search')
      .set('Authorization', `Bearer ${token}`)
      .send({ vrm: 'EF13GZJ' });

    // 4. Assert the results
    expect(res.statusCode).toEqual(200);
    expect(axios.get).toHaveBeenCalledWith(
      'https://www.carcheckfree.co.uk/cardetails/EF13GZJ',
      expect.any(Object) // You can be more specific with headers if needed
    );
    expect(res.body.source).toBe('web_scraper');
    expect(res.body.data.manufacturer).toBe('HYUNDAI');
    expect(res.body.data.model).toBe('i40 ACTIVE BLUE DRIVE CRDI');
    expect(res.body.data.trim).toBe('4dr saloon 1.7 crdi blue drive dpf ss 136 eu5 active 6spd');
    expect(res.body.data.yearOfManufacture).toBe(2013);
    expect(res.body.data.engineCapacity).toBe(1685);
  });

  // ---
  // OPTION 2: Live Test (Not Recommended for CI/CD)
  // This makes a REAL network request to carcheckfree.co.uk.
  // It's good for a one-time check but is slow and can fail
  // if the site is down or changes its HTML structure.
  //
  // To run this, comment out the "Mock axios" line at the top of the file.
  // ---
  /*
  it('should scrape and return vehicle data (LIVE)', async () => {
    // This test will take longer as it makes a real network request
    const res = await request(app)
      .post('/api/vehicle/search')
      .set('Authorization', `Bearer ${token}`)
      .send({ vrm: 'EF13GZJ' });

    expect(res.statusCode).toEqual(200);
    expect(res.body.source).toBe('web_scraper');
    expect(res.body.data.manufacturer).toBe('HYUNDAI');
    expect(res.body.data.model).toBe('i40 ACTIVE BLUE DRIVE CRDI');
    expect(res.body.data.trim).toBe('4dr saloon 1.7 crdi blue drive dpf ss 136 eu5 active 6spd');
    expect(res.body.data.yearOfManufacture).toBe(2013);
  }, 15000); // Increase timeout for live network request
  */
  
  it('should return 404 if the VRM is not found (MOCKED)', async () => {
    // Mock a 404 error from axios
    axios.get.mockRejectedValue({
      response: { status: 404 }
    });

    const res = await request(app)
      .post('/api/vehicle/search')
      .set('Authorization', `Bearer ${token}`)
      .send({ vrm: 'XXXXXXX' });
    
    expect(res.statusCode).toEqual(404);
    expect(res.body.error).toBe('Vehicle not found on carcheckfree.co.uk');
  });

});