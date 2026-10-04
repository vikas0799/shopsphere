import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setMessage(data.message || 'Reset link sent to your email');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card form auth" onSubmit={submit}>
      <h1>Forgot Password</h1>
      <input 
        type="email" 
        required 
        placeholder="Enter your email" 
        value={email}
        onChange={(e) => setEmail(e.target.value)} 
      />
      {error && <p className="error">{error}</p>}
      {message && <p className="success" style={{ color: 'green', margin: '0.5rem 0' }}>{message}</p>}
      <button className="btn full" disabled={loading}>
        {loading ? 'Sending...' : 'Send Reset Link'}
      </button>
      <p className="muted">
        Remember your password? <Link to="/login">Login</Link>
      </p>
    </form>
  );
}
