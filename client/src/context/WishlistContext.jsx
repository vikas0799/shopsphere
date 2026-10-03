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

    let isMounted = true;
    setLoading(true);

    api
      .get('/wishlist')
      .then(({ data }) => {
        if (isMounted) setWishlist(data);
      })
      .catch((err) => {
        console.error('Failed to fetch wishlist:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const isInWishlist = (productId) => {
    return wishlist.some((item) => (item._id || item) === productId);
  };

  const addToWishlist = async (product) => {
    if (!user) return;
    const productId = product._id || product;
    // Optimistic addition
    const prevWishlist = wishlist;
    if (!wishlist.some((item) => (item._id || item) === productId)) {
      setWishlist((prev) => [...prev, product]);
    }

    try {
      const { data } = await api.post(`/wishlist/${productId}`);
      setWishlist(data);
    } catch (err) {
      console.error('Failed to add to wishlist:', err);
      setWishlist(prevWishlist);
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!user) return;
    // Optimistic removal
    const prevWishlist = wishlist;
    setWishlist((prev) => prev.filter((item) => (item._id || item) !== productId));

    try {
      const { data } = await api.delete(`/wishlist/${productId}`);
      setWishlist(data);
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
      setWishlist(prevWishlist);
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
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
