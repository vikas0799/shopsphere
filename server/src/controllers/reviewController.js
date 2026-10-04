import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import asyncHandler from '../utils/asyncHandler.js';

// In-process serialization queue per productId to prevent concurrent interleaving
const productRecalcQueues = new Map();

/**
 * Concurrency-safe recalculation of Product.rating from Review documents.
 * 1. Serializes concurrent requests per productId in-process using a Promise queue.
 * 2. Uses a convergent verification loop to ensure the recalculated rating reflects the
 *    complete current set of reviews in MongoDB without stale write races.
 */
export const recalculateProductRating = async (productId) => {
  const key = productId.toString();
  const currentQueue = productRecalcQueues.get(key) || Promise.resolve();

  const nextTask = currentQueue
    .catch(() => {}) // preserve queue continuation on any previous failure
    .then(async () => {
      const MAX_RETRIES = 5;
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const stats = await Review.aggregate([
          { $match: { product: new mongoose.Types.ObjectId(productId) } },
          {
            $group: {
              _id: '$product',
              avgRating: { $avg: '$rating' },
              numReviews: { $sum: 1 },
            },
          },
        ]);

        const numReviews = stats.length > 0 ? stats[0].numReviews : 0;
        const newRating = stats.length > 0 ? Math.round(stats[0].avgRating * 10) / 10 : 0;

        const updateData = { rating: newRating };
        if (Product.schema.path('numReviews')) {
          updateData.numReviews = numReviews;
        }

        await Product.findByIdAndUpdate(productId, updateData);

        // Verify post-update consistency:
        // Ensure no new review was inserted between aggregation and product update
        const postCount = await Review.countDocuments({ product: productId });
        if (postCount === numReviews || attempt === MAX_RETRIES - 1) {
          return newRating;
        }
      }
    });

  productRecalcQueues.set(key, nextTask);

  nextTask.finally(() => {
    if (productRecalcQueues.get(key) === nextTask) {
      productRecalcQueues.delete(key);
    }
  });

  return nextTask;
};

// GET /api/products/:id/reviews
export const getProductReviews = asyncHandler(async (req, res) => {
  const { id: productId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400);
    throw new Error('Invalid ID format');
  }

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const reviews = await Review.find({ product: productId })
    .populate('user', 'name')
    .sort({ createdAt: -1 });

  res.json(reviews);
});

// POST /api/products/:id/reviews
export const createProductReview = asyncHandler(async (req, res) => {
  const { id: productId } = req.params;
  const { rating, comment } = req.body;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    res.status(400);
    throw new Error('Invalid ID format');
  }

  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const numericRating = Number(rating);
  if (
    rating === undefined ||
    rating === null ||
    typeof rating === 'boolean' ||
    !Number.isInteger(numericRating) ||
    numericRating < 1 ||
    numericRating > 5
  ) {
    res.status(400);
    throw new Error('Rating must be an integer between 1 and 5');
  }

  if (!comment || typeof comment !== 'string' || comment.trim().length === 0) {
    res.status(400);
    throw new Error('Comment is required');
  }

  if (comment.trim().length > 1000) {
    res.status(400);
    throw new Error('Comment cannot exceed 1000 characters');
  }

  // Direct MongoDB check: authenticated user must have a delivered order containing this product
  const hasDeliveredOrder = await Order.exists({
    user: req.user._id,
    status: 'delivered',
    'items.product': product._id,
  });

  if (!hasDeliveredOrder) {
    res.status(403);
    throw new Error('You can only review products from delivered orders');
  }

  // Application-level duplicate check
  const alreadyReviewed = await Review.exists({
    product: product._id,
    user: req.user._id,
  });

  if (alreadyReviewed) {
    res.status(409);
    throw new Error('You have already reviewed this product');
  }

  // Database-level duplicate protection
  let review;
  try {
    review = await Review.create({
      product: product._id,
      user: req.user._id,
      rating: numericRating,
      comment: comment.trim(),
    });
  } catch (err) {
    if (err.code === 11000) {
      res.status(409);
      throw new Error('You have already reviewed this product');
    }
    throw err;
  }

  // Recalculate product rating using concurrency-safe queue & convergent verification
  await recalculateProductRating(product._id);

  await review.populate('user', 'name');
  res.status(201).json(review);
});
