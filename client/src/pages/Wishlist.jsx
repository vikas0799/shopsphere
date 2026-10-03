import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import Loader from '../components/Loader.jsx';
import { formatINR } from '../utils/format.js';

export default function Wishlist() {
  const { wishlist, removeFromWishlist, loading } = useWishlist();
  const { addToCart } = useCart();

  if (loading) return <Loader />;

  if (wishlist.length === 0) {
    return (
      <section className="empty">
        <h2>Your wishlist is empty</h2>
        <p className="muted">Explore products and save items you love!</p>
        <Link to="/" className="btn" style={{ marginTop: '16px' }}>
          Explore products
        </Link>
      </section>
    );
  }

  const handleMoveToCart = (product) => {
    addToCart(product);
    removeFromWishlist(product._id);
  };

  return (
    <section>
      <h1>My Wishlist ({wishlist.length})</h1>
      <div className="cart-list">
        {wishlist.map((product) => {
          const outOfStock = product.stock === 0;
          return (
            <div key={product._id} className="cart-item card">
              <Link to={`/product/${product._id}`}>
                <img src={product.image} alt={product.name} />
              </Link>
              <div className="grow">
                <span className="tag">{product.category}</span>
                <Link to={`/product/${product._id}`} className="product-name" style={{ display: 'block', margin: '4px 0' }}>
                  <strong>{product.name}</strong>
                </Link>
                <div className="row" style={{ gap: '12px' }}>
                  <strong>{formatINR(product.price)}</strong>
                  <span className="muted">★ {product.rating?.toFixed(1) || '0.0'}</span>
                  <span className={outOfStock ? 'error' : 'success'} style={{ fontSize: '0.85rem' }}>
                    {outOfStock ? 'Out of stock' : 'In stock'}
                  </span>
                </div>
              </div>
              <div className="row">
                <button
                  className="btn"
                  disabled={outOfStock}
                  onClick={() => handleMoveToCart(product)}
                >
                  {outOfStock ? 'Out of stock' : 'Move to cart'}
                </button>
                <button
                  className="btn btn-danger"
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
