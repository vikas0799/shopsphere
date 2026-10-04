import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { formatINR } from '../utils/format.js';

export default function Wishlist() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();

  const handleMoveToCart = (product) => {
    addToCart(product, 1);
    removeFromWishlist(product._id);
  };

  if (wishlist.length === 0) {
    return (
      <section className="empty">
        <h2>Your wishlist is empty</h2>
        <p className="muted">Explore products and save items you like for later.</p>
        <Link to="/" className="btn" style={{ marginTop: '16px' }}>
          Explore products
        </Link>
      </section>
    );
  }

  return (
    <section>
      <h1>My Wishlist ({wishlist.length})</h1>
      <div className="cart-list" style={{ marginTop: '20px' }}>
        {wishlist.map((product) => {
          const outOfStock = product.stock === 0;
          return (
            <div key={product._id} className="cart-item card">
              <Link to={`/product/${product._id}`}>
                <img src={product.image} alt={product.name} />
              </Link>
              <div className="grow">
                <Link to={`/product/${product._id}`} style={{ color: 'var(--text)' }}>
                  <strong>{product.name}</strong>
                </Link>
                <p className="muted" style={{ margin: '4px 0' }}>
                  {product.category} · by {product.brand}
                </p>
                <strong>{formatINR(product.price)}</strong>
              </div>
              <div className="row" style={{ gap: '12px' }}>
                <button
                  className="btn"
                  disabled={outOfStock}
                  onClick={() => handleMoveToCart(product)}
                >
                  {outOfStock ? 'Out of stock' : 'Move to cart'}
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => removeFromWishlist(product._id)}
                >
                  Remove
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
