import mongoose from 'mongoose';
import Product from '../models/Product.js';
import User from '../models/User.js';
import asyncHandler from '../utils/asyncHandler.js';

// Turn stored { product, quantity } rows into the shape the client cart uses.
// Products that no longer exist are skipped.
const toClientItems = async (cart) => {
  const products = await Product.find({ _id: { $in: cart.map((c) => c.product) } }).select(
    'name price image'
  );
  const byId = new Map(products.map((p) => [String(p._id), p]));

  return cart
    .filter((c) => byId.has(String(c.product)))
    .map((c) => {
      const p = byId.get(String(c.product));
      return { product: String(p._id), name: p.name, price: p.price, image: p.image, quantity: c.quantity };
    });
};

export const getCart = asyncHandler(async (req, res) => {
  res.json({ items: await toClientItems(req.user.cart) });
});

export const updateCart = asyncHandler(async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) {
    res.status(400);
    throw new Error('items must be an array');
  }

  // validate every row and combine duplicate products
  const totals = new Map();
  for (const item of items) {
    const quantity = Number(item?.quantity);
    if (!mongoose.isValidObjectId(item?.product) || !Number.isInteger(quantity) || quantity < 1) {
      res.status(400);
      throw new Error('Each cart item needs a valid product id and a quantity of at least 1');
    }
    const key = String(item.product);
    totals.set(key, (totals.get(key) || 0) + quantity);
  }

  // keep only products that still exist
  const found = await Product.find({ _id: { $in: [...totals.keys()] } }).select('_id');
  const cart = found.map((p) => ({ product: p._id, quantity: totals.get(String(p._id)) }));

  const user = await User.findByIdAndUpdate(req.user._id, { cart }, { new: true, runValidators: true });
  res.json({ items: await toClientItems(user.cart) });
});
