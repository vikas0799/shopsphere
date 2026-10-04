import { useEffect, useState } from 'react';
import api, { getErrorMessage } from '../api/client.js';
import ProductCard from '../components/ProductCard.jsx';
import Loader from '../components/Loader.jsx';
import { CATEGORIES } from '../utils/format.js';

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '', category: '', sort: 'newest' });

  useEffect(() => {
    // NOTE: this fires a request on every keystroke - see "Debounce search" issue.
    setLoading(true);
    api
      .get('/products', { params: filters })
      .then(({ data }) => setProducts(data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [filters]);

  const update = (key) => (e) => setFilters((f) => ({ ...f, [key]: e.target.value }));

  return (
    <section>
      <div className="hero">
        <h1>Everything you need, in one sphere.</h1>
        <p className="muted">Electronics, fashion, books and more — delivered across India.</p>
      </div>

      <div className="filters">
        <input placeholder="Search products..." value={filters.search} onChange={update('search')} />
        <select value={filters.category} onChange={update('category')}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={filters.sort} onChange={update('sort')}>
          <option value="newest">Newest</option>
          <option value="price_asc">Price: low to high</option>
          <option value="price_desc">Price: high to low</option>
          <option value="rating">Top rated</option>
        </select>
      </div>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <Loader />
      ) : products.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🔍</span>
          <h2>No products found</h2>
          <p className="muted">Try a different search term or category.</p>
          <button
            className="btn"
            onClick={() => setFilters({ search: '', category: '', sort: 'newest' })}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
