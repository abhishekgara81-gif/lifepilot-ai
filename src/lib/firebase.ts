import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const env = import.meta.env;

const rawApiKey = (env.VITE_FIREBASE_API_KEY || '').trim();
const rawProjectId = (env.VITE_FIREBASE_PROJECT_ID || '').trim();

// Check whether real Firebase config keys are present (not empty and not placeholders)
export let isFirebaseConfigured: boolean = Boolean(
  rawApiKey &&
    rawProjectId &&
    !rawApiKey.includes('your_') &&
    !rawProjectId.includes('your_')
);

export let firebaseConfig = {
  apiKey: rawApiKey,
  authDomain: (env.VITE_FIREBASE_AUTH_DOMAIN || '').trim() || `${rawProjectId}.firebaseapp.com`,
  projectId: rawProjectId,
  storageBucket: (env.VITE_FIREBASE_STORAGE_BUCKET || '').trim() || `${rawProjectId}.appspot.com`,
  messagingSenderId: (env.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim(),
  appId: (env.VITE_FIREBASE_APP_ID || '').trim(),
};

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let googleProvider: GoogleAuthProvider | null = null;

function setupFirebase(config: typeof firebaseConfig) {
  try {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(config);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: 'select_account',
    });
    isFirebaseConfigured = true;
    return { app, auth, db, googleProvider };
  } catch (error) {
    console.warn('[LifePilot Firebase] Failed to initialize Firebase:', error);
    return null;
  }
}

if (isFirebaseConfigured) {
  setupFirebase(firebaseConfig);
}

/**
 * Fallback runtime initialization: if build-time VITE_ variables were missing on Render,
 * this fetches /api/firebase-config dynamically from the Express server.
 */
export async function ensureFirebaseInitialized(): Promise<boolean> {
  if (isFirebaseConfigured && auth && db && googleProvider) {
    return true;
  }

  try {
    const res = await fetch('/api/firebase-config');
    if (!res.ok) return false;
    const data = await res.json();
    if (data.isConfigured && data.config) {
      firebaseConfig = {
        apiKey: data.config.apiKey,
        authDomain: data.config.authDomain || `${data.config.projectId}.firebaseapp.com`,
        projectId: data.config.projectId,
        storageBucket: data.config.storageBucket || `${data.config.projectId}.appspot.com`,
        messagingSenderId: data.config.messagingSenderId || '',
        appId: data.config.appId || '',
      };
      const result = setupFirebase(firebaseConfig);
      return Boolean(result);
    }
  } catch (err) {
    console.warn('[LifePilot Firebase] Runtime config fetch error:', err);
  }
  return false;
}

export { app, auth, db, googleProvider };
