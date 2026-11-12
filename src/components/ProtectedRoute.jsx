import { Navigate, useLocation } from 'react-router-dom';
import Spinner from './Spinner.jsx';
import { useAuth } from '../hooks/useAuth.js';

/**
 * Renders its children only for a signed-in user.
 * While Firebase restores the persisted session nothing is decided yet — showing
 * the spinner here is what stops a logged-in user from being bounced to /login
 * on every page reload.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Spinner label="Checking your session…" />;
  }

  if (!isAuthenticated) {
    // `from` lets the login page send the user back where they wanted to go.
    return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  }

  return children;
}
