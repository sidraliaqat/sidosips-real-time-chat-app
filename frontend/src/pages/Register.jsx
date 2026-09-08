import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import ErrorMessage from '../components/ErrorMessage';
import Loader from '../components/Loader';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import {
  validateName,
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  passwordStrength,
} from '../utils/validation';

const STRENGTH_LABELS = ['Too weak', 'Weak', 'Fair', 'Good', 'Strong'];

export default function Register() {
  const { register, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) {
    return <Navigate to="/chat" replace />;
  }

  function validate() {
    const errors = {};
    const nameErr = validateName(name);
    if (nameErr) errors.name = nameErr;
    const emailErr = validateEmail(email);
    if (emailErr) errors.email = emailErr;
    const passErr = validatePassword(password);
    if (passErr) errors.password = passErr;
    const confirmErr = validateConfirmPassword(password, confirmPassword);
    if (confirmErr) errors.confirmPassword = confirmErr;
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setFormError(null);
    if (!validate()) return;

    setSubmitting(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        confirmPassword,
      });
      toast.success('Account created successfully. Please log in.');
      navigate('/login', { replace: true });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const strength = passwordStrength(password);

  return (
    <AuthLayout>
      <div className="auth-card-header">
        <h2>Create your account</h2>
        <p>Join sidosips and start chatting in seconds. You can add a profile photo after logging in.</p>
      </div>

      <ErrorMessage message={formError} />

      <form onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="reg-name">Full name</label>
          <input
            id="reg-name"
            className={`input ${fieldErrors.name ? 'has-error' : ''}`}
            placeholder="e.g. Sidra Khan"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
          {fieldErrors.name && <div className="field-error">{fieldErrors.name}</div>}
        </div>

        <div className="field">
          <label htmlFor="reg-email">Email</label>
          <input
            id="reg-email"
            type="email"
            className={`input ${fieldErrors.email ? 'has-error' : ''}`}
            placeholder="yourname@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
          {fieldErrors.email ? (
            <div className="field-error">{fieldErrors.email}</div>
          ) : (
            <div className="field-hint">Only @gmail.com addresses are supported</div>
          )}
        </div>

        <div className="field">
          <label htmlFor="reg-password">Password</label>
          <div className="input-wrap">
            <input
              id="reg-password"
              type={showPassword ? 'text' : 'password'}
              className={`input ${fieldErrors.password ? 'has-error' : ''}`}
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
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
          {password && (
            <>
              <div className="password-strength" aria-hidden="true">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`password-strength-bar ${
                      i < strength ? (strength <= 1 ? 'filled-weak' : strength <= 2 ? 'filled-ok' : 'filled-strong') : ''
                    }`}
                  />
                ))}
              </div>
              <div className="field-hint">{STRENGTH_LABELS[strength]}</div>
            </>
          )}
          {fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}
        </div>

        <div className="field">
          <label htmlFor="reg-confirm">Confirm password</label>
          <input
            id="reg-confirm"
            type={showPassword ? 'text' : 'password'}
            className={`input ${fieldErrors.confirmPassword ? 'has-error' : ''}`}
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
          />
          {fieldErrors.confirmPassword && <div className="field-error">{fieldErrors.confirmPassword}</div>}
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? <Loader /> : 'Create Account'}
        </button>
      </form>

      <div className="auth-switch">
        Already have an account? <Link to="/login">Login</Link>
      </div>
    </AuthLayout>
  );
}
