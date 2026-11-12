import { Link, useLocation } from 'react-router-dom';

/** Shown in place of a dispatcher action when nobody is signed in. */
export default function SignInHint({ action }) {
  const location = useLocation();
  const from = location.pathname + location.search;

  return (
    <p className="inline-message inline-message--info">
      <Link to="/login" state={{ from }}>Log in</Link> to {action}.
    </p>
  );
}
