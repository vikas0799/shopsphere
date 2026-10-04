import { createContext, useContext, useEffect, useRef, useState } from 'react';
import api from '../api/client.js';
import { useAuth } from './AuthContext.jsx';

const CartContext = createContext(null);
const STORAGE_KEY = 'shopsphere_cart';

// Merge the guest cart with the server cart.
// If a product is in both, keep the higher quantity.
const mergeCarts = (local, server) => {
  const merged = new Map(local.map((i) => [i.product, i]));
  server.forEach((s) => {
    const mine = merged.get(s.product);
    if (!mine) merged.set(s.product, s);
    else if (s.quantity > mine.quantity) merged.set(s.product, { ...mine, quantity: s.quantity });
  });
  return [...merged.values()];
};

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  });
  const [synced, setSynced] = useState(false);
  const wasLoggedIn = useRef(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // On login: load the server cart and merge it in. On logout: clear the cart.
  useEffect(() => {
    if (!user) {
      if (wasLoggedIn.current) setItems([]);
      wasLoggedIn.current = false;
      setSynced(false);
      return undefined;
    }
    wasLoggedIn.current = true;

    let cancelled = false;
    api
      .get('/cart')
      .then(({ data }) => {
        if (!cancelled) setItems((prev) => mergeCarts(prev, data.items));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSynced(true);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.token]);

  // After the first merge, save every cart change to the server (debounced).
  useEffect(() => {
    if (!user || !synced) return undefined;
    const timer = setTimeout(() => {
      api
        .put('/cart', { items: items.map(({ product, quantity }) => ({ product, quantity })) })
        .catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [items, synced]);

  const addToCart = (product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product === product._id);
      if (existing) {
        return prev.map((i) =>
          i.product === product._id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [
        ...prev,
        { product: product._id, name: product.name, price: product.price, image: product.image, quantity },
      ];
    });
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) return removeFromCart(productId);
    setItems((prev) => prev.map((i) => (i.product === productId ? { ...i, quantity } : i)));
  };

  const removeFromCart = (productId) =>
    setItems((prev) => prev.filter((i) => i.product !== productId));

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, updateQuantity, removeFromCart, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
