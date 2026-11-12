import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { formatDateTime } from '../utils/format.js';

const PROVIDER_LABELS = {
  password: 'Email and password',
  'google.com': 'Google',
};

function providerLabel(providerId) {
  return PROVIDER_LABELS[providerId] ?? providerId;
}

/** Protected by <ProtectedRoute>, so `user` is never null here. */
export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState(null);

  async function handleSignOut() {
    setSigningOut(true);
    setError(null);
    try {
      await signOut();
      navigate('/', { replace: true });
    } catch (signOutError) {
      setError(signOutError.message);
      setSigningOut(false);
    }
  }

  return (
    <div className="page page--narrow">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/">
          <span aria-hidden="true">← </span>Fleet overview
        </Link>
      </nav>

      <header className="page-header">
        <div>
          <h1 className="page-header__title">Your profile</h1>
          <p className="page-header__subtitle">
            The account this browser is signed in with. The session is restored automatically after a reload.
          </p>
        </div>
      </header>

      <section className="panel profile" aria-labelledby="account-title">
        <h2 id="account-title" className="panel__title">Account</h2>
        <dl className="spec-list">
          <div>
            <dt>Email</dt>
            <dd>
              {user.email ?? '—'}
              {user.email && (
                <span className="spec-list__sub">
                  {user.emailVerified ? 'verified' : 'not verified'}
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt>User ID (UID)</dt>
            <dd className="mono profile__uid">{user.uid}</dd>
          </div>
          {user.displayName && (
            <div>
              <dt>Name</dt>
              <dd>{user.displayName}</dd>
            </div>
          )}
          <div>
            <dt>Sign-in method</dt>
            <dd>{user.providerIds.map(providerLabel).join(', ') || '—'}</dd>
          </div>
          <div>
            <dt>Account created</dt>
            <dd>{user.createdAt ? formatDateTime(user.createdAt) : '—'}</dd>
          </div>
          <div>
            <dt>Last sign-in</dt>
            <dd>{user.lastSignInAt ? formatDateTime(user.lastSignInAt) : '—'}</dd>
          </div>
        </dl>

        <div aria-live="polite">
          {error && <p className="inline-message inline-message--error">{error}</p>}
        </div>

        <div className="profile__actions">
          <button
            type="button"
            className="button button--secondary"
            onClick={handleSignOut}
            disabled={signingOut}
          >
            {signingOut ? 'Logging out…' : 'Log out'}
          </button>
          <Link className="button button--primary" to="/vehicles/new">Add a vehicle</Link>
        </div>
      </section>
    </div>
  );
}
