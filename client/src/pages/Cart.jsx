import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { formatINR } from '../utils/format.js';

export default function Cart() {
  const { items, updateQuantity, removeFromCart, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <section className="empty">
        <h2>Your cart is empty</h2>
        <Link to="/" className="btn">Continue shopping</Link>
      </section>
    );
  }

  return (
    <section>
      <h1>Your Cart</h1>
      <div className="cart-list">
        {items.map((item) => (
          <div key={item.product} className="cart-item card">
            <img src={item.image} alt={item.name} />
            <div className="grow">
              <strong>{item.name}</strong>
              <p className="muted">{formatINR(item.price)} each</p>
            </div>
            <div className="row">
              <button
                className="btn btn-ghost"
                disabled={item.quantity <= 1}
                onClick={() => updateQuantity(item.product, item.quantity - 1)}
              >
                −
              </button>
              <span>{item.quantity}</span>
              <button className="btn btn-ghost" onClick={() => updateQuantity(item.product, item.quantity + 1)}>+</button>
            </div>
            <strong>{formatINR(item.price * item.quantity)}</strong>
            <button className="btn btn-danger" onClick={() => removeFromCart(item.product)}>Remove</button>
          </div>
        ))}
      </div>
      <div className="summary card">
        <span>Total</span>
        <strong>{formatINR(totalPrice)}</strong>
        <Link to="/checkout" className="btn">Proceed to checkout</Link>
      </div>
    </section>
  );
}
