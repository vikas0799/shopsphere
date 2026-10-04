import { useEffect } from 'react';

export default function Toast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="toast" role="status">
      {message}
    </div>
  );
}