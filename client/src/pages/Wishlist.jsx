import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { formatINR } from '../utils/format.js';

export default function Wishlist() {
  const { wishlist, loading, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleMoveToCart = (product) => {
    addToCart(product);
    removeFromWishlist(product._id);
  };

  if (loading) {
    return <div className="loader">Loading wishlist...</div>;
  }

  return (
    <div>
      <div className="hero">
        <h1>My Wishlist</h1>
        <p className="muted">
          {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved for later
        </p>
      </div>

      {wishlist.length === 0 ? (
        <div className="empty">
          <h2>Your wishlist is empty</h2>
          <p className="muted">Explore items and save your favorites to your wishlist.</p>
          <Link to="/" className="btn" style={{ marginTop: '16px' }}>
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="grid">
          {wishlist.map((product) => {
            const outOfStock = product.stock === 0;
            return (
              <article key={product._id} className="card product-card">
                <div className="product-image-container">
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
                    ❤️
                  </button>
                </div>
                <div className="card-body">
                  <span className="tag">{product.category}</span>
                  <Link to={`/product/${product._id}`} className="product-name">
                    {product.name}
                  </Link>
                  <div className="row-between">
                    <strong>{formatINR(product.price)}</strong>
                    <span className="muted">★ {product.rating?.toFixed(1) || '0.0'}</span>
                  </div>
                  <div className="row" style={{ marginTop: '4px' }}>
                    <button
                      className="btn grow"
                      disabled={outOfStock}
                      onClick={() => handleMoveToCart(product)}
                    >
                      {outOfStock ? 'Out of stock' : 'Move to cart'}
                    </button>
                    <button
                      className="btn btn-ghost"
                      onClick={() => removeFromWishlist(product._id)}
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
