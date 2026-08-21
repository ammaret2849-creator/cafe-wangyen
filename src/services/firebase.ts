import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  signInAnonymously
} from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  getFirestore,
  Firestore
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';

const firebaseConfig = {
  projectId: firebaseConfigData.projectId || "cafe-cd",
  appId: firebaseConfigData.appId,
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain || "cafe-cd.firebaseapp.com",
  storageBucket: firebaseConfigData.storageBucket || "cafe-cd.firebasestorage.app",
  messagingSenderId: firebaseConfigData.messagingSenderId,
};

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with custom databaseId and persistent cache for full offline capability
const databaseId = firebaseConfigData.firestoreDatabaseId || "(default)";

let db: Firestore;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager(),
    }),
  }, databaseId);
} catch {
  // If already initialized or fallback
  try {
    db = getFirestore(app, databaseId);
  } catch {
    db = getFirestore(app);
  }
}

// Initialize Auth
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export { 
  app, 
  db, 
  auth, 
  googleProvider, 
  signInWithPopup, 
  fbSignOut, 
  onAuthStateChanged, 
  signInAnonymously,
  type FirebaseUser 
};
