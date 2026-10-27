import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  type User,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isConfigured: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(isFirebaseConfigured);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser);
        setLoading(false);
      },
      (error) => {
        console.error('[LifePilot Auth] State change error:', error);
        setAuthError(error.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setAuthError(null);

    if (!isFirebaseConfigured || !auth || !googleProvider) {
      setAuthError(
        'Firebase configuration is missing or incomplete in your .env file. See FIREBASE_SETUP.md for setup instructions.'
      );
      return;
    }

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      if (
        error.code === 'auth/popup-blocked' ||
        error.code === 'auth/cancelled-popup-request'
      ) {
        // Fallback for mobile browsers or aggressive popup blockers
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectError: any) {
          setAuthError(redirectError.message || 'Failed to sign in with Google redirect.');
          return;
        }
      }

      if (error.code === 'auth/popup-closed-by-user') {
        // User closed the popup, no need for an aggressive error
        return;
      }

      console.error('[LifePilot Auth] Google Sign-In error:', error);
      setAuthError(error.message || 'Google Sign-In failed. Please try again.');
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
      setAuthError(error.message || 'Failed to sign out.');
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

