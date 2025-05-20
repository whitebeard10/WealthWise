
'use client';

import type { User, AuthError } from 'firebase/auth';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
} from 'firebase/auth';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/lib/firebase/client'; // Ensure this path is correct
import { useRouter } from 'next/navigation';
// Loading component import is not needed here if AuthProvider doesn't render it directly

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, pass: string) => Promise<User | null>;
  logIn: (email: string, pass: string) => Promise<User | null>;
  logOut: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error: string | null }>;
  setError: (error: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const signUp = async (email: string, pass: string): Promise<User | null> => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
      setCurrentUser(userCredential.user);
      return userCredential.user;
    } catch (e) {
      const authError = e as AuthError;
      console.error('Sign up error:', authError);
      setError(authError.message || 'Failed to sign up.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logIn = async (email: string, pass: string): Promise<User | null> => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, pass);
      setCurrentUser(userCredential.user);
      return userCredential.user;
    } catch (e) {
      const authError = e as AuthError;
      console.error('Log in error:', authError);
      setError(authError.message || 'Failed to log in.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logOut = async () => {
    setLoading(true);
    setError(null);
    try {
      await signOut(auth);
      setCurrentUser(null);
      router.push('/login');
    } catch (e) {
      const authError = e as AuthError;
      console.error('Log out error:', authError);
      setError(authError.message || 'Failed to log out.');
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error: string | null }> => {
    if (!currentUser) {
      return { success: false, error: 'User not authenticated. Please log in again.' };
    }
    setLoading(true);
    setError(null);
    try {
      const userEmail = currentUser.email;
      if (!userEmail) {
        return { success: false, error: 'User email not found. Cannot change password.' };
      }
      const credential = EmailAuthProvider.credential(userEmail, currentPassword);
      await reauthenticateWithCredential(currentUser, credential);
      await updatePassword(currentUser, newPassword);
      setLoading(false);
      return { success: true, error: null };
    } catch (e) {
      const authError = e as AuthError;
      console.error('Change password error:', authError);
      let friendlyError = 'Failed to change password.';
      if (authError.code === 'auth/wrong-password') {
        friendlyError = 'Incorrect current password.';
      } else if (authError.code === 'auth/weak-password') {
        friendlyError = 'The new password is too weak.';
      } else if (authError.code === 'auth/requires-recent-login') {
        friendlyError = 'This operation is sensitive and requires recent authentication. Please log out and log back in before trying again.';
      }
      setError(friendlyError);
      setLoading(false);
      return { success: false, error: friendlyError };
    }
  };

  // Removed the problematic if block that conditionally rendered <Loading />
  // based on window.location.pathname.
  // AuthProvider should consistently render its children.

  return (
    <AuthContext.Provider value={{ currentUser, loading, error, signUp, logIn, logOut, changePassword, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
