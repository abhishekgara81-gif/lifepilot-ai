import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

const env = import.meta.env;

const rawApiKey = (env.VITE_FIREBASE_API_KEY || '').trim();
const rawProjectId = (env.VITE_FIREBASE_PROJECT_ID || '').trim();

// Check whether real Firebase config keys are present (not empty and not placeholders)
export const isFirebaseConfigured: boolean = Boolean(
  rawApiKey &&
    rawProjectId &&
    !rawApiKey.includes('your_') &&
    !rawProjectId.includes('your_')
);

export const firebaseConfig = {
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

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: 'select_account',
    });
  } catch (error) {
    console.warn('[LifePilot Firebase] Failed to initialize Firebase:', error);
    app = null;
    auth = null;
    db = null;
    googleProvider = null;
  }
}

export { app, auth, db, googleProvider };

