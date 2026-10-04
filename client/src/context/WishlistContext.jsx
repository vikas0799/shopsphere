import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client.js';
import { useAuth } from './AuthContext.jsx';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // load the wishlist when a user logs in, clear it on logout
  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    api
      .get('/wishlist')
      .then(({ data }) => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [user]);

  const isWishlisted = (productId) => items.some((p) => p._id === productId);

  const toggleWishlist = async (product) => {
    const url = `/wishlist/${product._id}`;
    const { data } = isWishlisted(product._id) ? await api.delete(url) : await api.post(url);
    setItems(data);
  };

  return (
    <WishlistContext.Provider value={{ items, loading, isWishlisted, toggleWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
