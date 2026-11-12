import { initializeApp } from 'firebase/app';
import { browserLocalPersistence, getAuth, setPersistence } from 'firebase/auth';

// Vite only exposes variables prefixed with VITE_ to the browser bundle.
// This module is the single place in the app that reads `import.meta.env`.
const REQUIRED_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
];

const env = import.meta.env;

// A value counts as "not configured" when it is missing, empty, or still the
// placeholder shipped in .env.example.
function isPlaceholder(value) {
  const text = String(value ?? '').trim();
  return text === '' || text.toLowerCase().startsWith('your-');
}

export const missingEnvKeys = REQUIRED_KEYS.filter((key) => isPlaceholder(env[key]));
export const isFirebaseConfigured = missingEnvKeys.length === 0;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

// With placeholder keys the SDK is never initialized: the fleet part of the app
// keeps working and the auth screens explain exactly which variables are missing.
export const firebaseApp = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const auth = firebaseApp ? getAuth(firebaseApp) : null;

// Persistent sessions: the user stays signed in across reloads and browser
// restarts until they log out. Awaited by the auth service before every sign-in.
export const persistenceReady = auth
  ? setPersistence(auth, browserLocalPersistence)
  : Promise.resolve();
