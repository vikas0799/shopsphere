import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/wishlist
export const getWishlist = asyncHandler(async (req, res) => {
  await req.user.populate('wishlist');
  res.json(req.user.wishlist);
});

// POST /api/wishlist/:productId
export const addToWishlist = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.productId);

  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const alreadySaved = req.user.wishlist.some(
    (id) => id.toString() === product._id.toString()
  );

  if (!alreadySaved) {
    req.user.wishlist.push(product._id);
    await req.user.save();
  }

  await req.user.populate('wishlist');
  res.status(200).json(req.user.wishlist);
});

// DELETE /api/wishlist/:productId
export const removeFromWishlist = asyncHandler(async (req, res) => {
  req.user.wishlist = req.user.wishlist.filter(
    (id) => id.toString() !== req.params.productId
  );

  await req.user.save();
  await req.user.populate('wishlist');
  res.json(req.user.wishlist);
});