import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';
import Loader from '../components/Loader.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { formatINR } from '../utils/format.js';

export default function Orders() {
  const location = useLocation();
  const showToast = useToast();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(null);

  useEffect(() => {
    api
      .get('/orders/mine')
      .then(({ data }) => setOrders(data))
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  const handleCancel = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    setCancelling(orderId);
    try {
      const { data } = await api.patch(`/orders/${orderId}/cancel`);
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: data.status } : o))
      );
      showToast('Order cancelled successfully');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setCancelling(null);
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
          {['pending', 'confirmed'].includes(o.status) && (
            <button
              className="btn btn-danger"
              style={{ marginTop: '10px' }}
              disabled={cancelling === o._id}
              onClick={() => handleCancel(o._id)}
            >
              {cancelling === o._id ? 'Cancelling…' : 'Cancel Order'}
            </button>
          )}
        </div>
      ))}
    </section>
  );
}
