import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client.js';
import { useAuth } from './AuthContext.jsx';
import { useCart } from './CartContext.jsx';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setLoading(true);
      api
        .get('/wishlist')
        .then(({ data }) => setWishlist(data || []))
        .catch(() => setWishlist([]))
        .finally(() => setLoading(false));
    } else {
      setWishlist([]);
    }
  }, [user]);

  const isInWishlist = (productId) =>
    wishlist.some((item) => (item?._id || item) === productId);

  const toggleWishlist = async (product) => {
    if (!user) {
      alert('Please log in to manage your wishlist.');
      return;
    }
    const productId = product._id || product;
    const isPresent = isInWishlist(productId);
    try {
      if (isPresent) {
        const { data } = await api.delete(`/wishlist/${productId}`);
        setWishlist(data);
      } else {
        const { data } = await api.post(`/wishlist/${productId}`);
        setWishlist(data);
      }
    } catch (err) {
      console.error('Error updating wishlist', err);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      const { data } = await api.delete(`/wishlist/${productId}`);
      setWishlist(data);
    } catch (err) {
      console.error('Error removing from wishlist', err);
    }
  };

  const moveToCart = async (product) => {
    addToCart(product);
    await removeFromWishlist(product._id);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        moveToCart,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
