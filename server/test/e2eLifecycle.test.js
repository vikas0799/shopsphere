import 'dotenv/config';
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Product from '../src/models/Product.js';
import Order from '../src/models/Order.js';
import Review from '../src/models/Review.js';

let server;
let baseUrl;

const E2E_DB_URI = process.env.E2E_MONGO_URI || 'mongodb://127.0.0.1:27017/shopsphere_e2e_test';

before(async () => {
  await mongoose.connect(E2E_DB_URI);
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://localhost:${port}/api`;
      resolve();
    });
  });

  await Promise.all([
    User.deleteMany(),
    Product.deleteMany(),
    Order.deleteMany(),
    Review.deleteMany(),
  ]);
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

test('COMPLETE E2E LIFECYCLE: Order -> Deliver -> Review -> Rating Recalculation', async () => {
  // Step 1: Create Admin
  const adminRes = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Admin', email: 'admin@e2e.dev', password: 'password123' }),
  });
  const adminData = await adminRes.json();
  await User.findByIdAndUpdate(adminData._id, { role: 'admin' });
  // re-login as admin
  const adminLogin = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@e2e.dev', password: 'password123' }),
  });
  const { token: adminToken } = await adminLogin.json();

  // Step 2: Admin creates product
  const prodRes = await fetch(`${baseUrl}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    },
    body: JSON.stringify({
      name: 'E2E Mechanical Keyboard',
      description: 'Tactile switch keyboard',
      price: 3499,
      category: 'electronics',
      brand: 'KeyCraft',
      stock: 50,
      rating: 0,
    }),
  });
  const product = await prodRes.json();

  // Step 3: Customer 1 registers
  const cust1Res = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Alice', email: 'alice@e2e.dev', password: 'password123' }),
  });
  const { token: aliceToken } = await cust1Res.json();

  // Step 4: Alice attempts review before purchasing -> 403 Forbidden
  const prematureReview = await fetch(`${baseUrl}/products/${product._id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aliceToken}` },
    body: JSON.stringify({ rating: 5, comment: 'I want to review without buying!' }),
  });
  assert.strictEqual(prematureReview.status, 403);
  const prematureData = await prematureReview.json();
  assert.strictEqual(prematureData.message, 'You can only review products from delivered orders');

  // Step 5: Alice places order
  const orderRes = await fetch(`${baseUrl}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aliceToken}` },
    body: JSON.stringify({
      items: [{ product: product._id, name: product.name, price: product.price, quantity: 1 }],
      shippingAddress: { line1: '456 Street', city: 'City', state: 'State', pincode: '560002' },
      paymentMethod: 'COD',
    }),
  });
  const order = await orderRes.json();
  assert.strictEqual(order.status, 'pending');

  // Step 6: Alice attempts review while order is pending -> 403 Forbidden
  const pendingReview = await fetch(`${baseUrl}/products/${product._id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aliceToken}` },
    body: JSON.stringify({ rating: 5, comment: 'Ordered it, looks nice!' }),
  });
  assert.strictEqual(pendingReview.status, 403);

  // Step 7: Admin marks order as shipped, then delivered
  await fetch(`${baseUrl}/orders/${order._id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'shipped' }),
  });

  const shippedReview = await fetch(`${baseUrl}/products/${product._id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aliceToken}` },
    body: JSON.stringify({ rating: 5, comment: 'Shipped review attempt' }),
  });
  assert.strictEqual(shippedReview.status, 403);

  await fetch(`${baseUrl}/orders/${order._id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'delivered' }),
  });

  // Step 8: Alice fetches reviews before submitting -> empty array
  const preReviewsRes = await fetch(`${baseUrl}/products/${product._id}/reviews`);
  const preReviews = await preReviewsRes.json();
  assert.strictEqual(preReviews.length, 0);

  // Step 9: Alice submits review -> 201 Created
  const aliceReviewRes = await fetch(`${baseUrl}/products/${product._id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aliceToken}` },
    body: JSON.stringify({ rating: 5, comment: 'Amazing tactile feel!' }),
  });
  assert.strictEqual(aliceReviewRes.status, 201);
  const aliceReview = await aliceReviewRes.json();
  assert.strictEqual(aliceReview.rating, 5);
  assert.strictEqual(aliceReview.user.name, 'Alice');

  // Step 10: Verify product rating is now 5.0
  const prodAfterAlice = await (await fetch(`${baseUrl}/products/${product._id}`)).json();
  assert.strictEqual(prodAfterAlice.rating, 5);

  // Step 11: Alice attempts second review -> 409 Conflict
  const aliceDupRes = await fetch(`${baseUrl}/products/${product._id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${aliceToken}` },
    body: JSON.stringify({ rating: 4, comment: 'Trying duplicate review' }),
  });
  assert.strictEqual(aliceDupRes.status, 409);

  // Step 12: Customer 2 (Bob) registers, orders, gets delivery, and reviews with rating 4
  const cust2Res = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Bob', email: 'bob@e2e.dev', password: 'password123' }),
  });
  const { token: bobToken } = await cust2Res.json();

  const bobOrderRes = await fetch(`${baseUrl}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bobToken}` },
    body: JSON.stringify({
      items: [{ product: product._id, name: product.name, price: product.price, quantity: 1 }],
      shippingAddress: { line1: '789 Street', city: 'City', state: 'State', pincode: '560003' },
      paymentMethod: 'ONLINE',
    }),
  });
  const bobOrder = await bobOrderRes.json();

  await fetch(`${baseUrl}/orders/${bobOrder._id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
    body: JSON.stringify({ status: 'delivered' }),
  });

  const bobReviewRes = await fetch(`${baseUrl}/products/${product._id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${bobToken}` },
    body: JSON.stringify({ rating: 4, comment: 'Solid keyboard, good build.' }),
  });
  assert.strictEqual(bobReviewRes.status, 201);

  // Step 13: Product rating is recalculated to (5 + 4) / 2 = 4.5
  const prodAfterBob = await (await fetch(`${baseUrl}/products/${product._id}`)).json();
  assert.strictEqual(prodAfterBob.rating, 4.5);

  // Step 14: Product reviews list now has 2 reviews, newest first
  const finalReviewsRes = await fetch(`${baseUrl}/products/${product._id}/reviews`);
  const finalReviews = await finalReviewsRes.json();
  assert.strictEqual(finalReviews.length, 2);
  assert.strictEqual(finalReviews[0].user.name, 'Bob');
  assert.strictEqual(finalReviews[1].user.name, 'Alice');
});
