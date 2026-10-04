export default function Toast({ message }) {
  if (!message) return null;

  return (
    <div className="toast" role="status" aria-live="polite">
      <span>✓</span>
      <span>{message}</span>
    </div>
  );
}
