import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import { formatINR } from '../../utils/format.js';

const STATUSES = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);

  const load = () => {
    api.get('/orders').then(({ data }) => setOrders(data));
    api.get('/admin/stats').then(({ data }) => setStats(data)).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const changeStatus = async (id, status) => {
    await api.patch(`/orders/${id}/status`, { status });
    load();
  };

  return (
    <section>
      <div className="row-between" style={{ marginBottom: '20px' }}>
        <h1>Admin · Orders</h1>
        <Link to="/admin/products" className="btn btn-ghost">← Products</Link>
      </div>

      {stats && (
        <div className="grid" style={{ marginBottom: '24px' }}>
          <div className="card">
            <div className="card-body">
              <span className="muted" style={{ fontSize: '0.85rem' }}>Total Revenue (Delivered)</span>
              <strong style={{ fontSize: '1.4rem' }}>{formatINR(stats.totalRevenue)}</strong>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <span className="muted" style={{ fontSize: '0.85rem' }}>Orders Today</span>
              <strong style={{ fontSize: '1.4rem' }}>{stats.ordersToday}</strong>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <span className="muted" style={{ fontSize: '0.85rem' }}>Pending Orders</span>
              <strong style={{ fontSize: '1.4rem' }}>{stats.pendingOrders}</strong>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <span className="muted" style={{ fontSize: '0.85rem' }}>Low-Stock Products (&lt; 5)</span>
              <strong style={{ fontSize: '1.4rem', color: stats.lowStockProducts > 0 ? 'var(--danger)' : 'inherit' }}>
                {stats.lowStockProducts}
              </strong>
            </div>
          </div>
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
