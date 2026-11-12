import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { auth, isFirebaseConfigured, missingEnvKeys, persistenceReady } from '../firebase.js';

export const NOT_CONFIGURED_MESSAGE = 'Firebase is not configured in this build.';

/** Every failure leaving this service is an AuthError with a message fit for the UI. */
export class AuthError extends Error {
  constructor(message, { code = 'auth/unknown', field = null } = {}) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
    // Which form field to blame, when the error belongs to one.
    this.field = field;
  }
}

// Firebase codes are machine-readable but not user-readable.
const MESSAGES = {
  'auth/invalid-email': 'That email address does not look valid.',
  'auth/missing-password': 'Enter your password.',
  'auth/invalid-credential': 'Wrong email or password.',
  'auth/wrong-password': 'Wrong email or password.',
  'auth/user-not-found': 'Wrong email or password.',
  'auth/user-disabled': 'This account has been disabled.',
  'auth/email-already-in-use': 'This email is already registered. Log in instead.',
  'auth/weak-password': 'The password is too weak — use at least 6 characters.',
  'auth/too-many-requests': 'Too many attempts. Wait a minute and try again.',
  'auth/network-request-failed': 'No connection to Firebase. Check your network and retry.',
  'auth/popup-closed-by-user': 'The Google window was closed before sign-in finished.',
  'auth/cancelled-popup-request': 'The previous Google window is still open.',
  'auth/popup-blocked': 'The browser blocked the Google popup. Allow popups for this site.',
  'auth/account-exists-with-different-credential':
    'This email is already registered with a password. Log in with the password instead.',
  'auth/operation-not-allowed':
    'This sign-in method is disabled in the Firebase console (Authentication → Sign-in method).',
  'auth/unauthorized-domain':
    'This domain is not in the Firebase authorized domains list (Authentication → Settings).',
  'auth/api-key-not-valid': 'The Firebase API key is not valid. Check VITE_FIREBASE_API_KEY.',
};

const FIELD_BY_CODE = {
  'auth/invalid-email': 'email',
  'auth/email-already-in-use': 'email',
  'auth/user-not-found': 'email',
  'auth/weak-password': 'password',
  'auth/missing-password': 'password',
  'auth/wrong-password': 'password',
};

function toAuthError(error) {
  if (error instanceof AuthError) return error;
  // Firebase prefixes its codes, e.g. "auth/invalid-credential (…)".
  const code = String(error?.code ?? 'auth/unknown').split(' ')[0];
  const message = MESSAGES[code] ?? error?.message ?? 'Authentication failed. Try again.';
  return new AuthError(message, { code, field: FIELD_BY_CODE[code] ?? null });
}

function requireAuth() {
  if (!isFirebaseConfigured) {
    throw new AuthError(`${NOT_CONFIGURED_MESSAGE} Missing: ${missingEnvKeys.join(', ')}.`, {
      code: 'app/firebase-not-configured',
    });
  }
  return auth;
}

/** Firebase's User object mapped to a plain object, so SDK types stay out of the UI. */
export function toProfile(user) {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
    emailVerified: user.emailVerified,
    providerIds: user.providerData.map((provider) => provider.providerId),
    createdAt: user.metadata?.creationTime ?? null,
    lastSignInAt: user.metadata?.lastSignInTime ?? null,
  };
}

export async function signUpWithEmail(email, password) {
  const instance = requireAuth();
  try {
    await persistenceReady;
    const credential = await createUserWithEmailAndPassword(instance, email.trim(), password);
    return toProfile(credential.user);
  } catch (error) {
    throw toAuthError(error);
  }
}

export async function signInWithEmail(email, password) {
  const instance = requireAuth();
  try {
    await persistenceReady;
    const credential = await signInWithEmailAndPassword(instance, email.trim(), password);
    return toProfile(credential.user);
  } catch (error) {
    throw toAuthError(error);
  }
}

export async function signInWithGoogle() {
  const instance = requireAuth();
  const provider = new GoogleAuthProvider();
  // Always let the user pick an account instead of silently reusing the last one.
  provider.setCustomParameters({ prompt: 'select_account' });
  try {
    await persistenceReady;
    const credential = await signInWithPopup(instance, provider);
    return toProfile(credential.user);
  } catch (error) {
    throw toAuthError(error);
  }
}

export async function logOut() {
  const instance = requireAuth();
  try {
    await signOut(instance);
  } catch (error) {
    throw toAuthError(error);
  }
}

/**
 * Subscribes to the Firebase session. Fires once right after the SDK has restored
 * the persisted session, and again on every login/logout — in this tab or another one.
 * @returns {() => void} unsubscribe
 */
export function observeAuthState(onUser, onError) {
  if (!isFirebaseConfigured) return () => {};
  return onAuthStateChanged(
    auth,
    (user) => onUser(toProfile(user)),
    (error) => onError?.(toAuthError(error)),
  );
}
