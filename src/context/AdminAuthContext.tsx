"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged, User as FirebaseUser, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

interface AdminUser {
  uid: string;
  name: string;
  email: string | null;
  role: "admin";
}

interface AdminAuthContextType {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 🔥 Tracking standard auth (but specifically for admin context)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        // Fetch role from Firestore directly to verify admin access
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.data();

        if (userData && userData.role === 'admin') {
          setUser({
            uid: firebaseUser.uid,
            name: userData.displayName || firebaseUser.displayName || 'Admin',
            email: firebaseUser.email,
            role: 'admin',
          });
        } else {
          // If logged in user is NOT an admin in the context of the Admin Panel,
          // simply clear the local admin state.
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      // 💡 Standard Firebase login
      const credential = await signInWithEmailAndPassword(auth, email, pass);
      
      // 🛡️ Security: Verify admin role in Firestore
      const userRef = doc(db, "users", credential.user.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.data();

      if (!userData || userData.role !== 'admin') {
        // If they are a valid user but not an admin, we MUST log them out 
        // from the admin context to prevent partial sessions.
        await signOut(auth);
        throw new Error('Access Denied: Your account does not have administrator privileges.');
      }
    } catch (error: any) {
      // Re-throw to be caught by the login page UI
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AdminAuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
