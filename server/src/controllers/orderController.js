import Order from '../models/Order.js';
import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';

// POST /api/orders
export const createOrder = asyncHandler(async (req, res) => {
  const { items, shippingAddress, paymentMethod } = req.body;

  if (!items || items.length === 0) {
    res.status(400);
    throw new Error('Order must contain at least one item');
  }

  let totalAmount = 0;
  const verifiedItems = [];

  // 1. Verify products, calculate total using DB prices, and sanitize items
  for (const item of items) {
    if (!item.quantity || item.quantity < 1) {
      res.status(400);
      throw new Error('Quantity for all items must be at least 1');
    }

    const product = await Product.findById(item.product);
    if (!product) {
      res.status(404);
      throw new Error(`Product not found: ${item.product}`);
    }
    if (product.stock < item.quantity) {
      res.status(400);
      throw new Error(`Not enough stock for ${product.name}`);
    }

    totalAmount += product.price * item.quantity;
    verifiedItems.push({
      product: product._id,
      name: product.name,
      price: product.price, // Trusted price from DB
      quantity: item.quantity,
    });
  }

  // 2. Reduce the stock of the purchased items
  // Using Promise.all to update all products concurrently
  await Promise.all(
    verifiedItems.map((item) =>
      Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      })
    )
  );

  // 3. Create the order
  const order = await Order.create({
    user: req.user._id,
    items: verifiedItems,
    shippingAddress,
    paymentMethod,
    totalAmount,
  });

  res.status(201).json(order);
});

// GET /api/orders/mine
export const getMyOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).lean();
  res.json(orders);
});

// GET /api/orders/:id
export const getOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email').lean();
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
  const orders = await Order.find().populate('user', 'name email').sort({ createdAt: -1 }).lean();
  res.json(orders);
});

// PATCH /api/orders/:id/status (admin)
export const updateOrderStatus = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  
  const { status } = req.body;

  // Restore inventory if an active order is being cancelled
  if (status === 'cancelled' && order.status !== 'cancelled') {
    await Promise.all(
      order.items.map((item) =>
        Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        })
      )
    );
  }

  order.status = status;
  await order.save();
  res.json(order);
});
