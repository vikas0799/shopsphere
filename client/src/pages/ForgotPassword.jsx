import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setSuccess(data.message);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card form auth" onSubmit={submit}>
      <h1>Forgot Password</h1>
      <p className="muted">Enter your email and we'll send you a reset link.</p>
      <input
        type="email"
        required
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <button className="btn full" disabled={loading}>
        {loading ? 'Sending…' : 'Send reset link'}
      </button>
      <p className="muted">
        Remember your password? <Link to="/login">Login</Link>
      </p>
    </form>
  );
}
