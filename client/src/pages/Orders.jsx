import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';
import Loader from '../components/Loader.jsx';
import { formatINR } from '../utils/format.js';

export default function Orders() {
  const location = useLocation();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const loadOrders = () => {
    api
      .get('/orders/mine')
      .then(({ data }) => setOrders(data))
      .catch((err) => setError(getErrorMessage(err)));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancellingId(id);
    try {
      await api.patch(`/orders/${id}/cancel`);
      loadOrders();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCancellingId(null);
    }
  };

  if (error) return <p className="error">{error}</p>;
  if (!orders) return <Loader />;

  return (
    <section>
      <h1>My Orders</h1>
      {location.state?.placed && <p className="success">Order placed successfully!</p>}
      {orders.length === 0 && <p className="muted">You have not placed any orders yet.</p>}
      {orders.map((o) => (
        <div key={o._id} className="card order">
          <div className="row-between">
            <span className="muted">#{o._id.slice(-6).toUpperCase()}</span>
            <span className={`status status-${o.status}`}>{o.status}</span>
          </div>
          <ul>
            {o.items.map((i) => (
              <li key={i.product}>{i.name} × {i.quantity}</li>
            ))}
          </ul>
          <div className="row-between">
            <span className="muted">{new Date(o.createdAt).toLocaleDateString('en-IN')}</span>
            <strong>{formatINR(o.totalAmount)}</strong>
          </div>
          {(o.status === 'pending' || o.status === 'confirmed') && (
            <div style={{ marginTop: '12px' }}>
              <button
                className="btn btn-ghost"
                style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}
                disabled={cancellingId === o._id}
                onClick={() => handleCancel(o._id)}
              >
                {cancellingId === o._id ? 'Cancelling...' : 'Cancel order'}
              </button>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
