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
  limit,
  onSnapshot,
  writeBatch
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { compressImage } from "@/utils/compressImage";
import { isActiveBySchedule } from "@/utils/isActiveBySchedule";

export interface Banner {
  id: string;
  imageUrl: string;
  type?: "product" | "category" | "custom";
  referenceId?: string;
  redirectUrl: string;
  tagline?: string;
  isActive: boolean;
  priority: number;
  startDate?: any;
  endDate?: any;
  createdAt: any;
}

// Helper to extract storage path from Firebase URL
export const getStoragePathFromUrl = (url: string) => {
  try {
    const path = url.split("/o/")[1]?.split("?")[0];
    return decodeURIComponent(path);
  } catch (error) {
    console.error("Error extracting storage path:", error);
    return "";
  }
};

// ✅ Get All Banners (for Admin)
export const getAdminBanners = async (): Promise<Banner[]> => {
  try {
    const bannersQuery = query(collection(db, "banners"), orderBy("priority", "asc"));
    const querySnapshot = await getDocs(bannersQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Banner[];
  } catch (error) {
    console.error("Error fetching admin banners:", error);
    throw error;
  }
};

// ✅ Get Banner by ID
export const getBannerById = async (id: string): Promise<Banner | null> => {
  try {
    const docRef = doc(db, "banners", id);
    const snapshot = await getDoc(docRef);
    if (!snapshot.exists()) return null;
    return { id: snapshot.id, ...snapshot.data() } as Banner;
  } catch (error) {
    console.error("Error fetching banner:", error);
    throw error;
  }
};

// ✅ Get Active Banners (for Frontend) - Filtered by Schedule
export const getActiveBanners = async (): Promise<Banner[]> => {
  try {
    const bannersQuery = query(
      collection(db, "banners"), 
      where("isActive", "==", true),
      orderBy("priority", "asc"),
      orderBy("createdAt", "desc")
    );
    const querySnapshot = await getDocs(bannersQuery);
    const banners = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Banner[];

    // 🔥 Filter by Schedule and Limit to 5
    return banners.filter(isActiveBySchedule).slice(0, 5);
  } catch (error) {
    console.error("Error fetching active banners:", error);
    return [];
  }
};

// ✅ Real-time Active Banners Subscription (auto-updates frontend on admin changes)
export const subscribeToActiveBanners = (
  callback: (banners: Banner[]) => void,
  onError?: () => void
): (() => void) => {
  const bannersQuery = query(
    collection(db, "banners"),
    where("isActive", "==", true),
    orderBy("priority", "asc"),
    orderBy("createdAt", "desc"),
    limit(5)
  );

  return onSnapshot(
    bannersQuery,
    (snapshot) => {
      const banners = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Banner[];

      // 🔥 Filter by Schedule and Limit to 5
      const activeBanners = banners.filter(isActiveBySchedule).slice(0, 5);
      
      callback(activeBanners);
    },
    (error) => {
      console.error("Real-time banner listener error:", error);
      if (onError) onError();
    }
  );
};


// ✅ Add Banner
export const addBanner = async (data: Omit<Banner, 'id' | 'createdAt'>) => {
  try {
    const bannerData = {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, "banners"), bannerData);
    return docRef.id;
  } catch (error) {
    console.error("Error adding banner:", error);
    throw error;
  }
};

// ✅ Update Banner
export const updateBanner = async (id: string, data: Partial<Banner>, oldImageUrl?: string) => {
  try {
    const docRef = doc(db, "banners", id);
    const updateData = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    // If new image was uploaded, delete the old one
    if (data.imageUrl && oldImageUrl && data.imageUrl !== oldImageUrl) {
      const oldPath = getStoragePathFromUrl(oldImageUrl);
      if (oldPath) {
        try {
          const oldRef = ref(storage, oldPath);
          await deleteObject(oldRef);
          console.log("✅ Old banner image deleted after update");
        } catch (err) {
          console.warn("⚠️ Failed to delete old image during update:", err);
        }
      }
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error("Error updating banner:", error);
    throw error;
  }
};

// ✅ Toggle Banner Status
export const toggleBannerStatus = async (id: string, isActive: boolean) => {
  try {
    const docRef = doc(db, "banners", id);
    await updateDoc(docRef, { isActive, updatedAt: serverTimestamp() });
  } catch (error) {
    console.error("Error toggling banner status:", error);
    throw error;
  }
};

// ✅ Delete Banner (Firestore + Storage)
export const deleteBanner = async (id: string, imageUrl: string) => {
  try {
    // 1. Delete Firestore Document
    const docRef = doc(db, "banners", id);
    await deleteDoc(docRef);

    // 2. Delete from Storage (Safe deletion)
    if (imageUrl) {
      const filePath = getStoragePathFromUrl(imageUrl);
      if (filePath) {
        try {
          const fileRef = ref(storage, filePath);
          await deleteObject(fileRef);
          console.log("✅ Banner image deleted from storage");
        } catch (storageError: any) {
          console.warn("⚠️ Image not found in storage or delete failed:", storageError.message);
        }
      }
    }
  } catch (error) {
    console.error("Error deleting banner:", error);
    throw error;
  }
};

// ✅ Upload Banner Image (with 2MB check + Automated Compression)
export const uploadBannerImage = async (file: File): Promise<string> => {
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Image size exceeds 2MB limit.");
  }

  try {
    // 1. Compress Image
    const compressedFile = await compressImage(file);

    const uniqueName = `banners/${Date.now()}-${compressedFile.name}`;
    const storageRef = ref(storage, uniqueName);
    const snapshot = await uploadBytes(storageRef, compressedFile);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Banner image upload error:", error);
    throw error;
  }
};

// ✅ Update Banners Order (Batch Update)
export const updateBannersOrder = async (reorderedBanners: Banner[]) => {
  try {
    const batch = writeBatch(db);
    reorderedBanners.forEach((banner, index) => {
      const docRef = doc(db, "banners", banner.id);
      batch.update(docRef, { priority: index, updatedAt: serverTimestamp() });
    });
    await batch.commit();
  } catch (error) {
    console.error("Error updating banner order:", error);
    throw error;
  }
};
