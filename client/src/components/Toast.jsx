export default function Toast({ message }) {
  if (!message) return null;

  return (
    <div className="toast" role="alert" aria-live="polite">
      <span style={{ color: 'var(--success)', fontWeight: 'bold' }}>✓</span>
      <span>{message}</span>
    </div>
  );
}
