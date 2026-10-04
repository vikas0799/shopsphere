import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, { password });
      setMessage(data.message || 'Password reset successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="card form auth" onSubmit={submit}>
      <h1>Reset password</h1>
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
      {message && <p className="success">{message}</p>}
      <button className="btn full" disabled={submitting}>
        {submitting ? 'Resetting...' : 'Reset password'}
      </button>
      <p className="muted"><Link to="/login">Back to login</Link></p>
    </form>
  );
}
