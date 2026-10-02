import { useEffect } from 'react';

export default function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  return (
    <div className="toast">
      <span className="toast-icon">✓</span>
      {message}
    </div>
  );
}
