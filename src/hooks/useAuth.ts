import { useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { 
  onAuthChange, 
  signInWithGoogle as firebaseSignIn,
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
    // Check for cached session first
    getUserSession().then(session => {
      if (session) {
        setUser(session as User);
      }
    });

    // Listen for auth state changes
    const unsubscribe = onAuthChange(async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          let userData = await getUser(firebaseUser.uid);
          
          if (!userData) {
            userData = await createUser(firebaseUser);
          }
          
          setUser(userData);
          await saveUserSession({
            uid: userData.uid,
            email: userData.email,
            displayName: userData.displayName,
            photoURL: userData.photoURL
          });
        } catch (err) {
          console.error('Error loading user data:', err);
          setError('Failed to load user data');
        }
      } else {
        setUser(null);
        await clearUserSession();
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    try {
      setError(null);
      setLoading(true);
      await firebaseSignIn();
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError(err.message || 'Failed to sign in');
      setLoading(false);
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
    signIn,
    signOut,
    isAuthenticated: !!user
  };
}
