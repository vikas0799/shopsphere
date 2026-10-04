import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext.jsx';
import Loader from '../components/Loader.jsx';
import { formatINR } from '../utils/format.js';

export default function Wishlist() {
  const { wishlist, loading, removeFromWishlist, moveToCart } = useWishlist();

  if (loading) return <Loader />;

  return (
    <section>
      <h1>My Wishlist</h1>
      {wishlist.length === 0 ? (
        <div className="empty">
          <p className="muted">Your wishlist is empty.</p>
          <Link to="/" className="btn" style={{ marginTop: '16px' }}>
            Explore products
          </Link>
        </div>
      ) : (
        <div className="grid">
          {wishlist.map((product) => {
            if (!product) return null;
            const outOfStock = product.stock === 0;
            return (
              <article key={product._id} className="card product-card">
                <Link to={`/product/${product._id}`}>
                  <img src={product.image} alt={product.name} />
                </Link>
                <div className="card-body">
                  <span className="tag">{product.category}</span>
                  <Link to={`/product/${product._id}`} className="product-name">
                    {product.name}
                  </Link>
                  <div className="row-between">
                    <strong>{formatINR(product.price)}</strong>
                    <span className="muted">★ {product.rating?.toFixed(1) || '0.0'}</span>
                  </div>
                  <button
                    className="btn full"
                    disabled={outOfStock}
                    onClick={() => moveToCart(product)}
                  >
                    {outOfStock ? 'Out of stock' : 'Move to cart'}
                  </button>
                  <button
                    className="btn btn-ghost full"
                    style={{ fontSize: '0.85rem', padding: '6px' }}
                    onClick={() => removeFromWishlist(product._id)}
                  >
                    Remove
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
