import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../src/app.js';
import User from '../src/models/User.js';

let mongo;
const customer = { name: 'API Test Customer', email: 'customer@example.test', password: 'valid-password' };

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-only-secret-not-for-production';
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  await User.init();
});

beforeEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongo) await mongo.stop();
});

describe('POST /api/auth/register', () => {
  test('creates a customer, hashes the password and issues a verifiable JWT', async () => {
    const response = await request(app).post('/api/auth/register').send(customer).expect(201);
    expect(response.body).toMatchObject({ name: customer.name, email: customer.email, role: 'customer' });
    expect(response.body).not.toHaveProperty('password');
    const claims = jwt.verify(response.body.token, process.env.JWT_SECRET);
    expect(claims.id).toBe(response.body._id);
    const saved = await User.findById(response.body._id).select('+password');
    expect(saved.password).not.toBe(customer.password);
    expect(await saved.matchPassword(customer.password)).toBe(true);
  });

  test('rejects a duplicate email without creating another user', async () => {
    await request(app).post('/api/auth/register').send(customer).expect(201);
    const response = await request(app).post('/api/auth/register').send(customer).expect(409);
    expect(response.body.message).toBe('Email already registered');
    expect(await User.countDocuments()).toBe(1);
  });

  test('rejects missing required fields', async () => {
    const response = await request(app).post('/api/auth/register').send({ email: customer.email }).expect(400);
    expect(response.body.message).toBe('Name, email and password are required');
    expect(await User.countDocuments()).toBe(0);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await User.create(customer);
  });

  test('authenticates a valid password and authorizes the profile route', async () => {
    const response = await request(app).post('/api/auth/login').send(customer).expect(200);
    expect(response.body.email).toBe(customer.email);
    expect(response.body).not.toHaveProperty('password');
    const claims = jwt.verify(response.body.token, process.env.JWT_SECRET);
    expect(claims.id).toBe(response.body._id);
    const profile = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${response.body.token}`).expect(200);
    expect(profile.body.email).toBe(customer.email);
    expect(profile.body).not.toHaveProperty('password');
  });

  test('rejects a wrong password', async () => {
    const response = await request(app).post('/api/auth/login').send({ email: customer.email, password: 'incorrect' }).expect(401);
    expect(response.body.message).toBe('Invalid email or password');
    expect(response.body).not.toHaveProperty('token');
  });

  test('uses the same error for an unknown email', async () => {
    const response = await request(app).post('/api/auth/login').send({ email: 'missing@example.test', password: customer.password }).expect(401);
    expect(response.body.message).toBe('Invalid email or password');
  });
});

test('profile access requires authentication', async () => {
  await request(app).get('/api/auth/me').expect(401);
});
