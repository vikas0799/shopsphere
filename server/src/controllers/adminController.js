import Order from '../models/Order.js';
import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/admin/stats (admin)
export const getStats = asyncHandler(async (req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [revenueRows, ordersToday, pendingOrders, lowStockProducts] = await Promise.all([
    Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Order.countDocuments({ createdAt: { $gte: startOfToday } }),
    Order.countDocuments({ status: 'pending' }),
    Product.countDocuments({ stock: { $lt: 5 } }),
  ]);

  res.json({
    totalRevenue: revenueRows[0]?.total || 0,
    ordersToday,
    pendingOrders,
    lowStockProducts,
  });
});