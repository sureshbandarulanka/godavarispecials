import { db } from "@/lib/firebase";
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp, 
  writeBatch, 
  query, 
  orderBy, 
  onSnapshot 
} from "firebase/firestore";

export interface Section {
  id: string;
  name: string;
  slug: string;
  order: number;
  type: 'dynamic' | 'custom';
  isActive?: boolean;
  isDeleted?: boolean;
  createdAt?: any;
}

// ✅ Real-time Section Listener
export const subscribeToSections = (
  callback: (sections: Section[]) => void,
  onError?: (err: any) => void
): (() => void) => {
  const sectionsQuery = query(collection(db, "sections"), orderBy("order", "asc"));

  return onSnapshot(
    sectionsQuery,
    (snapshot) => {
      const sections = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Section[];

      // Filter out deleted sections
      const activeSections = sections.filter(s => !s.isDeleted);
      callback(activeSections);
    },
    (error) => {
      console.error("Real-time sections listener error:", error);
      if (onError) onError(error);
    }
  );
};

// ✅ Fetch Sections (One-time)
export const getSectionsAsync = async (): Promise<Section[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, "sections"));
    const list = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Section[];
    return list.filter(s => !s.isDeleted).sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error("Error fetching sections:", error);
    return [];
  }
};

// ✅ Seed Default Sections
export const seedDefaultSections = async () => {
  try {
    console.log("🌱 Checking if sections need seeding...");
    const existing = await getSectionsAsync();
    
    // If sections already exist, do not re-seed
    if (existing.length > 0) {
      console.log("✅ Sections already exist, no seeding needed.");
      return existing;
    }

    console.log("🌱 Seeding default sections...");
    const batch = writeBatch(db);
    
    // 1. Fetch categories to get automatic category sections
    const categorySnap = await getDocs(collection(db, "categories"));
    const categories = categorySnap.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as any[];

    const activeCategories = categories.filter(c => !c.isDeleted);

    // 2. Define our base dynamic sections
    const defaultSections: Omit<Section, "id">[] = [
      {
        name: "Top Selling Specials",
        slug: "top-selling-specials",
        order: 0,
        type: "dynamic",
        isActive: true,
      },
      {
        name: "Non-Veg Pickles",
        slug: "non-veg-pickles",
        order: 1,
        type: "dynamic",
        isActive: true,
      },
      {
        name: "Traditional Veg Pickles",
        slug: "traditional-veg-pickles",
        order: 2,
        type: "dynamic",
        isActive: true,
      }
    ];

    // 3. Add other active category sections in order
    let currentOrder = 3;
    activeCategories.forEach((cat) => {
      if (cat.slug !== "pickles") {
        defaultSections.push({
          name: cat.name,
          slug: cat.slug,
          order: currentOrder++,
          type: "dynamic",
          isActive: true
        });
      }
    });

    // 4. Commit to database
    for (const sec of defaultSections) {
      const newDocRef = doc(collection(db, "sections"));
      batch.set(newDocRef, {
        ...sec,
        createdAt: serverTimestamp()
      });
    }

    await batch.commit();
    console.log("✅ Successfully seeded default sections!");
  } catch (error) {
    console.error("❌ Failed to seed default sections:", error);
  }
};

// ✅ Add Section
export const addSection = async (section: Omit<Section, "id" | "order">) => {
  try {
    const existing = await getSectionsAsync();
    const nextOrder = existing.length > 0 ? Math.max(...existing.map(s => s.order)) + 1 : 0;

    const docRef = await addDoc(collection(db, "sections"), {
      ...section,
      order: nextOrder,
      isActive: true,
      isDeleted: false,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding section:", error);
    throw error;
  }
};

// ✅ Update Section
export const updateSection = async (id: string, section: Partial<Section>) => {
  try {
    const docRef = doc(db, "sections", id);
    await updateDoc(docRef, {
      ...section,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating section:", error);
    throw error;
  }
};

// ✅ Delete Section (Soft delete to prevent breaking frontend query states)
export const deleteSection = async (id: string) => {
  try {
    const docRef = doc(db, "sections", id);
    await updateDoc(docRef, { 
      isDeleted: true, 
      updatedAt: serverTimestamp() 
    });
  } catch (error) {
    console.error("Error soft deleting section:", error);
    throw error;
  }
};

// ✅ Update Sections Order
export const updateSectionsOrder = async (orderedIds: string[]) => {
  try {
    const batch = writeBatch(db);
    orderedIds.forEach((id, index) => {
      const docRef = doc(db, "sections", id);
      batch.update(docRef, { order: index });
    });
    await batch.commit();
    console.log("✅ Sections order updated successfully");
  } catch (error) {
    console.error("Error updating sections order:", error);
    throw error;
  }
};
