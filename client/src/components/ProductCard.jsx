import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { formatINR } from '../utils/format.js';
import { useState } from 'react';
import Toast from './Toast.jsx';

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const outOfStock = product.stock === 0;

  const [toast, setToast] = useState('');
  
  const handleAdd = () => {
    addToCart(product);
    setToast(`${product.name} added to cart`);
  };

  return (
    <article className="card product-card">
      <Link to={`/product/${product._id}`}>
        <img src={product.image} alt={product.name} />
      </Link>
      <div className="card-body">
        <span className="tag">{product.category}</span>
        <Link to={`/product/${product._id}`} className="product-name">{product.name}</Link>
        <div className="row-between">
          <strong>{formatINR(product.price)}</strong>
          <span className="muted">★ {product.rating.toFixed(1)}</span>
        </div>
        <button className="btn full" disabled={outOfStock} onClick={handleAdd}>
          {outOfStock ? 'Out of stock' : 'Add to cart'}
        </button>
      </div>
      {toast && <Toast message={toast} onClose={() => setToast('')} />}
    </article>
  );
}
