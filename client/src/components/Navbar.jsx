import { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('shopsphere_theme');
      if (saved === 'light' || saved === 'dark') return saved;
    } catch { /* Use the system preference when storage is unavailable. */ }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-color-scheme: dark)');
    const followSystem = (event) => {
      try {
        if (localStorage.getItem('shopsphere_theme')) return;
      } catch { /* Continue following the system. */ }
      setTheme(event.matches ? 'dark' : 'light');
    };
    preference.addEventListener('change', followSystem);
    return () => preference.removeEventListener('change', followSystem);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('shopsphere_theme', next); } catch { /* Keep the current session usable. */ }
    setTheme(next);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="navbar">
      <Link to="/" className="brand">
        Shop<span>Sphere</span>
      </Link>
      <nav className="nav-links">
        <button className="btn btn-ghost" onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} aria-pressed={theme === 'dark'}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <NavLink to="/">Shop</NavLink>
        <NavLink to="/cart">Cart ({totalItems})</NavLink>
        {user && <NavLink to="/orders">My Orders</NavLink>}
        {isAdmin && <NavLink to="/admin/products">Admin</NavLink>}
        {user ? (
          <>
            <span className="muted">Hi, {user.name.split(' ')[0]}</span>
            <button className="btn btn-ghost" onClick={handleLogout}>Logout</button>
          </>
        ) : (
          <NavLink to="/login" className="btn">Login</NavLink>
        )}
      </nav>
    </header>
  );
}
