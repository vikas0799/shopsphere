import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../../api/client.js';
import Loader from '../../components/Loader.jsx';
import { formatINR } from '../../utils/format.js';

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState('');

  const loadOrders = () => api.get('/orders').then(({ data }) => setOrders(data));

  const loadStats = () => {
    setStatsLoading(true);
    setStatsError('');
    return api
      .get('/admin/stats')
      .then(({ data }) => setStats(data))
      .catch((err) => setStatsError(getErrorMessage(err)))
      .finally(() => setStatsLoading(false));
  };

  useEffect(() => {
    loadOrders();
    loadStats();
  }, []);

  const changeStatus = async (id, status) => {
    await api.patch(`/orders/${id}/status`, { status });
    loadOrders();
    loadStats();
  };

  return (
    <section>
      <div className="row-between">
        <h1>Admin · Orders</h1>
        <Link to="/admin/products" className="btn btn-ghost">← Products</Link>
      </div>

      {statsLoading ? (
        <Loader text="Loading dashboard stats..." />
      ) : statsError ? (
        <p className="error">{statsError}</p>
      ) : stats ? (
        <div className="stats-grid">
          <div className="card stat-card" id="stat-total-revenue">
            <span className="stat-label">Total Revenue</span>
            <strong className="stat-value">{formatINR(stats.totalRevenue)}</strong>
          </div>
          <div className="card stat-card" id="stat-orders-today">
            <span className="stat-label">Orders Today</span>
            <strong className="stat-value">{stats.ordersToday}</strong>
          </div>
          <div className="card stat-card" id="stat-pending-orders">
            <span className="stat-label">Pending Orders</span>
            <strong className="stat-value">{stats.pendingOrders}</strong>
          </div>
          <div className="card stat-card" id="stat-low-stock">
            <span className="stat-label">Low Stock Products</span>
            <strong className="stat-value">{stats.lowStockProducts}</strong>
          </div>
        </div>
      ) : null}
      <table className="table">
        <thead>
          <tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o._id}>
              <td>#{o._id.slice(-6).toUpperCase()}</td>
              <td>{o.user?.name}<br /><span className="muted">{o.user?.email}</span></td>
              <td>{new Date(o.createdAt).toLocaleDateString('en-IN')}</td>
              <td>{formatINR(o.totalAmount)}</td>
              <td>
                <select value={o.status} onChange={(e) => changeStatus(o._id, e.target.value)}>
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
