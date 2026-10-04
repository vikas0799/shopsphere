import 'dotenv/config';
import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Product from '../src/models/Product.js';
import Order from '../src/models/Order.js';
import Review from '../src/models/Review.js';

let server;
let baseUrl;

const REGRESSION_DB_URI = process.env.REGRESSION_MONGO_URI || 'mongodb://127.0.0.1:27017/shopsphere_regression_test';

before(async () => {
  await mongoose.connect(REGRESSION_DB_URI);
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api`;
      resolve();
    });
  });
});

after(async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  }
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

beforeEach(async () => {
  await Promise.all([
    User.deleteMany(),
    Product.deleteMany(),
    Order.deleteMany(),
    Review.deleteMany(),
  ]);
});

test('REGRESSION: Health endpoint works', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.status, 'ok');
});

test('REGRESSION: Auth flow (register -> login -> me profile)', async () => {
  // 1. Register
  const regRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
    }),
  });
  assert.strictEqual(regRes.status, 201);
  const regData = await regRes.json();
  assert.strictEqual(regData.name, 'John Doe');
  assert.ok(regData.token);

  // 2. Login
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'john@example.com',
      password: 'password123',
    }),
  });
  assert.strictEqual(loginRes.status, 200);
  const loginData = await loginRes.json();
  assert.ok(loginData.token);

  // 3. Me profile
  const meRes = await fetch(`${baseUrl}/auth/me`, {
    headers: { Authorization: `Bearer ${loginData.token}` },
  });
  assert.strictEqual(meRes.status, 200);
  const meData = await meRes.json();
  assert.strictEqual(meData.email, 'john@example.com');
});

test('REGRESSION: Products CRUD and search/filter', async () => {
  // Create admin
  const admin = await User.create({
    name: 'Admin',
    email: 'admin@shopsphere.dev',
    password: 'password123',
    role: 'admin',
  });
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@shopsphere.dev', password: 'password123' }),
  });
  const { token: adminToken } = await loginRes.json();

  // Admin creates product
  const createRes = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: 'Wireless Mouse',
      description: 'Ergonomic optical wireless mouse',
      price: 999,
      category: 'electronics',
      brand: 'Logi',
      stock: 20,
    }),
  });
  assert.strictEqual(createRes.status, 201);
  const createdProduct = await createRes.json();
  assert.strictEqual(createdProduct.name, 'Wireless Mouse');

  // Public get products list
  const listRes = await fetch(`${baseUrl}/products`);
  assert.strictEqual(listRes.status, 200);
  const listData = await listRes.json();
  assert.strictEqual(listData.length, 1);

  // Public get single product
  const singleRes = await fetch(`${baseUrl}/products/${createdProduct._id}`);
  assert.strictEqual(singleRes.status, 200);
  const singleData = await singleRes.json();
  assert.strictEqual(singleData.name, 'Wireless Mouse');

  // Admin updates product
  const updateRes = await fetch(`${baseUrl}/products/${createdProduct._id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ price: 899 }),
  });
  assert.strictEqual(updateRes.status, 200);
  const updatedData = await updateRes.json();
  assert.strictEqual(updatedData.price, 899);

  // Admin deletes product
  const deleteRes = await fetch(`${baseUrl}/products/${createdProduct._id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.strictEqual(deleteRes.status, 200);
});

test('REGRESSION: Orders flow (create order -> my orders -> admin status update)', async () => {
  // Create user
  const user = await User.create({
    name: 'Customer',
    email: 'cust@shopsphere.dev',
    password: 'password123',
    role: 'customer',
  });
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'cust@shopsphere.dev', password: 'password123' }),
  });
  const { token: userToken } = await loginRes.json();

  // Create admin
  const admin = await User.create({
    name: 'Admin',
    email: 'admin2@shopsphere.dev',
    password: 'password123',
    role: 'admin',
  });
  const adminLoginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin2@shopsphere.dev', password: 'password123' }),
  });
  const { token: adminToken } = await adminLoginRes.json();

  // Create product
  const product = await Product.create({
    name: 'Water Bottle',
    description: 'Stainless steel 1L',
    price: 499,
    category: 'sports',
    stock: 10,
    rating: 0,
  });

  // User places order
  const orderRes = await fetch(`${baseUrl}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${userToken}`,
    },
    body: JSON.stringify({
      items: [
        {
          product: product._id,
          name: product.name,
          price: product.price,
          quantity: 2,
        },
      ],
      shippingAddress: {
        line1: '100 Road',
        city: 'Metropolis',
        state: 'State',
        pincode: '560001',
      },
      paymentMethod: 'COD',
    }),
  });
  assert.strictEqual(orderRes.status, 201);
  const orderData = await orderRes.json();
  assert.strictEqual(orderData.status, 'pending');

  // Customer checks my orders
  const myOrdersRes = await fetch(`${baseUrl}/orders/mine`, {
    headers: { Authorization: `Bearer ${userToken}` },
  });
  assert.strictEqual(myOrdersRes.status, 200);
  const myOrders = await myOrdersRes.json();
  assert.strictEqual(myOrders.length, 1);
  assert.strictEqual(myOrders[0]._id, orderData._id);

  // Admin views all orders
  const allOrdersRes = await fetch(`${baseUrl}/orders`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.strictEqual(allOrdersRes.status, 200);
  const allOrders = await allOrdersRes.json();
  assert.strictEqual(allOrders.length, 1);

  // Admin updates order status to delivered
  const patchRes = await fetch(`${baseUrl}/orders/${orderData._id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({ status: 'delivered' }),
  });
  assert.strictEqual(patchRes.status, 200);
  const patchedOrder = await patchRes.json();
  assert.strictEqual(patchedOrder.status, 'delivered');
});
