import 'dotenv/config';
import test, { before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import app from '../src/app.js';
import User from '../src/models/User.js';
import Product from '../src/models/Product.js';
import Order from '../src/models/Order.js';
import Review from '../src/models/Review.js';
import generateToken from '../src/utils/generateToken.js';

let server;
let baseUrl;

const TEST_DB_URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/shopsphere_review_test';

before(async () => {
  await mongoose.connect(TEST_DB_URI);
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

// Helper to create test user and token
async function createUser(email = 'test@example.com', role = 'customer') {
  const user = await User.create({
    name: 'Test Customer',
    email,
    password: 'password123',
    role,
  });
  const token = generateToken(user._id);
  return { user, token };
}

// Helper to create test product
async function createProduct(name = 'Test Headphones', initialRating = 0) {
  return Product.create({
    name,
    description: 'High quality audio device',
    price: 1999,
    category: 'electronics',
    brand: 'AudioPhile',
    stock: 50,
    rating: initialRating,
  });
}

// Helper to create order
async function createOrder(user, product, status = 'delivered') {
  return Order.create({
    user: user._id,
    items: [
      {
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: 1,
      },
    ],
    shippingAddress: {
      line1: '123 Test St',
      city: 'Test City',
      state: 'Test State',
      pincode: '123456',
    },
    paymentMethod: 'COD',
    totalAmount: product.price,
    status,
  });
}

// --- POSITIVE TESTS ---

test('POST review: authenticated user with delivered order succeeds (201)', async () => {
  const { user, token } = await createUser();
  const product = await createProduct();
  await createOrder(user, product, 'delivered');

  const res = await fetch(`${baseUrl}/products/${product._id}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      rating: 4,
      comment: 'Great product, sound quality is crisp!',
    }),
  });

  assert.strictEqual(res.status, 201);
  const data = await res.json();
  assert.strictEqual(data.rating, 4);
  assert.strictEqual(data.comment, 'Great product, sound quality is crisp!');
  assert.strictEqual(data.product, product._id.toString());
  assert.strictEqual(data.user.name, user.name);

  // Database verification: product rating recalculated
  const updatedProduct = await Product.findById(product._id);
  assert.strictEqual(updatedProduct.rating, 4);
});

test('POST review: rating 1 succeeds', async () => {
  const { user, token } = await createUser();
  const product = await createProduct();
  await createOrder(user, product, 'delivered');

  const res = await fetch(`${baseUrl}/products/${product._id}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ rating: 1, comment: 'Defective unit' }),
  });

  assert.strictEqual(res.status, 201);
  const data = await res.json();
  assert.strictEqual(data.rating, 1);
});

test('POST review: rating 5 succeeds', async () => {
  const { user, token } = await createUser();
  const product = await createProduct();
  await createOrder(user, product, 'delivered');

  const res = await fetch(`${baseUrl}/products/${product._id}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ rating: 5, comment: 'Exceptional perfection!' }),
  });

  assert.strictEqual(res.status, 201);
  const data = await res.json();
  assert.strictEqual(data.rating, 5);
});

test('GET reviews: newly created review appears in GET and returns newest first', async () => {
  const { user: user1, token: token1 } = await createUser('u1@test.dev');
  const { user: user2, token: token2 } = await createUser('u2@test.dev');
  const product = await createProduct();
  await createOrder(user1, product, 'delivered');
  await createOrder(user2, product, 'delivered');

  // Submit first review
  await fetch(`${baseUrl}/products/${product._id}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token1}`,
    },
    body: JSON.stringify({ rating: 3, comment: 'First review' }),
  });

  // Submit second review
  await fetch(`${baseUrl}/products/${product._id}/reviews`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token2}`,
    },
    body: JSON.stringify({ rating: 5, comment: 'Second review' }),
  });

  const res = await fetch(`${baseUrl}/products/${product._id}/reviews`);
  assert.strictEqual(res.status, 200);
  const reviews = await res.json();
  assert.strictEqual(reviews.length, 2);
  assert.strictEqual(reviews[0].comment, 'Second review');
  assert.strictEqual(reviews[1].comment, 'First review');
});

