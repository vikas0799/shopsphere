import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import Loader from '../components/Loader.jsx';
import { formatINR } from '../utils/format.js';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = () => {
    api
      .get(`/products/${id}/reviews`)
      .then(({ data }) => setReviews(data))
      .catch(() => {});
  };

  useEffect(() => {
    api
      .get(`/products/${id}`)
      .then(({ data }) => setProduct(data))
      .catch((err) => setError(getErrorMessage(err)));

    loadReviews();
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!product) return <Loader />;

  const handleAdd = () => {
    addToCart(product, qty);
    navigate('/cart');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError('');
    setSubmitting(true);
    try {
      await api.post(`/products/${id}/reviews`, { rating: Number(rating), comment });
      setComment('');
      setRating(5);
      loadReviews();
      api.get(`/products/${id}`).then(({ data }) => setProduct(data));
    } catch (err) {
      setReviewError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
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
        {product.stock > 0 && (
          <div className="row">
            <input
              type="number"
              min="1"
              value={qty}
              onChange={(e) => setQty(Number(e.target.value))}
              className="qty"
            />
            <button className="btn" onClick={handleAdd}>Add to cart</button>
          </div>
        )}

        <div style={{ marginTop: '32px', borderTop: '1px solid var(--border)', paddingTop: '24px' }}>
          <h3>Customer Reviews ({reviews.length})</h3>

          {user ? (
            <form onSubmit={handleReviewSubmit} style={{ marginTop: '16px', marginBottom: '24px' }}>
              <h4>Leave a review</h4>
              <div className="row" style={{ margin: '8px 0' }}>
                <label htmlFor="rating-select">Rating:</label>
                <select id="rating-select" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                  <option value={5}>5 ★ - Excellent</option>
                  <option value={4}>4 ★ - Good</option>
                  <option value={3}>3 ★ - Average</option>
                  <option value={2}>2 ★ - Poor</option>
                  <option value={1}>1 ★ - Terrible</option>
                </select>
              </div>
              <textarea
                required
                placeholder="Write your review here..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                style={{ width: '100%', marginBottom: '8px' }}
              />
              {reviewError && <p className="error">{reviewError}</p>}
              <button className="btn" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit review'}
              </button>
            </form>
          ) : (
            <p className="muted" style={{ margin: '12px 0' }}>
              Please <Link to="/login">login</Link> to leave a review.
            </p>
          )}

          {reviews.length === 0 ? (
            <p className="muted">No reviews yet. Be the first to review!</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
              {reviews.map((r) => (
                <div key={r._id} className="card" style={{ padding: '12px 16px' }}>
                  <div className="row-between">
                    <strong>{r.user?.name || 'Customer'}</strong>
                    <span style={{ color: 'var(--primary)', fontWeight: '600' }}>★ {r.rating}</span>
                  </div>
                  <p style={{ margin: '6px 0' }}>{r.comment}</p>
                  <span className="muted" style={{ fontSize: '0.8rem' }}>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
