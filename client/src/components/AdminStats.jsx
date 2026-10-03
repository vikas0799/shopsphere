import Loader from './Loader.jsx';
import { formatINR } from '../utils/format.js';

export default function AdminStats({ stats, loading, error }) {
  if (loading) return <Loader />;
  if (error) return <p className="error">{error}</p>;
  if (!stats) return null;

  return (
    <div className="stats-grid">
      <div className="card stat-card">
        <span className="stat-label">Total Revenue</span>
        <strong className="stat-value">{formatINR(stats.totalRevenue)}</strong>
        <span className="muted" style={{ fontSize: '0.8rem' }}>Delivered orders</span>
      </div>
      <div className="card stat-card">
        <span className="stat-label">Orders Today</span>
        <strong className="stat-value">{stats.ordersToday}</strong>
        <span className="muted" style={{ fontSize: '0.8rem' }}>Placed today</span>
      </div>
      <div className="card stat-card">
        <span className="stat-label">Pending Orders</span>
        <strong className="stat-value">{stats.pendingOrders}</strong>
        <span className="muted" style={{ fontSize: '0.8rem' }}>Needs attention</span>
      </div>
      <div className="card stat-card">
        <span className="stat-label">Low-Stock Products</span>
        <strong className="stat-value">{stats.lowStockProducts}</strong>
        <span className="muted" style={{ fontSize: '0.8rem' }}>Stock &lt; 5 items</span>
      </div>
    </div>
  );
}
