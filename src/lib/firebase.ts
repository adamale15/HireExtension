import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  GoogleAuthProvider, 
  signInWithCredential,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  getFirestore, 
  Firestore,
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  Timestamp,
  enableIndexedDbPersistence,
  initializeFirestore,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';
import { 
  getStorage, 
  FirebaseStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import type { User, Resume } from './types';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

export function initializeFirebase() {
  if (!app) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    
    // Initialize Firestore with offline persistence
    db = initializeFirestore(app, {
      cacheSizeBytes: CACHE_SIZE_UNLIMITED
    });
    
    // Enable offline persistence for Chrome extensions
    enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
        console.warn('Firestore: Multiple tabs open, persistence enabled in first tab only');
      } else if (err.code === 'unimplemented') {
        console.warn('Firestore: Persistence not available in this browser');
      }
    });
    
    storage = getStorage(app);
  }
  return { app, auth, db, storage };
}

// Auth functions - Using popup auth which works better for extensions in dev mode
export async function signInWithGoogle(): Promise<FirebaseUser> {
  const { auth } = initializeFirebase();
  
  try {
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    // Use popup auth - this opens in a new window which Google allows
    const result = await signInWithPopup(auth, provider);
    console.log('Successfully signed in with Google');
    return result.user;
  } catch (error: any) {
    console.error('Google sign-in error:', error);
    throw new Error(error.message || 'Failed to sign in with Google');
  }
}

// Email/Password authentication as backup
export async function signInWithEmail(email: string, password: string): Promise<FirebaseUser> {
  const { auth } = initializeFirebase();
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error: any) {
    console.error('Email sign-in error:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
}

export async function signUpWithEmail(email: string, password: string): Promise<FirebaseUser> {
  const { auth } = initializeFirebase();
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result.user;
  } catch (error: any) {
    console.error('Email sign-up error:', error);
    throw new Error(error.message || 'Failed to create account');
  }
}

export async function signOut(): Promise<void> {
  const { auth } = initializeFirebase();
  await firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void) {
  const { auth } = initializeFirebase();
  return onAuthStateChanged(auth, callback);
}

export function getCurrentUser(): FirebaseUser | null {
  const { auth } = initializeFirebase();
  return auth.currentUser;
}

// User CRUD
export async function createUser(firebaseUser: FirebaseUser): Promise<User> {
  const { db } = initializeFirebase();
  const user: User = {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || '',
    photoURL: firebaseUser.photoURL || '',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  try {
    await setDoc(doc(db, 'users', user.uid), {
      ...user,
      createdAt: Timestamp.fromDate(user.createdAt),
      updatedAt: Timestamp.fromDate(user.updatedAt)
    });
    console.log('User created in Firestore successfully');
  } catch (error: any) {
    console.error('Error creating user in Firestore:', error);
    // If Firestore is unavailable, just continue with local user object
    if (error.code === 'unavailable') {
      console.warn('Firestore unavailable, using local user data only');
    } else {
      throw error;
    }
  }
  
  return user;
}

export async function getUser(uid: string): Promise<User | null> {
  const { db } = initializeFirebase();
  try {
    const docSnap = await getDoc(doc(db, 'users', uid));
    
    if (!docSnap.exists()) {
      console.log('User document does not exist in Firestore');
      return null;
    }
    
    const data = docSnap.data();
    return {
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate()
    } as User;
  } catch (error: any) {
    console.error('Error getting user from Firestore:', error);
    // If Firestore is not available, return null so we can create the user
    if (error.code === 'unavailable') {
      console.warn('Firestore unavailable, will create user locally');
      return null;
    }
    throw error;
  }
}

// Resume CRUD
export async function uploadResume(
  userId: string,
  file: File,
  name: string,
  parsedProfile: Resume['parsedProfile']
): Promise<Resume> {
  const { db } = initializeFirebase();
  
  const resumeId = `${userId}_${Date.now()}`;
  
  // Convert PDF to base64 and store in Firestore instead of Storage (avoids CORS issues)
  const arrayBuffer = await file.arrayBuffer();
  const base64 = btoa(
    new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
  );
  
  const pdfUrl = `data:application/pdf;base64,${base64}`;
  
  const resume: Resume = {
    id: resumeId,
    userId,
    name,
    fileName: file.name,
    pdfUrl,
    parsedProfile,
    uploadedAt: new Date(),
    updatedAt: new Date()
  };
  
  await setDoc(doc(db, 'resumes', resumeId), {
    ...resume,
    uploadedAt: Timestamp.fromDate(resume.uploadedAt),
    updatedAt: Timestamp.fromDate(resume.updatedAt)
  });
  
  console.log('Resume saved to Firestore with base64 PDF');
  return resume;
}

export async function getResumes(userId: string): Promise<Resume[]> {
  const { db } = initializeFirebase();
  const q = query(collection(db, 'resumes'), where('userId', '==', userId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      ...data,
      uploadedAt: data.uploadedAt.toDate(),
      updatedAt: data.updatedAt.toDate()
    } as Resume;
  });
}

export async function updateResumeName(resumeId: string, name: string): Promise<void> {
  const { db } = initializeFirebase();
  await updateDoc(doc(db, 'resumes', resumeId), {
    name,
    updatedAt: Timestamp.now()
  });
}

export async function deleteResume(resumeId: string, userId: string): Promise<void> {
  const { db } = initializeFirebase();
  
  // Delete from Firestore (PDF is stored as base64 in the document)
  await deleteDoc(doc(db, 'resumes', resumeId));
}

export { auth, db, storage };
