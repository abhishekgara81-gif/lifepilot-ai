import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  type User,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  auth,
  googleProvider,
  isFirebaseConfigured,
  ensureFirebaseInitialized,
} from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isConfigured: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearAuthError: () => void;
}

export function formatAuthError(error: any): string {
  if (!error) return 'Authentication failed. Please try again.';
  const code = error.code || '';
  const domain = typeof window !== 'undefined' ? window.location.hostname : 'your domain';

  switch (code) {
    case 'auth/unauthorized-domain':
      return `Domain not authorized in Firebase (${domain}). Add "${domain}" to Firebase Console -> Authentication -> Settings -> Authorized domains.`;
    case 'auth/operation-not-allowed':
      return 'Google Sign-In is disabled in your Firebase project. Please enable Google in Firebase Console -> Authentication -> Sign-in method.';
    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Attempting redirect sign-in...';
    case 'auth/popup-closed-by-user':
      return '';
    case 'auth/cancelled-popup-request':
      return '';
    case 'auth/network-request-failed':
      return 'Network connection failed. Please check your internet connection.';
    case 'auth/invalid-api-key':
      return 'Invalid Firebase API Key. Please verify your Firebase configuration in .env.';
    default:
      return error.message || 'Google Sign-In failed. Please try again.';
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    let isMounted = true;

    async function initializeAuth() {
      let configured = isFirebaseConfigured;
      if (!configured || !auth) {
        configured = await ensureFirebaseInitialized();
      }

      if (!isMounted) return;

      if (!configured || !auth) {
        setLoading(false);
        return;
      }

      // Check if user is returning from a signInWithRedirect flow (e.g. on mobile Chrome / Safari)
      try {
        const redirectResult = await getRedirectResult(auth);
        if (redirectResult?.user && isMounted) {
          setUser(redirectResult.user);
        }
      } catch (redirectError: any) {
        console.warn('[LifePilot Auth] Redirect result error:', redirectError);
        const msg = formatAuthError(redirectError);
        if (msg && isMounted) {
          setAuthError(msg);
        }
      }

      // Listen for persistent auth state changes
      unsubscribe = onAuthStateChanged(
        auth,
        (firebaseUser) => {
          if (isMounted) {
            setUser(firebaseUser);
            setLoading(false);
          }
        },
        (error) => {
          console.error('[LifePilot Auth] State change error:', error);
          if (isMounted) {
            setAuthError(formatAuthError(error));
            setLoading(false);
          }
        }
      );
    }

    initializeAuth();

    return () => {
      isMounted = false;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);

    let configured = isFirebaseConfigured;
    if (!configured || !auth || !googleProvider) {
      configured = await ensureFirebaseInitialized();
    }

    if (!configured || !auth || !googleProvider) {
      const msg =
        'Firebase configuration is missing or incomplete. See FIREBASE_SETUP.md for setup instructions.';
      setAuthError(msg);
      throw new Error(msg);
    }

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (error.code === 'auth/popup-blocked') {
        // Fallback for mobile browsers or aggressive popup blockers
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectError: any) {
          const msg = formatAuthError(redirectError);
          if (msg) setAuthError(msg);
          throw new Error(msg || 'Google redirect sign-in failed.');
        }
      }

      if (
        error.code === 'auth/popup-closed-by-user' ||
        error.code === 'auth/cancelled-popup-request'
      ) {
        // User closed the popup window deliberately or initiated another request
        return;
      }

      console.error('[LifePilot Auth] Google Sign-In error:', error);
      const msg = formatAuthError(error);
      if (msg) setAuthError(msg);
      throw new Error(msg || 'Google Sign-In failed.');
    }
  };

  const logout = async () => {
    setAuthError(null);
    if (!auth) {
      setUser(null);
      return;
    }
    try {
      await signOut(auth);
      setUser(null);
    } catch (error: any) {
      console.error('[LifePilot Auth] Logout error:', error);
      const msg = formatAuthError(error);
      setAuthError(msg);
      throw new Error(msg || 'Failed to sign out.');
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isConfigured: isFirebaseConfigured,
        authError,
        signInWithGoogle,
        logout,
        clearAuthError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
