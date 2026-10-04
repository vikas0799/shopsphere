import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { useAuth } from './AuthContext.jsx';
import { useCart } from './CartContext.jsx';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
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
    return wishlist.some((item) => item._id === productId);
  };

  const addToWishlist = async (productId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const { data } = await api.post(`/wishlist/${productId}`);
      setWishlist(data);
    } catch (err) {
      console.error('Failed to add to wishlist:', err);
    }
  };

  const removeFromWishlist = async (productId) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const { data } = await api.delete(`/wishlist/${productId}`);
      setWishlist(data);
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
    }
  };

  const toggleWishlist = async (product) => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (isInWishlist(product._id)) {
      await removeFromWishlist(product._id);
    } else {
      await addToWishlist(product._id);
    }
  };

  const moveToCart = async (product) => {
    if (!product || product.stock === 0) return;
    addToCart(product, 1);
    await removeFromWishlist(product._id);
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
        moveToCart,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => useContext(WishlistContext);
