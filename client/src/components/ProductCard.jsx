import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { formatINR } from '../utils/format.js';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();

  const outOfStock = product.stock === 0;
  const inWishlist = isInWishlist(product._id);

  const toggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    if (inWishlist) {
      removeFromWishlist(product._id);
    } else {
      addToWishlist(product);
    }
  };

  return (
    <article className="card product-card">
      <button
        type="button"
        className={`wishlist-btn ${inWishlist ? 'active' : ''}`}
        onClick={toggleWishlist}
        aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill={inWishlist ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
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
