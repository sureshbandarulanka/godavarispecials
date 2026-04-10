import { db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDoc, 
  serverTimestamp, 
  query, 
  orderBy,
  where,
  onSnapshot,
  Timestamp 
} from "firebase/firestore";
import { Coupon } from "@/utils/couponEngine";

const COLLECTION_NAME = "coupons";

// ✅ Add Coupon
export const addCoupon = async (couponData: Omit<Coupon, "id" | "createdAt">) => {
  try {
    const dataWithTimestamp = {
      ...couponData,
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, COLLECTION_NAME), dataWithTimestamp);
    return docRef.id;
  } catch (error) {
    console.error("Error adding coupon:", error);
    throw error;
  }
};

// ✅ Update Coupon
export const updateCoupon = async (id: string, couponData: Partial<Coupon>) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(docRef, couponData);
  } catch (error) {
    console.error("Error updating coupon:", error);
    throw error;
  }
};

// ✅ Delete Coupon
export const deleteCoupon = async (id: string) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting coupon:", error);
    throw error;
  }
};

// ✅ Get All Coupons (Admin)
export const getCoupons = async (): Promise<Coupon[]> => {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Coupon[];
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return [];
  }
};

// ✅ Real-time Coupons Subscription
export const subscribeToCoupons = (callback: (coupons: Coupon[]) => void) => {
  const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const coupons = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Coupon[];
    callback(coupons);
  });
};

// ✅ Get Coupon by Code
export const getCouponByCode = async (code: string): Promise<Coupon | null> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME), 
      where("code", "==", code.toUpperCase()),
      where("isActive", "==", true)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Coupon;
    }
    return null;
  } catch (error) {
    console.error("Error fetching coupon by code:", error);
    return null;
  }
};

// ✅ Get User Used Coupons
export const getUserUsedCoupons = async (userId: string): Promise<string[]> => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return (userSnap.data().usedCoupons || []) as string[];
    }
    return [];
  } catch (error) {
    console.error("Error fetching user coupons:", error);
    return [];
  }
};

// ✅ Get All Active (Non-Expired) Coupons
export const getActiveCoupons = async (): Promise<Coupon[]> => {
  try {
    const now = Timestamp.now();
    const q = query(
      collection(db, COLLECTION_NAME), 
      where("isActive", "==", true),
      where("expiryDate", ">", now)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Coupon[];
  } catch (error) {
    console.error("Error fetching active coupons:", error);
    return [];
  }
};

// ✅ Get User Total Orders Count
export const getUserTotalOrders = async (userId: string): Promise<number> => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return Number(userSnap.data().totalOrders || 0);
    }
    return 0;
  } catch (error) {
    console.error("Error fetching user total orders:", error);
    return 0;
  }
};
