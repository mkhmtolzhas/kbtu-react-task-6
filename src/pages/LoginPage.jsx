import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import FormField from '../components/FormField.jsx';
import GoogleButton from '../components/GoogleButton.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { describedBy } from '../utils/a11y.js';
import { validateLoginForm } from '../utils/authValidation.js';

export default function LoginPage() {
  const { isAuthenticated, isConfigured, signIn, signInWithGoogle } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [values, setValues] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [pending, setPending] = useState(null);

  // Where ProtectedRoute wanted to send the user before it bounced them here.
  const from = location.state?.from ?? '/profile';
  const clientErrors = validateLoginForm(values);

  if (isAuthenticated) return <Navigate to={from} replace />;

  function errorFor(name) {
    if (serverError?.field === name) return serverError.message;
    return touched[name] || submitAttempted ? clientErrors[name] : undefined;
  }

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setServerError(null);
  }

  function handleBlur(event) {
    const { name } = event.target;
    setTouched((prev) => (prev[name] ? prev : { ...prev, [name]: true }));
  }

  async function runSignIn(kind, action) {
    setServerError(null);
    setPending(kind);
    try {
      await action();
      navigate(from, { replace: true });
    } catch (error) {
      setServerError({ message: error.message, field: error.field });
    } finally {
      setPending(null);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    setSubmitAttempted(true);
    if (Object.keys(clientErrors).length > 0) return;
    runSignIn('email', () => signIn(values.email, values.password));
  }

  const busy = pending !== null;
  const formError = serverError && !serverError.field ? serverError.message : null;

  return (
    <div className="page page--auth">
      <section className="auth-card" aria-labelledby="login-title">
        <header className="auth-card__header">
          <h1 id="login-title" className="auth-card__title">Log in</h1>
          <p className="auth-card__subtitle">
            Dispatchers sign in to add vehicles and change their status.
          </p>
        </header>

        {!isConfigured && (
          <p className="inline-message inline-message--warning" role="status">
            Sign-in is disabled: this build has no Firebase keys. See the banner above and .env.example.
          </p>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <FormField id="login-email" label="Email" error={errorFor('email')}>
            <input
              id="login-email"
              className="input"
              name="email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={busy}
              aria-invalid={errorFor('email') ? 'true' : undefined}
              aria-describedby={describedBy('login-email', { error: errorFor('email') })}
            />
          </FormField>

          <FormField id="login-password" label="Password" error={errorFor('password')}>
            <input
              id="login-password"
              className="input"
              name="password"
              type="password"
              autoComplete="current-password"
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={busy}
              aria-invalid={errorFor('password') ? 'true' : undefined}
              aria-describedby={describedBy('login-password', { error: errorFor('password') })}
            />
          </FormField>

          <div aria-live="polite">
            {formError && <p className="inline-message inline-message--error">{formError}</p>}
          </div>

          <button type="submit" className="button button--primary auth-form__submit" disabled={busy}>
            {pending === 'email' ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <div className="auth-card__divider"><span>or</span></div>

        <GoogleButton
          onClick={() => runSignIn('google', signInWithGoogle)}
          disabled={busy}
          pending={pending === 'google'}
          label="Log in with Google"
        />

        <p className="auth-card__footer">
          No account yet? <Link to="/signup" state={location.state}>Create one</Link>
        </p>
      </section>
    </div>
  );
}
