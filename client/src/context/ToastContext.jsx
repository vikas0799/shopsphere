import { createContext, useContext, useState, useRef, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((message) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setToast(message);
    timerRef.current = setTimeout(() => {
      setToast(null);
      timerRef.current = null;
    }, 2000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <aside className="toast-container" role="status" aria-live="polite">
          <div className="toast">{toast}</div>
        </aside>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
