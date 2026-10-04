import { useCart } from '../context/CartContext.jsx';

/**
 * Toast – renders a brief success notification when a product is added to cart.
 * State is managed inside CartContext so any add-to-cart call site (ProductCard,
 * ProductDetail, Cart page, etc.) triggers the same notification automatically.
 * No external library required.
 */
export default function Toast() {
  const { toast } = useCart();

  if (!toast) return null;

  return (
    <div className="toast" role="status" aria-live="polite">
      <span className="toast-icon">🛒</span>
      <span className="toast-message">{toast}</span>
    </div>
  );
}
