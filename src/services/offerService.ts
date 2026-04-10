import { db, storage } from "@/lib/firebase";
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
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { compressImage } from "@/utils/compressImage";
import { isActiveBySchedule } from "@/utils/isActiveBySchedule";

export interface Offer {
  id?: string;
  title: string;
  productId: string;
  discountPercent: number;
  originalPrice: number;
  offerPrice: number;
  imageUrl: string;
  productImage?: string; // Fallback image from original product
  isActive: boolean;
  startDate: any; // Firestore Timestamp
  endDate: any;   // Firestore Timestamp
  createdAt?: any;
}

// ✅ Add Offer
export const addOffer = async (offerData: Omit<Offer, "id" | "createdAt">) => {
  try {
    const dataWithTimestamp = {
      ...offerData,
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, "offers"), dataWithTimestamp);
    return docRef.id;
  } catch (error) {
    console.error("Error adding offer:", error);
    throw error;
  }
};

// ✅ Update Offer
export const updateOffer = async (id: string, offerData: Partial<Offer>) => {
  try {
    const docRef = doc(db, "offers", id);
    await updateDoc(docRef, offerData);
  } catch (error) {
    console.error("Error updating offer:", error);
    throw error;
  }
};

// ✅ Delete Offer
export const deleteOffer = async (id: string) => {
  console.log('Service: deleteOffer called for ID:', id);
  try {
    const docRef = doc(db, "offers", id);
    console.log('Service: docRef created for ID:', id);
    await deleteDoc(docRef);
    console.log('Service: deleteDoc COMPLETED for ID:', id);
  } catch (error) {
    console.error("Service: Error deleting offer:", error);
    throw error;
  }
};

// ✅ Get All Offers (for Admin)
export const getOffers = async (): Promise<Offer[]> => {
  try {
    const offersQuery = query(collection(db, "offers"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(offersQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Offer[];
  } catch (error) {
    console.error("Error fetching all offers:", error);
    return [];
  }
};

// ✅ Get Active Offers (for Frontend) - Filtered by Schedule
export const getActiveOffers = async (): Promise<Offer[]> => {
  try {
    const activeQuery = query(collection(db, "offers"), where("isActive", "==", true));
    const querySnapshot = await getDocs(activeQuery);
    
    const offers = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Offer[];
    
    // 🔥 Filter by Schedule
    return offers.filter(isActiveBySchedule);
  } catch (error) {
    console.error("Error fetching active offers:", error);
    return [];
  }
};

// ✅ Real-time Active Offers Subscription
export const subscribeToActiveOffers = (
  callback: (offers: Offer[]) => void,
  onError?: () => void
): (() => void) => {
  const activeQuery = query(
    collection(db, "offers"),
    where("isActive", "==", true),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(
    activeQuery,
    (snapshot) => {
      const offers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Offer[];

      // 🔥 Filter by Schedule
      const activeOffers = offers.filter(isActiveBySchedule);

      callback(activeOffers);
    },
    (error) => {
      console.error("Real-time offer listener error:", error);
      if (onError) onError();
    }
  );
};


// ✅ Upload Offer Image (Automated Compression)
export const uploadOfferImage = async (file: File): Promise<string> => {
  try {
    // 1. Compress Image
    const compressedFile = await compressImage(file);

    const uniqueName = `${Date.now()}_${compressedFile.name}`;
    const storageRef = ref(storage, `offers/${uniqueName}`);
    const snapshot = await uploadBytes(storageRef, compressedFile);
    return await getDownloadURL(snapshot.ref);
  } catch (error) {
    console.error("Offer Image upload error:", error);
    throw error;
  }
};
