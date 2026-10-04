import { useEffect, useState, useCallback } from 'react';
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

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState('');

  // Review Form state
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const fetchReviews = useCallback(() => {
    setReviewsLoading(true);
    setReviewsError('');
    api
      .get(`/products/${id}/reviews`)
      .then(({ data }) => {
        setReviews(data);
        setReviewsLoading(false);
      })
      .catch((err) => {
        setReviewsError(getErrorMessage(err));
        setReviewsLoading(false);
      });
  }, [id]);

  useEffect(() => {
    api
      .get(`/products/${id}`)
      .then(({ data }) => setProduct(data))
      .catch((err) => setError(getErrorMessage(err)));

    fetchReviews();
  }, [id, fetchReviews]);

  if (error) return <p className="error">{error}</p>;
  if (!product) return <Loader />;

  const handleAdd = () => {
    addToCart(product, qty);
    navigate('/cart');
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');

    if (!comment.trim()) {
      setSubmitError('Please enter a comment');
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/products/${id}/reviews`, {
        rating: Number(rating),
        comment: comment.trim(),
      });
      setSubmitSuccess('Review submitted successfully!');
      setComment('');
      setRating(5);

      // Refresh reviews list and product to reflect updated rating
      fetchReviews();
      api.get(`/products/${id}`).then(({ data }) => setProduct(data));
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <section className="detail">
        <img src={product.image} alt={product.name} />
        <div>
          <span className="tag">{product.category}</span>
          <h1>{product.name}</h1>
          <p className="muted">
            by {product.brand} · ★ {product.rating.toFixed(1)} ({reviews.length}{' '}
            {reviews.length === 1 ? 'review' : 'reviews'})
          </p>
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
              <button className="btn" onClick={handleAdd}>
                Add to cart
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="reviews-section">
        <h2>Customer Reviews ({reviews.length})</h2>

        {reviewsLoading ? (
          <Loader />
        ) : reviewsError ? (
          <p className="error">{reviewsError}</p>
        ) : reviews.length === 0 ? (
          <p className="muted">No reviews yet. Be the first to review this product!</p>
        ) : (
          <div className="review-list">
            {reviews.map((rev) => (
              <article key={rev._id} className="card review-card">
                <div className="card-body">
                  <div className="row-between">
                    <strong>{rev.user?.name || 'Customer'}</strong>
                    <span className="muted">
                      {new Date(rev.createdAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <div className="row">
                    <span className="stars">
                      {'★'.repeat(rev.rating)}
                      {'☆'.repeat(5 - rev.rating)}
                    </span>
                    <span className="muted" style={{ fontSize: '0.85rem' }}>
                      {rev.rating}/5
                    </span>
                  </div>
                  <p className="review-comment">{rev.comment}</p>
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="card review-form-card">
          <div className="card-body">
            <h3>Write a Review</h3>
            {user ? (
              <form onSubmit={handleSubmitReview} className="form review-form">
                {submitError && <p className="error">{submitError}</p>}
                {submitSuccess && <p className="success">{submitSuccess}</p>}
                <div>
                  <label
                    htmlFor="review-rating"
                    style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}
                  >
                    Rating
                  </label>
                  <select
                    id="review-rating"
                    value={rating}
                    onChange={(e) => setRating(Number(e.target.value))}
                  >
                    <option value={5}>5 ★ - Excellent</option>
                    <option value={4}>4 ★ - Very Good</option>
                    <option value={3}>3 ★ - Good</option>
                    <option value={2}>2 ★ - Fair</option>
                    <option value={1}>1 ★ - Poor</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="review-comment"
                    style={{ display: 'block', marginBottom: '6px', fontWeight: 500 }}
                  >
                    Comment
                  </label>
                  <textarea
                    id="review-comment"
                    placeholder="Share your experience with this product..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    maxLength={1000}
                  />
                </div>
                <button className="btn" type="submit" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            ) : (
              <p className="muted">
                Please <Link to="/login">sign in</Link> to write a review. Only customers
                who purchased and received this product can review it.
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
