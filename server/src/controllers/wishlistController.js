import User from '../models/User.js';
import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/wishlist
export const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json(user.wishlist || []);
});

// POST /api/wishlist/:productId
export const addToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const product = await Product.findById(productId);
  if (!product) {
    res.status(404);
    throw new Error('Product not found');
  }

  const user = await User.findById(req.user._id);
  if (!user.wishlist.some((id) => id.toString() === productId)) {
    user.wishlist.push(productId);
    await user.save();
  }

  await user.populate('wishlist');
  res.status(201).json(user.wishlist);
});

// DELETE /api/wishlist/:productId
export const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.wishlist = user.wishlist.filter((id) => id.toString() !== productId);
  await user.save();

  await user.populate('wishlist');
  res.json(user.wishlist);
});
