import { createContext } from 'react';

/**
 * Shape of the value provided by <AuthProvider>:
 * {
 *   user: { uid, email, displayName, ... } | null,
 *   status: 'loading' | 'ready' | 'unconfigured',
 *   isAuthenticated: boolean,
 *   isConfigured: boolean,
 *   configError: string | null,
 *   signUp, signIn, signInWithGoogle, signOut: (…) => Promise
 * }
 * Read it through the useAuth() hook, never with useContext directly.
 */
export const AuthContext = createContext(null);
