import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client.js';
import { useAuth } from './AuthContext.jsx';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    if (user) {
      api
        .get('/wishlist')
        .then(({ data }) => setWishlist(data))
        .catch(() => setWishlist([]));
    } else {
      setWishlist([]);
    }
  }, [user]);

  const isInWishlist = (productId) =>
    wishlist.some((item) => (typeof item === 'string' ? item : item._id) === productId);

  const toggleWishlist = async (product) => {
    if (!user) return false;
    const inList = isInWishlist(product._id);
    try {
      if (inList) {
        const { data } = await api.delete(`/wishlist/${product._id}`);
        setWishlist(data);
      } else {
        const { data } = await api.post(`/wishlist/${product._id}`);
        setWishlist(data);
      }
      return true;
    } catch {
      return false;
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      const { data } = await api.delete(`/wishlist/${productId}`);
      setWishlist(data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        totalWishlist: wishlist.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
