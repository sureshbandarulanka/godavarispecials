import { auth, db, googleProvider } from "@/lib/firebase";
import { isWhitelistedAdmin } from "@/config/adminWhitelist";
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs } from "firebase/firestore";

export interface UserData {
  uid: string;
  email: string | null;
  phone: string | null;
  displayName: string | null;
  photoURL: string | null;
  role: "user" | "admin";
  city?: string;
  dob?: string;
  categoryPreference?: string[];
  fcmTokens?: string[];
  createdAt: any;
  lastLogin: any;
}

/**
 * Syncs user data to Firestore on successful login/signup
 * Important: Role-Safe Sync (Preserves Admin status)
 */
export const syncUserToFirestore = async (user: FirebaseUser) => {
  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);
  
  let existingRole: "user" | "admin" = "user";
  
  if (userSnap.exists()) {
    existingRole = userSnap.data().role || "user";
  } else {
    // Check if phone is in whitelist for initial registration
    if (user.phoneNumber && isWhitelistedAdmin(user.phoneNumber)) {
      existingRole = "admin";
    }
  }

  // Location Sync: Get city from localStorage if available
  let city: string | undefined;
  if (typeof window !== 'undefined') {
    const savedLocation = localStorage.getItem('userLocation');
    if (savedLocation) {
      try { city = JSON.parse(savedLocation).city; } catch (e) {}
    }
  }

  const userData: Partial<UserData> = {
    uid: user.uid,
    email: user.email,
    phone: user.phoneNumber,
    displayName: user.displayName,
    photoURL: user.photoURL,
    role: existingRole,
    lastLogin: serverTimestamp(),
    ...(city && { city })
  };

  if (!userSnap.exists()) {
    userData.createdAt = serverTimestamp();
    await setDoc(userRef, userData);
  } else {
    await setDoc(userRef, userData, { merge: true });
  }

  // Fetch final merged data to return
  const finalSnap = await getDoc(userRef);
  return finalSnap.data() as UserData;
};

/**
 * Login with Google
 */
export const loginWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  await syncUserToFirestore(result.user);
  return result.user;
};

/**
 * Logout
 */
export const logout = async () => {
  await signOut(auth);
};

/**
 * Get all users from Firestore
 */
export const getUsersAsync = async () => {
  const querySnapshot = await getDocs(collection(db, "users"));
  return querySnapshot.docs.map(doc => doc.data() as UserData);
};
