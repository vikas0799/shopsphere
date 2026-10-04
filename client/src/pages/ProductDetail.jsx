import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import Loader from '../components/Loader.jsx';
import { formatINR } from '../utils/format.js';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/products/${id}`)
      .then(({ data }) => setProduct(data))
      .catch((err) => setError(getErrorMessage(err)));
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!product) return <Loader />;

  const inWishlist = isInWishlist(product._id);

  const handleAdd = () => {
    addToCart(product, qty);
    navigate('/cart');
  };

  return (
    <section className="detail">
      <img src={product.image} alt={product.name} />
      <div>
        <span className="tag">{product.category}</span>
        <h1>{product.name}</h1>
        <p className="muted">by {product.brand} · ★ {product.rating.toFixed(1)}</p>
        <h2>{formatINR(product.price)}</h2>
        <p>{product.description}</p>
        <p className={product.stock > 0 ? 'success' : 'error'}>
          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
        </p>
        <div className="row" style={{ marginTop: '16px' }}>
          {product.stock > 0 && (
            <>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="qty"
              />
              <button className="btn" onClick={handleAdd}>Add to cart</button>
            </>
          )}
          <button
            className={`btn btn-ghost ${inWishlist ? 'active-wishlist' : ''}`}
            onClick={() => toggleWishlist(product)}
          >
            {inWishlist ? '♥ Wishlisted' : '♡ Add to wishlist'}
          </button>
        </div>
        {/* TODO: reviews section - see "Product reviews" issue */}
      </div>
    </section>
  );
}
