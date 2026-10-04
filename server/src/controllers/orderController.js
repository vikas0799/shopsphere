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

  // Check that every product exists and has enough stock
  for (const item of items) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      res.status(400);
      throw new Error('Quantity must be a whole number of at least 1');
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
  }

  // TODO: total is currently calculated from prices sent by the client.
  // This should use prices from the database instead (see issue tracker).
  const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  // Reduce stock atomically so two parallel orders cannot oversell.
  // The filter only matches while enough stock is left. If it does not match,
  // put back what was already taken for earlier items and reject the order.
  const reduced = [];
  const restoreStock = () =>
    Promise.all(
      reduced.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity } }))
    );

  for (const item of items) {
    const result = await Product.updateOne(
      { _id: item.product, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } }
    );
    if (!result.modifiedCount) {
      await restoreStock();
      res.status(400);
      throw new Error(`Not enough stock for ${item.name || 'one of the items'}`);
    }
    reduced.push(item);
  }

  let order;
  try {
    order = await Order.create({
      user: req.user._id,
      items,
      shippingAddress,
      paymentMethod,
      totalAmount,
    });
  } catch (err) {
    await restoreStock();
    throw err;
  }

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
