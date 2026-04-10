import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBdfvMGyCGYZZsiCcN_I7_AjEQ4t5N73Oo",
  authDomain: "godavari-specials.firebaseapp.com",
  projectId: "godavari-specials",
  storageBucket: "godavari-specials.firebasestorage.app",
  messagingSenderId: "537128701575",
  appId: "1:537128701575:web:d2099612c0840568ff7222",
};

// Standard Default App initialization
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
