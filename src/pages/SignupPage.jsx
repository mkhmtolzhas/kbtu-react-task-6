import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import FormField from '../components/FormField.jsx';
import GoogleButton from '../components/GoogleButton.jsx';
import { useAuth } from '../hooks/useAuth.js';
import { describedBy } from '../utils/a11y.js';
import { PASSWORD_MIN_LENGTH, validateSignupForm } from '../utils/authValidation.js';

const PASSWORD_HINT = `At least ${PASSWORD_MIN_LENGTH} characters, letters and digits.`;

export default function SignupPage() {
  const { isAuthenticated, isConfigured, signUp, signInWithGoogle } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [values, setValues] = useState({ email: '', password: '', confirmPassword: '' });
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [pending, setPending] = useState(null);

  const from = location.state?.from ?? '/profile';
  // Derived on every render from the current values — never stored in state.
  const clientErrors = validateSignupForm(values);

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

  async function runSignUp(kind, action) {
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
    runSignUp('email', () => signUp(values.email, values.password));
  }

  const busy = pending !== null;
  const formError = serverError && !serverError.field ? serverError.message : null;

  return (
    <div className="page page--auth">
      <section className="auth-card" aria-labelledby="signup-title">
        <header className="auth-card__header">
          <h1 id="signup-title" className="auth-card__title">Create an account</h1>
          <p className="auth-card__subtitle">
            An account is needed to add vehicles and change fleet status.
          </p>
        </header>

        {!isConfigured && (
          <p className="inline-message inline-message--warning" role="status">
            Sign-in is disabled: this build has no Firebase keys. See the banner above and .env.example.
          </p>
        )}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <FormField id="signup-email" label="Email" error={errorFor('email')}>
            <input
              id="signup-email"
              className="input"
              name="email"
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={busy}
              aria-invalid={errorFor('email') ? 'true' : undefined}
              aria-describedby={describedBy('signup-email', { error: errorFor('email') })}
            />
          </FormField>

          <FormField
            id="signup-password"
            label="Password"
            hint={PASSWORD_HINT}
            error={errorFor('password')}
          >
            <input
              id="signup-password"
              className="input"
              name="password"
              type="password"
              autoComplete="new-password"
              value={values.password}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={busy}
              aria-invalid={errorFor('password') ? 'true' : undefined}
              aria-describedby={describedBy('signup-password', {
                hint: PASSWORD_HINT,
                error: errorFor('password'),
              })}
            />
          </FormField>

          <FormField id="signup-confirm" label="Confirm password" error={errorFor('confirmPassword')}>
            <input
              id="signup-confirm"
              className="input"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={handleChange}
              onBlur={handleBlur}
              disabled={busy}
              aria-invalid={errorFor('confirmPassword') ? 'true' : undefined}
              aria-describedby={describedBy('signup-confirm', { error: errorFor('confirmPassword') })}
            />
          </FormField>

          <div aria-live="polite">
            {formError && <p className="inline-message inline-message--error">{formError}</p>}
          </div>

          <button type="submit" className="button button--primary auth-form__submit" disabled={busy}>
            {pending === 'email' ? 'Creating account…' : 'Sign up'}
          </button>
        </form>

        <div className="auth-card__divider"><span>or</span></div>

        <GoogleButton
          onClick={() => runSignUp('google', signInWithGoogle)}
          disabled={busy}
          pending={pending === 'google'}
          label="Sign up with Google"
        />

        <p className="auth-card__footer">
          Already registered? <Link to="/login" state={location.state}>Log in</Link>
        </p>
      </section>
    </div>
  );
}
