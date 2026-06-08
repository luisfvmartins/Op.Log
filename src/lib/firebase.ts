import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA4gq67jR_sb5QeP-jga4t_YM80va13kjg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "locais-e-roteiros.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "locais-e-roteiros",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "locais-e-roteiros.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "212553649305",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:212553649305:web:5e3dc8705077564d943c08",
};

// Only initialize if we have the config
const isConfigured = Boolean(firebaseConfig.projectId);

export const app = isConfigured 
  ? (!getApps().length ? initializeApp(firebaseConfig) : getApps()[0])
  : null;

export const db = app ? getFirestore(app) : null;
export const auth = app ? getAuth(app) : null;
