import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatINR } from '../utils/format.js';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();
  const outOfStock = product.stock === 0;
  const inWishlist = isInWishlist(product._id);

  const handleWishlistToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    await toggleWishlist(product);
  };

  return (
    <article className="card product-card" style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={handleWishlistToggle}
        aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'rgba(255, 255, 255, 0.92)',
          border: '1px solid var(--border)',
          borderRadius: '50%',
          width: '34px',
          height: '34px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: inWishlist ? 'var(--danger)' : 'var(--muted)',
          fontSize: '1.2rem',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08)',
          zIndex: 2,
        }}
      >
        {inWishlist ? '♥' : '♡'}
      </button>
      <Link to={`/product/${product._id}`}>
        <img src={product.image} alt={product.name} />
      </Link>
      <div className="card-body">
        <span className="tag">{product.category}</span>
        <Link to={`/product/${product._id}`} className="product-name">{product.name}</Link>
        <div className="row-between">
          <strong>{formatINR(product.price)}</strong>
          <span className="muted">★ {product.rating.toFixed(1)}</span>
        </div>
        <button className="btn full" disabled={outOfStock} onClick={() => addToCart(product)}>
          {outOfStock ? 'Out of stock' : 'Add to cart'}
        </button>
      </div>
    </article>
  );
}
