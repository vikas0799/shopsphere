import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext.jsx';
import Loader from '../components/Loader.jsx';
import { formatINR } from '../utils/format.js';

export default function Wishlist() {
  const { wishlist, loading, removeFromWishlist, moveToCart } = useWishlist();

  if (loading) return <Loader />;

  if (wishlist.length === 0) {
    return (
      <div className="empty">
        <h2>Your wishlist is empty</h2>
        <p className="muted">Explore items and save your favorites for later.</p>
        <Link to="/" className="btn" style={{ marginTop: '16px' }}>
          Explore Products
        </Link>
      </div>
    );
  }

  return (
    <section>
      <h1>My Wishlist ({wishlist.length})</h1>
      <div className="grid" style={{ marginTop: '20px' }}>
        {wishlist.map((product) => {
          const outOfStock = product.stock === 0;
          return (
            <article key={product._id} className="card product-card">
              <div className="product-card-image-wrapper">
                <Link to={`/product/${product._id}`}>
                  <img src={product.image} alt={product.name} />
                </Link>
                <button
                  type="button"
                  className="wishlist-btn active"
                  onClick={() => removeFromWishlist(product._id)}
                  title="Remove from wishlist"
                  aria-label="Remove from wishlist"
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" stroke="currentColor" strokeWidth="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                  </svg>
                </button>
              </div>
              <div className="card-body">
                <span className="tag">{product.category}</span>
                <Link to={`/product/${product._id}`} className="product-name">
                  {product.name}
                </Link>
                <div className="row-between">
                  <strong>{formatINR(product.price)}</strong>
                  <span className="muted">★ {product.rating ? product.rating.toFixed(1) : '0.0'}</span>
                </div>
                <div className="row" style={{ marginTop: '8px' }}>
                  <button
                    className="btn grow"
                    disabled={outOfStock}
                    onClick={() => moveToCart(product)}
                  >
                    {outOfStock ? 'Out of stock' : 'Move to cart'}
                  </button>
                  <button
                    className="btn btn-ghost btn-danger"
                    onClick={() => removeFromWishlist(product._id)}
                    title="Remove from wishlist"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
