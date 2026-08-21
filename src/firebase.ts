import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
export const firebaseConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY || "AIzaSyAYaMw3S1rGsvnZbCwpcpyP1D-vb5m-Sck",
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || "exam-f5942.firebaseapp.com",
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID || "exam-f5942",
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || "exam-f5942.firebasestorage.app",
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "479235659616",
  appId: import.meta.env?.VITE_FIREBASE_APP_ID || "1:479235659616:web:50dc1c4bf3e9d43c42b005"
};

// Initialize Firebase App Singleton
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Firebase Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
