import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import Loader from '../components/Loader.jsx';
import { formatINR } from '../utils/format.js';

export default function Wishlist() {
  const { items, loading, toggleWishlist } = useWishlist();
  const { addToCart } = useCart();

  const moveToCart = async (product) => {
    addToCart(product);
    await toggleWishlist(product);
  };

  if (loading) return <Loader />;

  if (items.length === 0) {
    return (
      <section className="empty">
        <h2>Your wishlist is empty</h2>
        <Link to="/" className="btn">Continue shopping</Link>
      </section>
    );
  }

  return (
    <section>
      <h1>Your Wishlist</h1>
      <div className="cart-list">
        {items.map((product) => (
          <div key={product._id} className="cart-item card">
            <img src={product.image} alt={product.name} />
            <div className="grow">
              <Link to={`/product/${product._id}`}><strong>{product.name}</strong></Link>
              <p className="muted">{formatINR(product.price)}</p>
            </div>
            <button className="btn" disabled={product.stock === 0} onClick={() => moveToCart(product)}>
              {product.stock === 0 ? 'Out of stock' : 'Move to cart'}
            </button>
            <button className="btn btn-danger" onClick={() => toggleWishlist(product)}>Remove</button>
          </div>
        ))}
      </div>
    </section>
  );
}
