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
  const processedItems = [];
  const decrementedProducts = [];

  try {
    // Atomically check stock and decrement for every product
    for (const item of items) {
      const product = await Product.findOneAndUpdate(
        { _id: item.product, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );

      if (!product) {
        // If atomic update failed, find out why to send correct error message
        const existingProduct = await Product.findById(item.product);
        res.status(existingProduct ? 400 : 404);
        throw new Error(
          existingProduct
            ? `Concurrency error: Not enough stock left for ${existingProduct.name}`
            : `Product not found: ${item.product}`
        );
      }
      
      // Track successful decrements in case we need to rollback later
      decrementedProducts.push({ id: product._id, quantity: item.quantity });
      
      // Calculate total amount securely
      totalAmount += product.price * item.quantity;
      
      // Construct verified item payload
      processedItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
      });
    }

    const order = await Order.create({
      user: req.user._id,
      items: processedItems,
      shippingAddress,
      paymentMethod,
      totalAmount,
    });

    res.status(201).json(order);
  } catch (error) {
    // Rollback stock decrements if the order process fails midway
    for (const dp of decrementedProducts) {
      await Product.updateOne(
        { _id: dp.id },
        { $inc: { stock: dp.quantity } }
      );
    }
    throw error;
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
  order.status = req.body.status;
  await order.save();
  res.json(order);
});
