// Config for Jest to handle MongoDB Memory Server or Local Test DB
// For simplicity, we assume a local test db in this patch
process.env.NODE_ENV = 'test';
process.env.MONGO_URI = 'mongodb://localhost:27017/uk_insurance_test_db';
process.env.JWT_SECRET = 'test_secret';