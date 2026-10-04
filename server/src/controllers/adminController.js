import Order from '../models/Order.js';
import Product from '../models/Product.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/admin/stats
export const getAdminStats = asyncHandler(async (req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const startOfTomorrow = new Date(startOfToday);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const [orderStatsResult, productStatsResult] = await Promise.all([
    Order.aggregate([
      {
        $facet: {
          deliveredRevenue: [
            { $match: { status: 'delivered' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } },
          ],
          ordersToday: [
            { $match: { createdAt: { $gte: startOfToday, $lt: startOfTomorrow } } },
            { $count: 'count' },
          ],
          pendingOrders: [
            { $match: { status: 'pending' } },
            { $count: 'count' },
          ],
        },
      },
    ]),
    Product.aggregate([
      { $match: { stock: { $lt: 5 } } },
      { $count: 'count' },
    ]),
  ]);

  const totalRevenue = orderStatsResult[0]?.deliveredRevenue[0]?.total ?? 0;
  const ordersToday = orderStatsResult[0]?.ordersToday[0]?.count ?? 0;
  const pendingOrders = orderStatsResult[0]?.pendingOrders[0]?.count ?? 0;
  const lowStockProducts = productStatsResult[0]?.count ?? 0;

  res.json({
    totalRevenue,
    ordersToday,
    pendingOrders,
    lowStockProducts,
  });
});
