import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';
import Loader from '../components/Loader.jsx';
import { formatINR } from '../utils/format.js';

export default function Wishlist() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { addToCart } = useCart();

  const loadWishlist = async () => {
    try {
      setError('');
      const { data } = await api.get('/wishlist');
      setProducts(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWishlist();
  }, []);

  const moveToCart = async (product) => {
    try {
      await addToCart(product);
      await api.delete(`/wishlist/${product._id}`);
      setProducts((current) =>
        current.filter((item) => item._id !== product._id)
      );
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      await api.delete(`/wishlist/${productId}`);
      setProducts((current) =>
        current.filter((item) => item._id !== productId)
      );
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading) return <Loader />;

  return (
    <section>
      <div className="hero">
        <h1>My Wishlist ♥</h1>
        <p className="muted">Your saved favourites, all in one place.</p>
      </div>

      {error && <p className="error">{error}</p>}

      {products.length === 0 ? (
        <div className="empty">
          <h2>Your wishlist is empty</h2>
          <p className="muted">Save products you love to find them here.</p>
          <Link className="btn" to="/">Explore products</Link>
        </div>
      ) : (
        <div className="grid">
          {products.map((product) => (
            <article className="card" key={product._id}>
              <Link to={`/product/${product._id}`}>
                <img src={product.image} alt={product.name} />
              </Link>
              <div className="card-body">
                <Link
                  to={`/product/${product._id}`}
                  className="product-name"
                >
                  {product.name}
                </Link>
                <strong>{formatINR(product.price)}</strong>
                <button
                  className="btn full"
                  onClick={() => moveToCart(product)}
                  disabled={product.stock === 0}
                >
                  {product.stock === 0 ? 'Out of stock' : 'Move to cart'}
                </button>
                <button
                  className="btn btn-ghost full"
                  onClick={() => removeFromWishlist(product._id)}
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}