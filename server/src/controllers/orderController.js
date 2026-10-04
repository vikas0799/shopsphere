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

  const reserved = [];
  try {
    for (const item of items) {
      const quantity = Number(item.quantity);
      if (!Number.isInteger(quantity) || quantity < 1) {
        res.status(400);
        throw new Error('Each item needs a quantity of at least 1');
      }

      const updated = await Product.updateOne(
        { _id: item.product, stock: { $gte: quantity } },
        { $inc: { stock: -quantity } }
      );
      if (updated.matchedCount === 0) {
        const product = await Product.findById(item.product);
        res.status(product ? 400 : 404);
        throw new Error(product ? `Not enough stock for ${product.name}` : `Product not found: ${item.product}`);
      }
      reserved.push({ product: item.product, quantity });
    }

    // TODO: total is currently calculated from prices sent by the client.
    // This should use prices from the database instead (see issue tracker).
    const totalAmount = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const order = await Order.create({
      user: req.user._id,
      items,
      shippingAddress,
      paymentMethod,
      totalAmount,
    });

    res.status(201).json(order);
  } catch (err) {
    await Promise.all(
      reserved.map((r) => Product.updateOne({ _id: r.product }, { $inc: { stock: r.quantity } }))
    );
    throw err;
  }
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
  const nextStatus = req.body.status;
  if (nextStatus === 'cancelled' && order.status !== 'cancelled') {
    await Promise.all(
      order.items.map((item) => Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } }))
    );
  }
  order.status = nextStatus;
  await order.save();
  res.json(order);
});
