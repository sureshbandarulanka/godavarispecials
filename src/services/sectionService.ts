import { db } from "@/lib/firebase";
import { 
  doc, 
  getDoc, 
  setDoc,
  getDocs,
  collection,
  serverTimestamp, 
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
  updatedAt?: any;
}

const CONFIG_DOC_ID = "_sections_config";

// ✅ Real-time Section Listener
export const subscribeToSections = (
  callback: (sections: Section[]) => void,
  onError?: (err: any) => void
): (() => void) => {
  const docRef = doc(db, "categories", CONFIG_DOC_ID);

  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        const sections = (data.sectionsList || []) as Section[];
        
        // Filter out deleted sections and sort by order
        const activeSections = sections
          .filter(s => !s.isDeleted)
          .sort((a, b) => a.order - b.order);
        callback(activeSections);
      } else {
        // If document doesn't exist, trigger callback with empty array so seed logic fires
        callback([]);
      }
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
    const docRef = doc(db, "categories", CONFIG_DOC_ID);
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      const sections = (data.sectionsList || []) as Section[];
      return sections
        .filter(s => !s.isDeleted)
        .sort((a, b) => a.order - b.order);
    }
    return [];
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
    
    // 1. Fetch categories to get automatic category sections
    const categorySnap = await getDocs(collection(db, "categories"));
    const categories = categorySnap.docs.map(d => ({
      id: d.id,
      ...d.data()
    })) as any[];

    const activeCategories = categories.filter(c => c.id !== CONFIG_DOC_ID && !c.isDeleted);

    // 2. Define our base dynamic sections
    const defaultSections: Section[] = [
      {
        id: "top-selling-specials",
        name: "Top Selling Specials",
        slug: "top-selling-specials",
        order: 0,
        type: "dynamic",
        isActive: true,
      },
      {
        id: "non-veg-pickles",
        name: "Non-Veg Pickles",
        slug: "non-veg-pickles",
        order: 1,
        type: "dynamic",
        isActive: true,
      },
      {
        id: "traditional-veg-pickles",
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
          id: cat.id || cat.slug || `sec_${Math.random().toString(36).substring(2, 9)}`,
          name: cat.name,
          slug: cat.slug,
          order: currentOrder++,
          type: "dynamic",
          isActive: true
        });
      }
    });

    // 4. Save to categories collection config doc
    const docRef = doc(db, "categories", CONFIG_DOC_ID);
    await setDoc(docRef, {
      sectionsList: defaultSections,
      isSystemConfig: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    console.log("✅ Successfully seeded default sections!");
  } catch (error) {
    console.error("❌ Failed to seed default sections:", error);
  }
};

// ✅ Add Section
export const addSection = async (section: Omit<Section, "id" | "order">) => {
  try {
    const docRef = doc(db, "categories", CONFIG_DOC_ID);
    const snapshot = await getDoc(docRef);
    
    let currentSections: Section[] = [];
    if (snapshot.exists()) {
      currentSections = (snapshot.data().sectionsList || []) as Section[];
    }

    const nextOrder = currentSections.length > 0 
      ? Math.max(...currentSections.map(s => s.order)) + 1 
      : 0;

    const newId = `sec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const newSection: Section = {
      ...section,
      id: newId,
      order: nextOrder,
      isActive: true,
      isDeleted: false,
      createdAt: new Date().toISOString()
    };

    currentSections.push(newSection);

    await setDoc(docRef, {
      sectionsList: currentSections,
      isSystemConfig: true,
      updatedAt: serverTimestamp()
    }, { merge: true });

    return newId;
  } catch (error) {
    console.error("Error adding section:", error);
    throw error;
  }
};

// ✅ Update Section
export const updateSection = async (id: string, updatedFields: Partial<Section>) => {
  try {
    const docRef = doc(db, "categories", CONFIG_DOC_ID);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      throw new Error("Sections configuration document does not exist");
    }

    const currentSections = (snapshot.data().sectionsList || []) as Section[];
    const updatedSections = currentSections.map((sec) => {
      if (sec.id === id) {
        return {
          ...sec,
          ...updatedFields,
          updatedAt: new Date().toISOString()
        };
      }
      return sec;
    });

    await setDoc(docRef, {
      sectionsList: updatedSections,
      isSystemConfig: true,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error("Error updating section:", error);
    throw error;
  }
};

// ✅ Delete Section (Soft delete to prevent breaking frontend query states)
export const deleteSection = async (id: string) => {
  try {
    await updateSection(id, { isDeleted: true });
  } catch (error) {
    console.error("Error soft deleting section:", error);
    throw error;
  }
};

// ✅ Update Sections Order
export const updateSectionsOrder = async (orderedIds: string[]) => {
  try {
    const docRef = doc(db, "categories", CONFIG_DOC_ID);
    const snapshot = await getDoc(docRef);
    
    if (!snapshot.exists()) {
      throw new Error("Sections configuration document does not exist");
    }

    const currentSections = (snapshot.data().sectionsList || []) as Section[];
    const updatedSections = currentSections.map((sec) => {
      const newOrder = orderedIds.indexOf(sec.id);
      if (newOrder !== -1) {
        return { ...sec, order: newOrder };
      }
      return sec;
    });

    await setDoc(docRef, {
      sectionsList: updatedSections,
      isSystemConfig: true,
      updatedAt: serverTimestamp()
    }, { merge: true });

    console.log("✅ Sections order updated successfully");
  } catch (error) {
    console.error("Error updating sections order:", error);
    throw error;
  }
};
