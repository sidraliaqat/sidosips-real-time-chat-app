import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import ErrorMessage from '../components/ErrorMessage';
import Loader from '../components/Loader';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import { validateEmail } from '../utils/validation';

export default function Login() {
  const { login, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/chat" replace />;
  }

  function validate() {
    const errors = {};
    const emailErr = validateEmail(email);
    if (emailErr) errors.email = emailErr;
    if (!password) errors.password = 'Password is required';
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await login({ email: email.trim().toLowerCase(), password });
      toast.success('Login successful');
      navigate('/chat', { replace: true });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout>
      <div className="auth-card-header">
        <h2>Welcome back</h2>
        <p>Log in to keep the conversation going.</p>
      </div>

      <ErrorMessage message={formError} />

      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            className={`input ${fieldErrors.email ? 'has-error' : ''}`}
            placeholder="yourname@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          {fieldErrors.email && <div className="field-error">{fieldErrors.email}</div>}
        </div>

        <div className="field">
          <label htmlFor="login-password">Password</label>
          <div className="input-wrap">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              className={`input ${fieldErrors.password ? 'has-error' : ''}`}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="input-icon-btn"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? '🙈' : '👁'}
            </button>
          </div>
          {fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? <Loader /> : 'Log In'}
        </button>
      </form>

      <div className="auth-switch">
        Don&apos;t have an account? <Link to="/register">Sign up</Link>
      </div>
    </AuthLayout>
  );
}
