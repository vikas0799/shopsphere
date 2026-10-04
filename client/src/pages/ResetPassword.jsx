import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password });
      setMessage(data.message || 'Password reset successful. You can now login with your new password.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card form auth" onSubmit={submit}>
      <h1>Reset Password</h1>
      {message ? (
        <div>
          <p className="success">{message}</p>
          <Link to="/login" className="btn full" style={{ marginTop: '16px', textAlign: 'center' }}>
            Go to Login
          </Link>
        </div>
      ) : (
        <>
          <p className="muted">Enter your new password below.</p>
          <input
            type="password"
            required
            minLength={6}
            placeholder="New password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <input
            type="password"
            required
            minLength={6}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          {error && <p className="error">{error}</p>}
          <button className="btn full" disabled={loading}>
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
          <p className="muted">Back to <Link to="/login">Login</Link></p>
        </>
      )}
    </form>
  );
}
