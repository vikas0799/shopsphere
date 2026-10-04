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

  const orderItems = [];
  let totalAmount = 0;

  for (const item of items) {
    if (!item || typeof item !== 'object') {
      res.status(400);
      throw new Error('Invalid order item');
    }

    const quantity = Number(item.quantity);
    if (
      item.quantity === null ||
      item.quantity === undefined ||
      (typeof item.quantity !== 'number' && typeof item.quantity !== 'string') ||
      (typeof item.quantity === 'string' && item.quantity.trim() === '') ||
      !Number.isSafeInteger(quantity) ||
      quantity <= 0
    ) {
      res.status(400);
      throw new Error('Quantity must be a positive integer');
    }

    const productId = item.product || item.productId;
    if (!productId) {
      res.status(400);
      throw new Error('Product ID is required');
    }

    const product = await Product.findById(productId);
    if (!product) {
      res.status(404);
      throw new Error(`Product not found: ${productId}`);
    }

    if (product.stock < quantity) {
      res.status(400);
      throw new Error(`Not enough stock for ${product.name}`);
    }

    // Server-side calculation from authoritative MongoDB price
    totalAmount += product.price * quantity;

    // Explicitly construct trusted order item using database values
    orderItems.push({
      product: product._id,
      name: product.name,
      price: product.price,
      quantity,
    });
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
