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
  const [qty, setQty] = useState(1);
  const [error, setError] = useState('');

  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get(`/products/${id}`)
      .then(({ data }) => setProduct(data))
      .catch((err) => setError(getErrorMessage(err)));

    api
      .get(`/products/${id}/reviews`)
      .then(({ data }) => setReviews(data))
      .catch(() => {});
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!product) return <Loader />;

  const handleAdd = () => {
    addToCart(product, qty);
    navigate('/cart');
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setReviewError('');
    setReviewSuccess('');
    setSubmitting(true);
    try {
      const { data } = await api.post(`/products/${id}/reviews`, {
        rating,
        comment,
      });
      setReviews((prev) => [data, ...prev]);
      setComment('');
      setRating(5);
      setReviewSuccess('Review posted successfully!');
      api.get(`/products/${id}`).then(({ data: p }) => setProduct(p));
    } catch (err) {
      setReviewError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
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
        </div>
      </section>

      <section style={{ marginTop: '48px' }}>
        <h2>Customer Reviews ({reviews.length})</h2>

        {user ? (
          <form className="card form" onSubmit={submitReview} style={{ maxWidth: '600px', marginBottom: '24px' }}>
            <h3>Write a review</h3>
            <label>Rating</label>
            <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
              <option value="5">★★★★★ (5 - Excellent)</option>
              <option value="4">★★★★☆ (4 - Good)</option>
              <option value="3">★★★☆☆ (3 - Average)</option>
              <option value="2">★★☆☆☆ (2 - Poor)</option>
              <option value="1">★☆☆☆☆ (1 - Terrible)</option>
            </select>
            <textarea
              required
              placeholder="Share your thoughts about this product..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            {reviewError && <p className="error">{reviewError}</p>}
            {reviewSuccess && <p className="success">{reviewSuccess}</p>}
            <button className="btn" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit review'}
            </button>
          </form>
        ) : (
          <p className="muted">
            <Link to="/login">Log in</Link> to review this product.
          </p>
        )}

        {reviews.length === 0 ? (
          <p className="muted">No reviews yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '600px' }}>
            {reviews.map((r) => (
              <div key={r._id} className="card" style={{ padding: '16px' }}>
                <div className="row-between">
                  <strong>{r.user?.name || 'Customer'}</strong>
                  <span className="muted" style={{ fontSize: '0.85rem' }}>
                    {new Date(r.createdAt).toLocaleDateString('en-IN')}
                  </span>
                </div>
                <div style={{ color: '#f5a623', margin: '4px 0' }}>
                  {'★'.repeat(r.rating) + '☆'.repeat(5 - r.rating)}
                </div>
                <p style={{ margin: '4px 0 0' }}>{r.comment}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
