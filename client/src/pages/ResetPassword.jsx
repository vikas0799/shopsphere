import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    setLoading(true);
    setMessage('');
    setError('');
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setMessage('Password reset successfully. Redirecting to login...');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="card form auth" onSubmit={submit}>
      <h1>Reset Password</h1>
      <input 
        type="password" 
        required 
        placeholder="New Password" 
        value={password}
        onChange={(e) => setPassword(e.target.value)} 
      />
      <input 
        type="password" 
        required 
        placeholder="Confirm New Password" 
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)} 
      />
      {error && <p className="error">{error}</p>}
      {message && <p className="success" style={{ color: 'green', margin: '0.5rem 0' }}>{message}</p>}
      <button className="btn full" disabled={loading}>
        {loading ? 'Resetting...' : 'Reset Password'}
      </button>
    </form>
  );
}
