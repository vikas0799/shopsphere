export default function Toast({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="toast" role="status" aria-live="polite" onClick={onClose}>
      <span className="toast-icon">✓</span>
      <span className="toast-message">{message}</span>
    </div>
  );
}
