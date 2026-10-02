import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { getErrorMessage } from '../api/client.js';

export default function ResetPassword() {
  const { token } = useParams();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.password !== form.confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      const { data } = await api.post(`/auth/reset-password/${token}`, {
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      setSuccess(data.message);
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
        minLength={6}
        placeholder="New password (min 6 chars)"
        value={form.password}
        onChange={set('password')}
      />
      <input
        type="password"
        required
        minLength={6}
        placeholder="Confirm new password"
        value={form.confirmPassword}
        onChange={set('confirmPassword')}
      />
      {error && <p className="error">{error}</p>}
      {success && (
        <>
          <p className="success">{success}</p>
          <Link to="/login" className="btn full" style={{ textAlign: 'center' }}>
            Go to Login
          </Link>
        </>
      )}
      {!success && (
        <button className="btn full" disabled={loading}>
          {loading ? 'Resetting…' : 'Reset password'}
        </button>
      )}
    </form>
  );
}
