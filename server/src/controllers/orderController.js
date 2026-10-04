import Order from '../models/Order.js';
import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';

// POST /api/orders
export const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    res.status(400);
    throw new Error('Order must contain at least one item');
  }

  // Aggregate quantities by product to prevent duplicate-item stock bypass attacks
  const productQuantities = new Map();
  for (const item of items) {
    if (!item || typeof item !== 'object') {
      res.status(400);
      throw new Error('Invalid item format');
    }

    const { product, quantity } = item;
    const qty = Number(quantity);

    if (!Number.isInteger(qty) || qty < 1) {
      res.status(400);
      throw new Error('Item quantity must be a positive integer');
    }

    const productId = String(product || '').trim();
    if (!productId) {
      res.status(400);
      throw new Error('Product ID is required');
    }

    productQuantities.set(productId, (productQuantities.get(productId) || 0) + qty);
  }

  // Verify products, check total stock per product, and use database prices/names (ignore client-supplied prices)
  const orderItems = [];
  let totalAmount = 0;

  for (const [productId, totalQty] of productQuantities.entries()) {
    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      throw new Error(`Product not found: ${productId}`);
    }

    if (product.stock < totalQty) {
      res.status(400);
      throw new Error(`Not enough stock for ${product.name}`);
    }

    orderItems.push({
      product: product._id,
      name: product.name,
      price: product.price,
      quantity: totalQty,
    });

    totalAmount += product.price * totalQty;
  }

  // TODO: stock is not reduced after an order is placed.

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    paymentMethod,
    totalAmount,
  });

  res.status(201).json(order);
});

// GET /api/orders/mine
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

// GET /api/orders/:id
export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const isOwner = order.user._id.equals(req.user._id);
  if (!isOwner && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not allowed to view this order');
  }
  res.json(order);
});

// GET /api/orders (admin)
export const getAllOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 });
  res.json(orders);
});

// PATCH /api/orders/:id/status (admin)
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  order.status = req.body.status;
  await order.save();
  res.json(order);
});