test('Recalculation: multiple reviews produce correct average rating', async () => {
  const { user: u1, token: t1 } = await createUser('u1@test.dev');
  const { user: u2, token: t2 } = await createUser('u2@test.dev');
  const { user: u3, token: t3 } = await createUser('u3@test.dev');
  const product = await createProduct();
  await createOrder(u1, product, 'delivered');
  await createOrder(u2, product, 'delivered');
  await createOrder(u3, product, 'delivered');

  await fetch(`${baseUrl}/products/${product._id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t1}` },
    body: JSON.stringify({ rating: 4, comment: 'Good' }),
  });
  await fetch(`${baseUrl}/products/${product._id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t2}` },
    body: JSON.stringify({ rating: 5, comment: 'Great' }),
  });
  await fetch(`${baseUrl}/products/${product._id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t3}` },
    body: JSON.stringify({ rating: 3, comment: 'Average' }),
  });

  // Average = (4 + 5 + 3) / 3 = 4.0
  const updatedProduct = await Product.findById(product._id);
  assert.strictEqual(updatedProduct.rating, 4);
});

// --- NEGATIVE TESTS ---

test('POST review: unauthenticated user is rejected (401)', async () => {
  const product = await createProduct();
  const res = await fetch(`${baseUrl}/products/${product._id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rating: 5, comment: 'Anonymous review' }),
  });
  assert.strictEqual(res.status, 401);
});

test('POST review: pending order is rejected (403)', async () => {
  const { user, token } = await createUser();
  const product = await createProduct();
  await createOrder(user, product, 'pending');

  const res = await fetch(`${baseUrl}/products/${product._id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ rating: 5, comment: 'Waiting for delivery' }),
  });
  assert.strictEqual(res.status, 403);
});

test('POST review: confirmed order is rejected (403)', async () => {
  const { user, token } = await createUser();
  const product = await createProduct();
  await createOrder(user, product, 'confirmed');

  const res = await fetch(`${baseUrl}/products/${product._id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ rating: 5, comment: 'Order confirmed' }),
  });
  assert.strictEqual(res.status, 403);
});

test('POST review: shipped order is rejected (403)', async () => {
  const { user, token } = await createUser();
  const product = await createProduct();
  await createOrder(user, product, 'shipped');

  const res = await fetch(`${baseUrl}/products/${product._id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ rating: 5, comment: 'Order is on the way' }),
  });
  assert.strictEqual(res.status, 403);
});

test('POST review: user who never purchased product is rejected (403)', async () => {
  const { user, token } = await createUser();
  const product = await createProduct();

  const res = await fetch(`${baseUrl}/products/${product._id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ rating: 5, comment: 'Never bought this' }),
  });
  assert.strictEqual(res.status, 403);
});

test('POST review: user who purchased DIFFERENT product is rejected (403)', async () => {
  const { user, token } = await createUser();
  const productPurchased = await createProduct('Product A');
  const productTarget = await createProduct('Product B');

  await createOrder(user, productPurchased, 'delivered');

  const res = await fetch(`${baseUrl}/products/${productTarget._id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ rating: 5, comment: 'Trying to review product B' }),
  });
  assert.strictEqual(res.status, 403);
});

test('POST review: nonexistent product returns 404', async () => {
  const { user, token } = await createUser();
  const nonExistentId = new mongoose.Types.ObjectId();

  const res = await fetch(`${baseUrl}/products/${nonExistentId}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ rating: 5, comment: 'Nonexistent product' }),
  });
  assert.strictEqual(res.status, 404);
});

test('POST review: rating 0 is rejected (400)', async () => {
  const { user, token } = await createUser();
  const product = await createProduct();
  await createOrder(user, product, 'delivered');

  const res = await fetch(`${baseUrl}/products/${product._id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ rating: 0, comment: 'Zero rating' }),
  });
  assert.strictEqual(res.status, 400);
});

