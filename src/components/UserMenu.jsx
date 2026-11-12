import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

function initialOf(user) {
  const source = user.displayName || user.email || '?';
  return source.trim().charAt(0).toUpperCase();
}

/** The authentication half of the navbar: Log in / Sign up, or Profile / Log out. */
export default function UserMenu() {
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      navigate('/');
    } finally {
      setSigningOut(false);
    }
  }

  if (isLoading) {
    return <span className="user-menu__pending" aria-live="polite">Checking session…</span>;
  }

  if (!isAuthenticated) {
    return (
      <div className="user-menu">
        <NavLink to="/login" className="app-nav__link">Log in</NavLink>
        <NavLink to="/signup" className="button button--primary button--sm">Sign up</NavLink>
      </div>
    );
  }

  return (
    <div className="user-menu">
      <NavLink to="/profile" className="user-menu__profile" title={user.email ?? 'Profile'}>
        {user.photoURL
          ? <img className="user-menu__avatar" src={user.photoURL} alt="" width="28" height="28" />
          : <span className="user-menu__avatar user-menu__avatar--letter" aria-hidden="true">{initialOf(user)}</span>}
        <span className="user-menu__name">{user.displayName || user.email}</span>
      </NavLink>
      <button
        type="button"
        className="button button--ghost button--sm"
        onClick={handleSignOut}
        disabled={signingOut}
      >
        {signingOut ? 'Logging out…' : 'Log out'}
      </button>
    </div>
  );
}
