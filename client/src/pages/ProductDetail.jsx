import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';
import { useCart } from '../context/CartContext.jsx';
import Loader from '../components/Loader.jsx';
import { formatINR } from '../utils/format.js';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [qtyError, setQtyError] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get(`/products/${id}`)
      .then(({ data }) => setProduct(data))
      .catch((err) => setError(getErrorMessage(err)));
  }, [id]);

  if (error) return <p className="error">{error}</p>;
  if (!product) return <Loader />;

  const handleAdd = () => {
    if (qtyError || qty < 1 || qty > product.stock) return;
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
        {product.stock > 0 && (
          <div>
            <div className="row">
              <input
                type="number"
                min="1"
                max={product.stock}
                value={qty}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setQty(val);
                  if (val < 1) {
                    setQtyError('Quantity must be at least 1');
                  } else if (val > product.stock) {
                    setQtyError(`Only ${product.stock} available`);
                  } else {
                    setQtyError('');
                  }
                }}
                className="qty"
              />
              <button
                className="btn"
                disabled={!!qtyError || qty < 1 || qty > product.stock}
                onClick={handleAdd}
              >
                Add to cart
              </button>
            </div>
            {qtyError && <p className="error" style={{ marginTop: '6px' }}>{qtyError}</p>}
          </div>
        )}
        {/* TODO: reviews section - see "Product reviews" issue */}
      </div>
    </section>
  );
}