test('POST review: rating 6 is rejected (400)', async () => {
  const { user, token } = await createUser();
  const product = await createProduct();
  await createOrder(user, product, 'delivered');

  const res = await fetch(`${baseUrl}/products/${product._id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ rating: 6, comment: 'Too high rating' }),
  });
  assert.strictEqual(res.status, 400);
});

test('POST review: non-numeric / decimal rating is rejected (400)', async () => {
  const { user, token } = await createUser();
  const product = await createProduct();
  await createOrder(user, product, 'delivered');

  const res1 = await fetch(`${baseUrl}/products/${product._id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ rating: 'abc', comment: 'Invalid rating' }),
  });
  assert.strictEqual(res1.status, 400);

  const res2 = await fetch(`${baseUrl}/products/${product._id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ rating: 4.5, comment: 'Decimal rating' }),
  });
  assert.strictEqual(res2.status, 400);
});

test('POST review: missing/empty comment is rejected (400)', async () => {
  const { user, token } = await createUser();
  const product = await createProduct();
  await createOrder(user, product, 'delivered');

  const res1 = await fetch(`${baseUrl}/products/${product._id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ rating: 5, comment: '' }),
  });
  assert.strictEqual(res1.status, 400);

  const res2 = await fetch(`${baseUrl}/products/${product._id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ rating: 5, comment: '   ' }),
  });
  assert.strictEqual(res2.status, 400);
});

test('POST review: duplicate review from same user is rejected (409)', async () => {
  const { user, token } = await createUser();
  const product = await createProduct();
  await createOrder(user, product, 'delivered');

  const firstRes = await fetch(`${baseUrl}/products/${product._id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ rating: 5, comment: 'First review' }),
  });
  assert.strictEqual(firstRes.status, 201);

  const secondRes = await fetch(`${baseUrl}/products/${product._id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ rating: 4, comment: 'Duplicate review attempt' }),
  });
  assert.strictEqual(secondRes.status, 409);
});

// --- SECURITY TESTS ---

test('SECURITY: fake user ID in body is ignored', async () => {
  const { user, token } = await createUser();
  const fakeUserId = new mongoose.Types.ObjectId();
  const product = await createProduct();
  await createOrder(user, product, 'delivered');

  const res = await fetch(`${baseUrl}/products/${product._id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      rating: 5,
      comment: 'Review with fake body user',
      user: fakeUserId.toString(),
      userId: fakeUserId.toString(),
    }),
  });
  assert.strictEqual(res.status, 201);

  const savedReview = await Review.findOne({ product: product._id });
  assert.strictEqual(savedReview.user.toString(), user._id.toString());
  assert.notStrictEqual(savedReview.user.toString(), fakeUserId.toString());
});

test('SECURITY: fake product ID in body is ignored', async () => {
  const { user, token } = await createUser();
  const fakeProductId = new mongoose.Types.ObjectId();
  const product = await createProduct();
  await createOrder(user, product, 'delivered');

  const res = await fetch(`${baseUrl}/products/${product._id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      rating: 5,
      comment: 'Review with fake body product',
      product: fakeProductId.toString(),
      productId: fakeProductId.toString(),
    }),
  });
  assert.strictEqual(res.status, 201);

  const savedReview = await Review.findOne({ product: product._id });
  assert.strictEqual(savedReview.product.toString(), product._id.toString());
});

test('SECURITY: fake orderId and delivered flags cannot bypass eligibility', async () => {
  const { user, token } = await createUser();
  const product = await createProduct();
  // No order placed!

  const res = await fetch(`${baseUrl}/products/${product._id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      rating: 5,
      comment: 'Bypass attempt',
      orderId: new mongoose.Types.ObjectId().toString(),
      delivered: true,
      status: 'delivered',
      isDelivered: true,
    }),
  });
  assert.strictEqual(res.status, 403);
});

test('SECURITY: malicious user cannot use another user delivered order to review', async () => {
  const { user: legitBuyer } = await createUser('buyer@test.dev');
  const { token: attackerToken } = await createUser('attacker@test.dev');
  const product = await createProduct();
  await createOrder(legitBuyer, product, 'delivered');

  const res = await fetch(`${baseUrl}/products/${product._id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${attackerToken}` },
    body: JSON.stringify({ rating: 5, comment: 'Attacker trying to review' }),
  });
  assert.strictEqual(res.status, 403);
});

test('SECURITY: invalid ObjectId is handled safely with 400', async () => {
  const { token } = await createUser();

  const getRes = await fetch(`${baseUrl}/products/invalid-id-123/reviews`);
  assert.strictEqual(getRes.status, 400);

  const postRes = await fetch(`${baseUrl}/products/invalid-id-123/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ rating: 5, comment: 'Invalid product id test' }),
  });
  assert.strictEqual(postRes.status, 400);
});

test('SECURITY: sensitive user fields (password, email, address, role) are NEVER returned in GET reviews', async () => {
  const { user, token } = await createUser('sensitive@test.dev');
  const product = await createProduct();
  await createOrder(user, product, 'delivered');

  await fetch(`${baseUrl}/products/${product._id}/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ rating: 5, comment: 'Checking sensitive fields' }),
  });

  const res = await fetch(`${baseUrl}/products/${product._id}/reviews`);
  const reviews = await res.json();
  assert.strictEqual(reviews.length, 1);
  const reviewer = reviews[0].user;

  assert.strictEqual(reviewer.name, user.name);
  assert.strictEqual(reviewer.password, undefined);
  assert.strictEqual(reviewer.email, undefined);
  assert.strictEqual(reviewer.address, undefined);
  assert.strictEqual(reviewer.role, undefined);
});

// --- CONCURRENCY TESTS ---

