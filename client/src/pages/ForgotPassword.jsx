import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMessage(data.message || 'If an account exists, a reset link has been sent.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="card form auth" onSubmit={submit}>
      <h1>Forgot password</h1>
      <p className="muted">Enter your email address and we will send you a password reset link.</p>
      <input
        type="email"
        required
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {error && <p className="error">{error}</p>}
      {message && <p className="success">{message}</p>}
      <button className="btn full" disabled={submitting}>
        {submitting ? 'Sending...' : 'Send reset link'}
      </button>
      <p className="muted">Remembered password? <Link to="/login">Back to login</Link></p>
    </form>
  );
}
