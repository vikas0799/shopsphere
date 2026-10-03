import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../../api/client.js';
import { CATEGORIES, formatINR } from '../../utils/format.js';

function DeleteConfirmation({ product, onClose, onConfirm }) {
  const dialog = useRef(null);
  useEffect(() => {
    dialog.current.showModal();
  }, []);

  return (
    <dialog ref={dialog} className="card form" aria-labelledby="delete-title" onCancel={onClose}>
      <h2 id="delete-title">Delete product?</h2>
      <p>Delete "{product.name}"? This cannot be undone.</p>
      <div className="row">
        <button autoFocus className="btn btn-ghost" onClick={() => { dialog.current.close(); onClose(); }}>Cancel</button>
        <button className="btn btn-danger" onClick={() => { dialog.current.close(); onConfirm(product); }}>Delete product</button>
      </div>
    </dialog>
  );
}

const empty = { name: '', description: '', price: '', category: 'electronics', brand: '', image: '', stock: '' };

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [deletingProduct, setDeletingProduct] = useState(null);

  const load = () => api.get('/products').then(({ data }) => setProducts(data));
  useEffect(() => {
    load();
  }, []);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    const { name, description, category, brand, image } = form;
    const payload = { name, description, category, brand, image, price: Number(form.price), stock: Number(form.stock) };
    if (!payload.image) delete payload.image;
    try {
      if (editingId) await api.put(`/products/${editingId}`, payload);
      else await api.post('/products', payload);
      setForm(empty);
      setEditingId(null);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const edit = (p) => {
    setEditingId(p._id);
    setForm({ ...empty, ...p, price: String(p.price), stock: String(p.stock) });
  };

  const remove = async (product) => {
    setDeletingProduct(null);
    setError('');
    try {
      await api.delete(`/products/${product._id}`);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <section>
      <div className="row-between">
        <h1>Admin · Products</h1>
        <Link to="/admin/orders" className="btn btn-ghost">View orders →</Link>
      </div>

      <form className="card form admin-form" onSubmit={submit}>
        <h3>{editingId ? 'Edit product' : 'Add product'}</h3>
        <input required placeholder="Name" value={form.name} onChange={set('name')} />
        <textarea required placeholder="Description" value={form.description} onChange={set('description')} />
        <div className="row">
          <input required type="number" min="0" placeholder="Price (₹)" value={form.price} onChange={set('price')} />
          <input required type="number" min="0" placeholder="Stock" value={form.stock} onChange={set('stock')} />
        </div>
        <div className="row">
          <select value={form.category} onChange={set('category')}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input placeholder="Brand" value={form.brand} onChange={set('brand')} />
        </div>
        <input placeholder="Image URL (optional)" value={form.image} onChange={set('image')} />
        {error && <p className="error">{error}</p>}
        <div className="row">
          <button className="btn">{editingId ? 'Save changes' : 'Add product'}</button>
          {editingId && (
            <button type="button" className="btn btn-ghost" onClick={() => { setEditingId(null); setForm(empty); }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {deletingProduct && (
        <DeleteConfirmation product={deletingProduct} onClose={() => setDeletingProduct(null)} onConfirm={remove} />
      )}

      <table className="table">
        <thead>
          <tr><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th /></tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p._id}>
              <td>{p.name}</td>
              <td>{p.category}</td>
              <td>{formatINR(p.price)}</td>
              <td>{p.stock}</td>
              <td className="row">
                <button className="btn btn-ghost" onClick={() => edit(p)}>Edit</button>
                <button className="btn btn-danger" onClick={() => setDeletingProduct(p)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
