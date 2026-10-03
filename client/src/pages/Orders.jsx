import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';
import Loader from '../components/Loader.jsx';
import { formatINR } from '../utils/format.js';

export default function Orders() {
  const location = useLocation();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');

  const loadOrders = () => {
    api
      .get('/orders/mine')
      .then(({ data }) => setOrders(data))
      .catch((err) => setError(getErrorMessage(err)));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleCancel = async (orderId) => {
    setError('');
    setFeedback('');
    try {
      await api.patch(`/orders/${orderId}/cancel`);
      setFeedback('Order cancelled successfully.');
      loadOrders();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (error && !orders) return <p className="error">{error}</p>;
  if (!orders) return <Loader />;

  return (
    <section>
      <h1>My Orders</h1>
      {location.state?.placed && <p className="success">Order placed successfully!</p>}
      {feedback && <p className="success">{feedback}</p>}
      {error && <p className="error">{error}</p>}
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
            <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => handleCancel(o._id)}
              >
                Cancel order
              </button>
            </div>
          )}
        </div>
      ))}
    </section>
  );
}
