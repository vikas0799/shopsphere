import { useEffect } from 'react';
import { useCart } from '../context/CartContext.jsx';

export default function Toast() {
  const { toast, clearToast } = useCart();

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(clearToast, 2000);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) return null;

  return (
    <div className="toast" role="status">
      {toast.message}
    </div>
  );
}
