import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext.js';

/** The only way components read authentication state. */
export function useAuth() {
  const value = useContext(AuthContext);
  if (value === null) {
    throw new Error('useAuth() must be used inside <AuthProvider>.');
  }
  return value;
}
