import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import { formatINR } from '../../utils/format.js';

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);

  const load = () => api.get('/orders').then(({ data }) => setOrders(data));
  useEffect(() => {
    load();
    api.get('/admin/stats').then(({ data }) => setStats(data));
  }, []);

  const changeStatus = async (id, status) => {
    await api.patch(`/orders/${id}/status`, { status });
    load();
  };

  return (
    <section>
      <div className="row-between">
        <h1>Admin · Orders</h1>
        <Link to="/admin/products" className="btn btn-ghost">← Products</Link>
      </div>
      {stats && (
        <div className="stat-grid">
          <div className="card stat-card"><p className="muted">Revenue (delivered)</p><h2>{formatINR(stats.totalRevenue)}</h2></div>
          <div className="card stat-card"><p className="muted">Orders today</p><h2>{stats.ordersToday}</h2></div>
          <div className="card stat-card"><p className="muted">Pending orders</p><h2>{stats.pendingOrders}</h2></div>
          <div className="card stat-card"><p className="muted">Low stock</p><h2>{stats.lowStockProducts}</h2></div>
        </div>
      )}
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
