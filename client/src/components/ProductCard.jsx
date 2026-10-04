import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { formatINR } from '../utils/format.js';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const outOfStock = product.stock === 0;
  const inWishlist = isInWishlist(product._id);

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <article className="card product-card">
      <div className="product-card-image-wrapper">
        <Link to={`/product/${product._id}`}>
          <img src={product.image} alt={product.name} />
        </Link>
        <button
          type="button"
          className={`wishlist-btn ${inWishlist ? 'active' : ''}`}
          onClick={handleWishlistClick}
          title={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill={inWishlist ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>
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
