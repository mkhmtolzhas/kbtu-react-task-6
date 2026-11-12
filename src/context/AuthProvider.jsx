import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './AuthContext.js';
import { isFirebaseConfigured, missingEnvKeys } from '../firebase.js';
import {
  logOut,
  observeAuthState,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from '../services/authService.js';

const CONFIG_ERROR = isFirebaseConfigured
  ? null
  : `Firebase is not configured: ${missingEnvKeys.join(', ')} ${
    missingEnvKeys.length === 1 ? 'is' : 'are'
  } missing from .env.local. Copy .env.example, fill in the values from the Firebase console and restart the dev server.`;

/**
 * Owns the one piece of global state in the app: who is signed in.
 * No component talks to firebase/auth directly — they all go through useAuth().
 */
export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState(isFirebaseConfigured ? 'loading' : 'unconfigured');

  useEffect(() => {
    if (!isFirebaseConfigured) return undefined;

    // onAuthStateChanged fires once the SDK has restored the persisted session
    // (that first call is what ends the loading state), then on every change.
    const unsubscribe = observeAuthState(
      (nextUser) => {
        setUser(nextUser);
        setStatus('ready');
      },
      () => {
        setUser(null);
        setStatus('ready');
      },
    );

    return unsubscribe;
  }, []);

  // The user state is not set here: onAuthStateChanged is the single source of
  // truth, so a session restored in another tab reaches this tab the same way.
  const signUp = useCallback((email, password) => signUpWithEmail(email, password), []);
  const signIn = useCallback((email, password) => signInWithEmail(email, password), []);
  const signInGoogle = useCallback(() => signInWithGoogle(), []);
  const signOut = useCallback(() => logOut(), []);

  const value = useMemo(
    () => ({
      user,
      status,
      isAuthenticated: user !== null,
      isLoading: status === 'loading',
      isConfigured: isFirebaseConfigured,
      configError: CONFIG_ERROR,
      signUp,
      signIn,
      signInWithGoogle: signInGoogle,
      signOut,
    }),
    [user, status, signUp, signIn, signInGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
