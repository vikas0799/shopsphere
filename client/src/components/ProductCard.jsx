import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import api, { getErrorMessage } from '../api/client.js';
import { formatINR } from '../utils/format.js';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [wishlistError, setWishlistError] = useState('');
  const outOfStock = product.stock === 0;

  useEffect(() => {
    let active = true;

    if (!user) {
      setIsWishlisted(false);
      return () => {
        active = false;
      };
    }

    api.get('/wishlist')
      .then(({ data }) => {
        if (active) {
          setIsWishlisted(
            data.some((item) => item._id === product._id)
          );
        }
      })
      .catch(() => {
        // Keep the product card usable if wishlist loading fails.
      });

    return () => {
      active = false;
    };
  }, [user, product._id]);

  const toggleWishlist = async () => {
    if (!user) {
      setWishlistError('Please log in to use your wishlist.');
      return;
    }

    setWishlistLoading(true);
    setWishlistError('');

    try {
      if (isWishlisted) {
        await api.delete(`/wishlist/${product._id}`);
        setIsWishlisted(false);
      } else {
        await api.post(`/wishlist/${product._id}`);
        setIsWishlisted(true);
      }
    } catch (error) {
      setWishlistError(getErrorMessage(error));
    } finally {
      setWishlistLoading(false);
    }
  };

  return (
    <article className="card product-card">
      <div className="product-image-wrap">
        <Link to={`/product/${product._id}`}>
          <img src={product.image} alt={product.name} />
        </Link>
        <button
          type="button"
          className="wishlist-heart"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={isWishlisted}
          disabled={wishlistLoading}
          onClick={toggleWishlist}
        >
          {isWishlisted ? '♥' : '♡'}
        </button>
      </div>

      <div className="card-body">
        <span className="tag">{product.category}</span>
        <Link to={`/product/${product._id}`} className="product-name">
          {product.name}
        </Link>
        <div className="row-between">
          <strong>{formatINR(product.price)}</strong>
          <span className="muted">★ {product.rating.toFixed(1)}</span>
        </div>
        {wishlistError && <p className="muted">{wishlistError}</p>}
        <button
          className="btn full"
          disabled={outOfStock}
          onClick={() => addToCart(product)}
        >
          {outOfStock ? 'Out of stock' : 'Add to cart'}
        </button>
      </div>
    </article>
  );
}