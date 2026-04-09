import { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { 
  onAuthChange, 
  signInWithGoogle as firebaseSignInGoogle,
  signInWithEmail as firebaseSignInEmail,
  signUpWithEmail as firebaseSignUpEmail,
  signOut as firebaseSignOut,
  getCurrentUser,
  createUser,
  getUser
} from '../lib/firebase';
import { saveUserSession, getUserSession, clearUserSession } from '../lib/storage';
import type { User } from '../lib/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('useAuth: Setting up auth listener');
    
    // Check for cached session first
    getUserSession().then(session => {
      if (session) {
        console.log('useAuth: Found cached session', session);
        setUser(session as User);
      }
    });

    // Listen for auth state changes
    const unsubscribe = onAuthChange(async (firebaseUser: FirebaseUser | null) => {
      console.log('useAuth: Auth state changed', firebaseUser ? 'User signed in' : 'User signed out');
      
      if (firebaseUser) {
        try {
          console.log('useAuth: Loading user data for', firebaseUser.uid);
          let userData = await getUser(firebaseUser.uid);
          
          if (!userData) {
            console.log('useAuth: Creating new user in Firestore');
            userData = await createUser(firebaseUser);
          }
          
          console.log('useAuth: User data loaded', userData);
          setUser(userData);
          await saveUserSession({
            uid: userData.uid,
            email: userData.email,
            displayName: userData.displayName,
            photoURL: userData.photoURL
          });
          setLoading(false);
        } catch (err) {
          console.error('useAuth: Error loading user data:', err);
          setError('Failed to load user data');
          setLoading(false);
        }
      } else {
        console.log('useAuth: No user, clearing session');
        setUser(null);
        await clearUserSession();
        setLoading(false);
      }
    });

    return () => {
      console.log('useAuth: Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      await firebaseSignInGoogle();
    } catch (err: any) {
      console.error('Google sign in error:', err);
      setError(err.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      setError(null);
      await firebaseSignInEmail(email, password);
    } catch (err: any) {
      console.error('Email sign in error:', err);
      setError(err.message || 'Failed to sign in');
      throw err;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      setError(null);
      await firebaseSignUpEmail(email, password);
    } catch (err: any) {
      console.error('Email sign up error:', err);
      setError(err.message || 'Failed to create account');
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await firebaseSignOut();
      await clearUserSession();
      setUser(null);
    } catch (err: any) {
      console.error('Sign out error:', err);
      setError(err.message || 'Failed to sign out');
    }
  };

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    isAuthenticated: !!user
  };
}
