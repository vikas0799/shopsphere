import Product from '../models/Product.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/wishlist
export const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate('wishlist');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  const items = (user.wishlist || []).filter(Boolean);
  res.json(items);
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
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (!user.wishlist) {
    user.wishlist = [];
  }

  const alreadyInWishlist = user.wishlist.some(
    (item) => (item._id ? item._id.toString() : item.toString()) === product._id.toString()
  );

  if (!alreadyInWishlist) {
    user.wishlist.push(product._id);
    await user.save();
  }

  await user.populate('wishlist');
  res.json((user.wishlist || []).filter(Boolean));
});

// DELETE /api/wishlist/:productId
export const removeFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  user.wishlist = (user.wishlist || []).filter(
    (item) => (item._id ? item._id.toString() : item.toString()) !== productId
  );
  await user.save();

  await user.populate('wishlist');
  res.json((user.wishlist || []).filter(Boolean));
});