test('CONCURRENCY: simultaneous duplicate review attempts result in ONLY ONE stored review', async () => {
  const { user, token } = await createUser('concurrent@test.dev');
  const product = await createProduct();
  await createOrder(user, product, 'delivered');

  // Send 5 concurrent requests
  const requests = Array.from({ length: 5 }, (_, i) =>
    fetch(`${baseUrl}/products/${product._id}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ rating: 5, comment: `Concurrent attempt ${i}` }),
    })
  );

  const responses = await Promise.all(requests);
  const statuses = responses.map((r) => r.status);

  // Exactly one should succeed with 201, others should be rejected with 409
  const successCount = statuses.filter((s) => s === 201).length;
  const conflictCount = statuses.filter((s) => s === 409).length;

  assert.strictEqual(successCount, 1, 'Exactly one concurrent request should succeed');
  assert.strictEqual(conflictCount, 4, 'Remaining concurrent requests should fail with 409');

  const countInDb = await Review.countDocuments({ product: product._id, user: user._id });
  assert.strictEqual(countInDb, 1, 'Database must contain exactly 1 review document');
});

test('CONCURRENCY: different users submitting reviews concurrently result in accurate independently verified Product.rating', async () => {
  const { user: userA, token: tokenA } = await createUser('usera_concur@test.dev');
  const { user: userB, token: tokenB } = await createUser('userb_concur@test.dev');
  const { user: userC, token: tokenC } = await createUser('userc_concur@test.dev');
  const product = await createProduct('Concurrent Product Target');

  // All three users have delivered orders containing the same product
  await createOrder(userA, product, 'delivered');
  await createOrder(userB, product, 'delivered');
  await createOrder(userC, product, 'delivered');

  // Submit reviews concurrently: User A (5), User B (3), User C (4)
  const submissions = [
    fetch(`${baseUrl}/products/${product._id}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({ rating: 5, comment: 'Review from User A' }),
    }),
    fetch(`${baseUrl}/products/${product._id}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenB}` },
      body: JSON.stringify({ rating: 3, comment: 'Review from User B' }),
    }),
    fetch(`${baseUrl}/products/${product._id}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenC}` },
      body: JSON.stringify({ rating: 4, comment: 'Review from User C' }),
    }),
  ];

  const responses = await Promise.all(submissions);
  for (const res of responses) {
    assert.strictEqual(res.status, 201, 'Every valid eligible user review should succeed');
  }

  // Verify database state: 3 Review documents
  const storedReviews = await Review.find({ product: product._id });
  assert.strictEqual(storedReviews.length, 3, 'Must store exactly 3 review documents');

  // Calculate expected rating independently from the actual stored Review documents
  const independentSum = storedReviews.reduce((sum, r) => sum + r.rating, 0);
  const independentAvg = Math.round((independentSum / storedReviews.length) * 10) / 10;
  assert.strictEqual(independentAvg, 4.0, 'Independent calculation (5 + 3 + 4) / 3 = 4.0');

  // Verify Product.rating stored in MongoDB matches the independent average
  const updatedProduct = await Product.findById(product._id);
  assert.strictEqual(
    updatedProduct.rating,
    independentAvg,
    `Stored Product.rating (${updatedProduct.rating}) must equal independently calculated average (${independentAvg})`
  );
});

test('CONCURRENCY: 5 different users submitting concurrently with mixed ratings produces exact independent average', async () => {
  const users = await Promise.all([
    createUser('u1_mixed@test.dev'),
    createUser('u2_mixed@test.dev'),
    createUser('u3_mixed@test.dev'),
    createUser('u4_mixed@test.dev'),
    createUser('u5_mixed@test.dev'),
  ]);
  const product = await createProduct('Mixed Concurrency Product');
  const ratings = [5, 2, 4, 1, 3]; // Sum: 15 / 5 = 3.0

  for (let i = 0; i < 5; i++) {
    await createOrder(users[i].user, product, 'delivered');
  }

  const submissions = users.map((u, i) =>
    fetch(`${baseUrl}/products/${product._id}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${u.token}` },
      body: JSON.stringify({ rating: ratings[i], comment: `Review by user ${i}` }),
    })
  );

  const responses = await Promise.all(submissions);
  for (const res of responses) {
    assert.strictEqual(res.status, 201);
  }

  const storedReviews = await Review.find({ product: product._id });
  assert.strictEqual(storedReviews.length, 5);

  const independentSum = storedReviews.reduce((sum, r) => sum + r.rating, 0);
  const independentAvg = Math.round((independentSum / storedReviews.length) * 10) / 10;
  assert.strictEqual(independentAvg, 3.0);

  const updatedProduct = await Product.findById(product._id);
  assert.strictEqual(updatedProduct.rating, independentAvg);
});

