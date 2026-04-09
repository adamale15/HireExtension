import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth, 
  GoogleAuthProvider, 
  signInWithPopup,
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
  Timestamp
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
    db = getFirestore(app);
    storage = getStorage(app);
  }
  return { app, auth, db, storage };
}

// Auth functions
export async function signInWithGoogle(): Promise<FirebaseUser> {
  const { auth } = initializeFirebase();
  const provider = new GoogleAuthProvider();
  provider.addScope('email');
  provider.addScope('profile');
  
  const result = await signInWithPopup(auth, provider);
  return result.user;
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
  
  await setDoc(doc(db, 'users', user.uid), {
    ...user,
    createdAt: Timestamp.fromDate(user.createdAt),
    updatedAt: Timestamp.fromDate(user.updatedAt)
  });
  
  return user;
}

export async function getUser(uid: string): Promise<User | null> {
  const { db } = initializeFirebase();
  const docSnap = await getDoc(doc(db, 'users', uid));
  
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data();
  return {
    ...data,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate()
  } as User;
}

// Resume CRUD
export async function uploadResume(
  userId: string,
  file: File,
  name: string,
  parsedProfile: Resume['parsedProfile']
): Promise<Resume> {
  const { db, storage } = initializeFirebase();
  
  const resumeId = `${userId}_${Date.now()}`;
  const storageRef = ref(storage, `resumes/${userId}/${resumeId}.pdf`);
  
  await uploadBytes(storageRef, file);
  const pdfUrl = await getDownloadURL(storageRef);
  
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
  const { db, storage } = initializeFirebase();
  
  // Delete from Firestore
  await deleteDoc(doc(db, 'resumes', resumeId));
  
  // Delete from Storage
  const storageRef = ref(storage, `resumes/${userId}/${resumeId}.pdf`);
  await deleteObject(storageRef);
}

export { auth, db, storage };
