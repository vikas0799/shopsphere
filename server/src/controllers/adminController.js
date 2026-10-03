import Order from '../models/Order.js';
import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/admin/stats
export const getAdminStats = asyncHandler(async (req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [revenueResult, ordersToday, pendingOrders, lowStockProducts] = await Promise.all([
    Order.aggregate([
      { $match: { status: 'delivered' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]),
    Order.countDocuments({ createdAt: { $gte: startOfToday } }),
    Order.countDocuments({ status: 'pending' }),
    Product.countDocuments({ stock: { $lt: 5 } }),
  ]);

  const totalRevenue = revenueResult[0]?.total || 0;

  res.json({
    totalRevenue,
    ordersToday,
    pendingOrders,
    lowStockProducts,
  });
});
