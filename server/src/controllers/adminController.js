import Order from '../models/Order.js';
import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/admin/stats (admin)
export const getStats = asyncHandler(async (req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  // revenue only counts delivered orders
  const revenueResult = await Order.aggregate([
    { $match: { status: 'delivered' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ]);
  const revenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

  const ordersToday = await Order.countDocuments({ createdAt: { $gte: startOfToday } });
  const pendingOrders = await Order.countDocuments({ status: 'pending' });
  const lowStock = await Product.countDocuments({ stock: { $lt: 5 } });

  res.json({ revenue, ordersToday, pendingOrders, lowStock });
});
