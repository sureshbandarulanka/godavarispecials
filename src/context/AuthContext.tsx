"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { syncUserToFirestore, logout as serviceLogout, loginWithGoogle as serviceGoogle } from '@/services/authService';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { requestNotificationPermission, generateFCMToken, listenForegroundMessages } from '@/services/notificationService';

export interface User {
  uid: string;
  name: string;
  email: string | null;
  phone: string | null;
  photoURL: string | null;
  role: "user" | "admin";
  dob?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (name: string, email: string, pass: string, phone?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        // Sync to Firestore & Get User Data (Role-Safe)
        const userData = await syncUserToFirestore(firebaseUser);
        
        setUser({
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email,
          phone: firebaseUser.phoneNumber || userData.phone,
          photoURL: firebaseUser.photoURL,
          role: userData.role || 'user',
          dob: userData.dob,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    // Initialize FCM Foreground Listener
    if (typeof window !== "undefined") {
      listenForegroundMessages();
    }

    return () => unsubscribe();
  }, []);

  // Sync FCM Token when user is logged in
  useEffect(() => {
    if (user) {
      const syncFCM = async () => {
        try {
          const permission = await requestNotificationPermission();
          if (permission === 'granted') {
            const token = await generateFCMToken();
            if (token) {
              const userRef = doc(db, "users", user.uid);
              await updateDoc(userRef, {
                fcmTokens: arrayUnion(token)
              });
              process.env.NODE_ENV === 'development' && console.log("FCM Token synced to Firestore");
            }
          }
        } catch (err) {
          // Fail silently for notifications to not block core auth
          process.env.NODE_ENV === 'development' && console.warn("FCM Sync Error:", err);
        }
      };

      // 5 second delay to ensure profile/login finishes
      const timer = setTimeout(syncFCM, 5000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
    setIsLoginModalOpen(false);
  };

  const signupWithEmail = async (name: string, email: string, pass: string, phone?: string) => {
    // 🛑 Check for duplicate phone
    if (phone) {
      const { isPhoneAlreadyUsed } = await import('@/services/authService');
      const isUsed = await isPhoneAlreadyUsed(phone);
      if (isUsed) {
        throw new Error("Phone number already in use by another account! 🚫");
      }
    }

    const res = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(res.user, { displayName: name });
    
    // If phone was provided, we need to sync it to Firestore manually or via syncUserToFirestore
    // Since syncUserToFirestore is called by onAuthStateChanged, we should make sure it knows about the phone.
    // However, createUserWithEmailAndPassword doesn't set phone on the user object.
    // So we'll update Firestore directly here or in syncUserToFirestore.
    
    setIsLoginModalOpen(false);
  };

  const loginWithGoogle = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await serviceGoogle();
      setIsLoginModalOpen(false);
    } catch (err: any) {
      if (err.code !== 'auth/cancelled-popup-request' && err.code !== 'auth/popup-closed-by-user') {
        throw err;
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await serviceLogout();
  };

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading,
      loginWithEmail, 
      signupWithEmail, 
      loginWithGoogle, 
      logout,
      isLoginModalOpen, 
      openLoginModal, 
      closeLoginModal 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

