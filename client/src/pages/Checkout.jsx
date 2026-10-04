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
  const [pincodeError, setPincodeError] = useState('');
  const [placing, setPlacing] = useState(false);

  const update = (key) => (e) => setAddress((a) => ({ ...a, [key]: e.target.value }));

  const handlePincodeChange = (e) => {
    const val = e.target.value;
    setAddress((a) => ({ ...a, pincode: val }));
    if (val && !/^\d{6}$/.test(val)) {
      setPincodeError('Pincode must be exactly 6 digits');
    } else {
      setPincodeError('');
    }
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(address.pincode)) {
      setError('Please enter a valid 6-digit pincode');
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
          onChange={handlePincodeChange}
          maxLength={6}
          pattern="[0-9]{6}"
          title="Pincode must be exactly 6 digits"
        />
        {pincodeError && <p className="error" style={{ marginTop: '-4px' }}>{pincodeError}</p>}

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
