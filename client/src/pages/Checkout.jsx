import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatINR } from '../utils/format.js';

export default function Checkout() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState(
    user?.address || { line1: '', city: '', state: '', pincode: '' }
  );
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);

  const update = (key) => (e) => setAddress((a) => ({ ...a, [key]: e.target.value }));

  const isValidPincode = (code) => /^[1-9][0-9]{5}$/.test(String(code || '').trim());

  const placeOrder = async (e) => {
    e.preventDefault();
    if (!isValidPincode(address.pincode)) {
      setError('Please enter a valid 6-digit Indian pincode (cannot start with 0).');
      return;
    }
    setPlacing(true);
    setError('');
    try {
      const { data } = await api.post('/orders', {
        items: items.map(({ product, name, price, quantity }) => ({ product, name, price, quantity })),
        shippingAddress: address,
        paymentMethod,
      });
      clearCart();
      navigate('/orders', { state: { placed: data._id } });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) return <p className="muted">Nothing to check out.</p>;

  const pincodeInvalid = Boolean(address.pincode && !isValidPincode(address.pincode));

  return (
    <section className="checkout">
      <form className="card form" onSubmit={placeOrder}>
        <h1>Shipping details</h1>
        <input required placeholder="Address line" value={address.line1} onChange={update('line1')} />
        <input required placeholder="City" value={address.city} onChange={update('city')} />
        <input required placeholder="State" value={address.state} onChange={update('state')} />
        <input
          required
          placeholder="Pincode (6 digits)"
          value={address.pincode}
          onChange={update('pincode')}
          aria-invalid={pincodeInvalid}
        />
        {pincodeInvalid && (
          <p className="field-error" style={{ color: 'var(--danger)', fontSize: '0.85rem', margin: '-8px 0 8px' }}>
            Pincode must be exactly 6 digits and cannot start with 0.
          </p>
        )}

        <label>Payment method</label>
        <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
          <option value="COD">Cash on delivery</option>
          <option value="ONLINE" disabled>Online payment (coming soon)</option>
        </select>

        {error && <p className="error">{error}</p>}
        <button className="btn full" disabled={placing}>
          {placing ? 'Placing order...' : `Place order · ${formatINR(totalPrice)}`}
        </button>
      </form>
    </section>
  );
}
