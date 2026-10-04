import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import Product from '../src/models/Product.js';
import Order from '../src/models/Order.js';
import Review from '../src/models/Review.js';
import { recalculateProductRating } from '../src/controllers/reviewController.js';

const URI = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/shopsphere_verify_db';

async function run() {
  await mongoose.connect(URI);
  console.log('--- INDEPENDENT DATABASE VERIFICATION START ---');

  // Reset collections
  await Promise.all([
    User.deleteMany(),
    Product.deleteMany(),
    Order.deleteMany(),
    Review.deleteMany(),
  ]);

  // Ensure indexes are built
  await Review.syncIndexes();

  // Setup test data
  const user = await User.create({
    name: 'Verification User',
    email: 'verify@shopsphere.dev',
    password: 'password123',
  });

  const product = await Product.create({
    name: 'Verification Product',
    description: 'Testing DB constraints',
    price: 1500,
    category: 'electronics',
    stock: 10,
    rating: 0,
  });

  // 1. Check direct compound unique index enforcement
  console.log('1. Testing Compound Unique Index on Review collection:');
  const rev1 = await Review.create({
    product: product._id,
    user: user._id,
    rating: 5,
    comment: 'First review',
  });
  console.log('   First review created with ID:', rev1._id.toString());

  let duplicateBlocked = false;
  try {
    await Review.create({
      product: product._id,
      user: user._id,
      rating: 4,
      comment: 'Duplicate review attempt direct to DB',
    });
  } catch (err) {
    if (err.code === 11000) {
      duplicateBlocked = true;
      console.log('   Duplicate successfully rejected by MongoDB E11000 index violation!');
    } else {
      console.error('   Unexpected error:', err);
    }
  }
  if (!duplicateBlocked) {
    throw new Error('FAIL: MongoDB did not enforce compound unique index on { product, user }!');
  }

  // 2. Add more reviews from distinct users and verify INDEPENDENT rating calculation
  console.log('2. Testing independent rating calculation and precision:');
  const user2 = await User.create({
    name: 'User 2',
    email: 'u2@shopsphere.dev',
    password: 'password123',
  });
  const user3 = await User.create({
    name: 'User 3',
    email: 'u3@shopsphere.dev',
    password: 'password123',
  });

  await Review.create({
    product: product._id,
    user: user2._id,
    rating: 3,
    comment: 'Second review',
  });

  await Review.create({
    product: product._id,
    user: user3._id,
    rating: 4,
    comment: 'Third review',
  });

  // Fetch raw reviews from DB
  const rawReviews = await mongoose.connection.collection('reviews').find({ product: product._id }).toArray();
  const totalCount = rawReviews.length;
  const ratingSum = rawReviews.reduce((sum, r) => sum + r.rating, 0);
  const independentCalculatedAvg = Math.round((ratingSum / totalCount) * 10) / 10;

  console.log(`   Raw reviews count in MongoDB: ${totalCount}`);
  console.log(`   Ratings in MongoDB: ${rawReviews.map((r) => r.rating).join(', ')}`);
  console.log(`   Independently calculated average: ${ratingSum} / ${totalCount} = ${independentCalculatedAvg}`);

  // Update Product using hardened recalculateProductRating
  await recalculateProductRating(product._id);

  const freshProduct = await Product.findById(product._id);
  console.log(`   Product.rating stored in DB: ${freshProduct.rating}`);

  if (freshProduct.rating !== independentCalculatedAvg) {
    throw new Error(
      `FAIL: DB Product.rating ${freshProduct.rating} does not match independent average ${independentCalculatedAvg}`
    );
  }
  console.log('   MATCH CONFIRMED: Stored Product.rating equals independently calculated average!');

  // 3. Test concurrent different-user recalculation directly against MongoDB
  console.log('3. Testing concurrent different-user rating updates against MongoDB:');
  const concurrentProduct = await Product.create({
    name: 'Direct Concurrent Target',
    description: 'Testing DB concurrency',
    price: 2500,
    category: 'electronics',
    stock: 20,
    rating: 0,
  });

  const cUsers = await Promise.all([
    User.create({ name: 'CU1', email: 'cu1@test.dev', password: 'password123' }),
    User.create({ name: 'CU2', email: 'cu2@test.dev', password: 'password123' }),
    User.create({ name: 'CU3', email: 'cu3@test.dev', password: 'password123' }),
    User.create({ name: 'CU4', email: 'cu4@test.dev', password: 'password123' }),
  ]);

  const cRatings = [5, 4, 2, 3]; // Sum: 14 / 4 = 3.5

  // Concurrently insert reviews and trigger recalculation
  await Promise.all(
    cUsers.map(async (u, idx) => {
      await Review.create({
        product: concurrentProduct._id,
        user: u._id,
        rating: cRatings[idx],
        comment: `Direct concurrent review ${idx}`,
      });
      return recalculateProductRating(concurrentProduct._id);
    })
  );

  const rawCReviews = await mongoose.connection
    .collection('reviews')
    .find({ product: concurrentProduct._id })
    .toArray();
  const cSum = rawCReviews.reduce((sum, r) => sum + r.rating, 0);
  const cExpectedAvg = Math.round((cSum / rawCReviews.length) * 10) / 10;

  const finalCProduct = await Product.findById(concurrentProduct._id);
  console.log(`   Concurrent reviews in DB: ${rawCReviews.length}`);
  console.log(`   Expected independent avg: ${cSum} / ${rawCReviews.length} = ${cExpectedAvg}`);
  console.log(`   Final Product.rating in DB: ${finalCProduct.rating}`);

  if (finalCProduct.rating !== cExpectedAvg) {
    throw new Error(
      `FAIL: Final Product.rating ${finalCProduct.rating} does not equal expected ${cExpectedAvg}`
    );
  }
  console.log('   MATCH CONFIRMED: Concurrent different-user recalculation converged to exact average!');

  // Clean up
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  console.log('--- INDEPENDENT DATABASE VERIFICATION COMPLETE: ALL PASS ---');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
