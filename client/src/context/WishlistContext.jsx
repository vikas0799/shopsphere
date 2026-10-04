import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client.js';
import { useAuth } from './AuthContext.jsx';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setWishlist([]);
      return;
    }
    let ignore = false;
    const fetchWishlist = async () => {
      setLoading(true);
      try {
        const { data } = await api.get('/wishlist');
        if (!ignore) setWishlist(data);
      } catch (err) {
        console.error('Failed to load wishlist:', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchWishlist();
    return () => {
      ignore = true;
    };
  }, [user]);

  const isInWishlist = (productId) => {
    return wishlist.some((item) => (item._id || item) === productId);
  };

  const addToWishlist = async (productId) => {
    if (!user) return false;
    try {
      const { data } = await api.post(`/wishlist/${productId}`);
      setWishlist(data);
      return true;
    } catch (err) {
      console.error('Failed to add to wishlist:', err);
      return false;
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!user) return false;
    try {
      const { data } = await api.delete(`/wishlist/${productId}`);
      setWishlist(data);
      return true;
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
      return false;
    }
  };

  const toggleWishlist = async (product) => {
    const id = product._id || product;
    if (isInWishlist(id)) {
      return removeFromWishlist(id);
    } else {
      return addToWishlist(id);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        isInWishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
