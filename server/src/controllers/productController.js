import Product from '../models/Product.js';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/products?search=&category=&minPrice=&maxPrice=&sort=
// NOTE: there is no pagination yet - see the "Add pagination" issue.
export const getProducts = asyncHandler(async (req, res) => {
  const { search, category, minPrice, maxPrice, sort } = req.query;
  const filter = {};

  if (search) filter.$text = { $search: search };
  if (category) filter.category = category;
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  const sortMap = {
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    newest: { createdAt: -1 },
    rating: { rating: -1 },
  };

  const products = await Product.find(filter).sort(sortMap[sort] || { createdAt: -1 });
  res.json(products);
});

// GET /api/products/:id
export const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json(product);
});

// POST /api/products (admin)
export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create({ ...req.body, createdBy: req.user._id });
  res.status(201).json(product);
});

// PUT /api/products/:id (admin)
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json(product);
});

// DELETE /api/products/:id (admin)
export const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }
  res.json({ message: 'Product deleted' });
});

// GET /api/products/:id/reviews
export const getProductReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ product: req.params.id })
    .populate('user', 'name')
    .sort({ createdAt: -1 });
  res.json(reviews);
});

// POST /api/products/:id/reviews
export const createProductReview = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const existingReview = await Review.findOne({
    product: req.params.id,
    user: req.user._id,
  });
  if (existingReview) {
    res.status(400);
    throw new Error('You have already reviewed this product');
  }

  const deliveredOrder = await Order.findOne({
    user: req.user._id,
    status: 'delivered',
    'items.product': req.params.id,
  });
  if (!deliveredOrder) {
    res.status(403);
    throw new Error('Only users with a delivered order for this product can review');
  }

  const rating = Number(req.body.rating);
  if (!rating || rating < 1 || rating > 5) {
    res.status(400);
    throw new Error('Rating must be between 1 and 5');
  }

  if (!req.body.comment?.trim()) {
    res.status(400);
    throw new Error('Comment is required');
  }

  const review = await Review.create({
    product: req.params.id,
    user: req.user._id,
    rating,
    comment: req.body.comment.trim(),
  });

  const allReviews = await Review.find({ product: req.params.id });
  const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
  product.rating = Number(avgRating.toFixed(1));
  await product.save();

  res.status(201).json(review);
});
