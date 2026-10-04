import User from '../models/User.js';
import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/wishlist
export const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist');
  const wishlist = (user?.wishlist || []).filter((item) => item !== null);
  res.json(wishlist);
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

  const updatedUser = await User.findById(req.user._id).populate('wishlist');
  const wishlist = (updatedUser?.wishlist || []).filter((item) => item !== null);
  res.json(wishlist);
});

// DELETE /api/wishlist/:productId
export const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const user = await User.findById(req.user._id);
  user.wishlist = user.wishlist.filter((id) => id.toString() !== productId);
  await user.save();

  const updatedUser = await User.findById(req.user._id).populate('wishlist');
  const wishlist = (updatedUser?.wishlist || []).filter((item) => item !== null);
  res.json(wishlist);
});
