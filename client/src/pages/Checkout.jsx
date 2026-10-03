import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatINR } from '../utils/format.js';

function validatePincode(code) {
  if (!code || !code.trim()) {
    return 'Pincode is required';
  }
  const trimmed = code.trim();
  if (/^0/.test(trimmed)) {
    return 'Pincode cannot start with 0';
  }
  if (!/^\d+$/.test(trimmed)) {
    return 'Pincode must contain only digits';
  }
  if (trimmed.length !== 6) {
    return 'Pincode must be exactly 6 digits';
  }
  return '';
}

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
  const [pincodeError, setPincodeError] = useState('');
  const [pincodeTouched, setPincodeTouched] = useState(false);

  const update = (key) => (e) => setAddress((a) => ({ ...a, [key]: e.target.value }));

  const handlePincodeChange = (e) => {
    const val = e.target.value;
    setAddress((a) => ({ ...a, pincode: val }));
    if (pincodeTouched) {
      setPincodeError(validatePincode(val));
    } else if (val.startsWith('0') || !/^\d*$/.test(val) || val.length > 6) {
      setPincodeError(validatePincode(val));
    } else {
      setPincodeError('');
    }
  };

  const handlePincodeBlur = () => {
    setPincodeTouched(true);
    setPincodeError(validatePincode(address.pincode));
  };

  const placeOrder = async (e) => {
    e.preventDefault();
    const pinErr = validatePincode(address.pincode);
    if (pinErr) {
      setPincodeError(pinErr);
      setPincodeTouched(true);
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
          placeholder="Pincode"
          value={address.pincode}
          onChange={handlePincodeChange}
          onBlur={handlePincodeBlur}
          aria-invalid={Boolean(pincodeError)}
          aria-describedby={pincodeError ? 'pincode-error' : undefined}
        />
        {pincodeError && (
          <p id="pincode-error" className="error" role="alert" style={{ margin: '-4px 0 0', fontSize: '0.85rem' }}>
            {pincodeError}
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
