import { db, storage } from "@/lib/firebase";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, serverTimestamp, query, orderBy, writeBatch, onSnapshot, arrayUnion, where, increment, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { products as localProducts, Product } from "@/data/products";
import { compressImage } from "@/utils/compressImage";
import { isActiveBySchedule } from "@/utils/isActiveBySchedule";

let firebaseProducts: Product[] = [];

// 🔥 Fetch from Firebase (kept for compatibility)
export const fetchFirebaseData = async () => {
  try {
    console.log("🔥 Fetching from Firebase...");

    const productSnap = await getDocs(collection(db, "products"));
    const products = productSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Product[];

    // 🔥 Filter by Schedule and Sort by CreatedAt (Latest First)
    firebaseProducts = products
      .filter(isActiveBySchedule)
      .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

    console.log("✅ Firebase products loaded");
  } catch (error) {
    console.log("❌ Using fallback data");
  }
};

// ✅ Real-time Products Subscription
export const subscribeToProducts = (
  callback: (products: Product[]) => void,
  onError?: () => void
): (() => void) => {
  const productsQuery = query(collection(db, "products"), orderBy("name", "asc"));

  return onSnapshot(
    productsQuery,
    (snapshot) => {
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];

      // 🔥 Filter by Schedule and Sort
      const activeProducts = products
        .filter(isActiveBySchedule)
        .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

      // Keep module-level cache in sync too
      firebaseProducts = activeProducts;
      callback(activeProducts);
    },
    (error) => {
      console.error("Real-time products listener error:", error);
      if (onError) onError();
    }
  );
};


// ✅ Get Products
export const getProducts = (): Product[] => {
  return firebaseProducts;
};

// 🔥 CATEGORY CRUD OPERATIONS

// ✅ Add Category
export const addCategory = async (category: { name: string, slug: string, imageUrl?: string, order?: number }) => {
  try {
    // If order is not provided, we should ideally put it at the end
    // But for simplicity, we'll let the context sorting handle it or 
    // the caller can provide it.
    const docRef = await addDoc(collection(db, "categories"), {
      ...category,
      createdAt: serverTimestamp()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding category:", error);
    throw error;
  }
};

// ✅ Update Category Order
export const updateCategoryOrder = async (orderedIds: string[]) => {
  try {
    const batch = writeBatch(db);
    orderedIds.forEach((id, index) => {
      const docRef = doc(db, "categories", id);
      batch.update(docRef, { order: index });
    });
    await batch.commit();
  } catch (error) {
    console.error("Error updating category order:", error);
    throw error;
  }
};

// ✅ Delete Category
export const deleteCategory = async (id: string) => {
  try {
    const docRef = doc(db, "categories", id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting category:", error);
    throw error;
  }
};

// 🔥 ORDER OPERATIONS

// ✅ Place Order
export const placeOrderAsync = async (order: any) => {
  try {
    const batch = writeBatch(db);
    
    // 1. Create Order Document
    const orderRef = doc(collection(db, "orders"));
    const orderData = {
      status: "Placed",
      ...order,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      statusHistory: [
        { status: "Placed", time: new Date().toISOString() }
      ]
    };
    batch.set(orderRef, orderData);

    // 2. Handle Coupon Logic (If applicable)
    if (order.pricing?.couponCode) {
      const couponCode = order.pricing.couponCode;
      
      // Re-fetch and Double-Validate on Backend
      const couponQuery = query(collection(db, "coupons"), where("code", "==", couponCode.toUpperCase()));
      const couponSnap = await getDocs(couponQuery);
      
      if (!couponSnap.empty) {
        const couponDoc = couponSnap.docs[0];
        const couponData = couponDoc.data() as any;
        
        // Final sanity check before incrementing
        if (couponData.isActive && couponData.usedCount < couponData.usageLimit) {
          batch.update(couponDoc.ref, {
            usedCount: increment(1)
          });
        }
      }

      // Update User's usedCoupons history and totalOrders
      if (order.userId) {
        const userRef = doc(db, "users", order.userId);
        batch.set(userRef, {
          usedCoupons: arrayUnion(couponCode.toUpperCase()),
          totalOrders: increment(1), // Increment total orders count
          lastOrderAt: serverTimestamp()
        }, { merge: true });
      }
    } else if (order.userId) {
      // Even without a coupon, increment total orders for targeting
      const userRef = doc(db, "users", order.userId);
      batch.set(userRef, {
        totalOrders: increment(1),
        lastOrderAt: serverTimestamp()
      }, { merge: true });
    }

    await batch.commit();
    return orderRef.id;
  } catch (error) {
    console.error("Error placing order:", error);
    throw error;
  }
};

// ✅ Log Failed Payment
export const logFailedPayment = async (data: any) => {
  try {
    await addDoc(collection(db, "failed_payments"), {
      ...data,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error logging failed payment:", error);
  }
};

// ✅ Get All Orders (Latest First)
export const getOrdersAsync = async () => {
  try {
    const ordersQuery = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(ordersQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};

// ✅ Get User Orders (Latest First)
export const getOrdersByUserAsync = async (userId: string) => {
  try {
    // 💡 Removing orderBy from query to avoid Firebase index requirement
    // We sort locally in the array instead.
    const ordersQuery = query(
      collection(db, "orders"), 
      where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(ordersQuery);
    const orders = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    // 🔥 Manual Sort (Latest First)
    return orders.sort((a, b) => {
      const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    throw error;
  }
};

// ✅ Get Single Order by ID
export const getOrderByIdAsync = async (orderId: string) => {
  try {
    const docRef = doc(db, "orders", orderId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error) {
    console.error("Error fetching order:", error);
    throw error;
  }
};

// ✅ Subscribe to Real-Time Order Updates
export const subscribeToOrder = (orderId: string, callback: (order: any) => void) => {
  const docRef = doc(db, "orders", orderId);
  return onSnapshot(docRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() });
    } else {
      callback(null);
    }
  });
};

// ✅ Update Order Status with History and Validation
export const updateOrderStatusAsync = async (
  orderId: string, 
  newStatus: string, 
  trackingData?: { courierName?: string; trackingId?: string }
) => {
  try {
    const docRef = doc(db, "orders", orderId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) throw new Error("Order not found");
    
    const currentOrder = docSnap.data();
    const currentStatus = currentOrder.status || "Placed";

    // 🚦 Transition Validation Logic (STRICT sequential flow)
    const ALLOWED_TRANSITIONS: Record<string, string[]> = {
      'Placed': ['Confirmed', 'Cancelled'],
      'Confirmed': ['Shipped', 'Cancelled'],
      'Shipped': ['Out for Delivery', 'Delivered', 'Cancelled'],
      'Out for Delivery': ['Delivered', 'Cancelled'],
      'Delivered': [],
      'Cancelled': []
    };

    if (!ALLOWED_TRANSITIONS[currentStatus]?.includes(newStatus)) {
      throw new Error(`Invalid transition from ${currentStatus} to ${newStatus}. Orders must follow the sequence: Placed → Confirmed → Shipped → Delivered.`);
    }

    // 🔴 Tracking Validation for "Shipped" status
    if (newStatus === 'Shipped') {
      if (!trackingData?.courierName || !trackingData?.trackingId) {
        throw new Error("Courier name and tracking ID are required to mark as Shipped.");
      }
      if (trackingData.trackingId.length < 8) {
        throw new Error("Invalid Tracking ID. Min 8 characters required.");
      }
    }

    const updateData: any = { 
      status: newStatus,
      updatedAt: serverTimestamp(),
      statusHistory: arrayUnion({
        status: newStatus,
        time: new Date().toISOString()
      })
    };

    // Store tracking data if provided
    if (trackingData?.courierName) updateData.courierName = trackingData.courierName;
    if (trackingData?.trackingId) updateData.trackingId = trackingData.trackingId;

    if (newStatus === 'Delivered') {
      updateData.deliveredAt = serverTimestamp();
      updateData.paymentStatus = 'Paid';
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error("Error updating order status:", error);
    throw error;
  }
};

// ✅ Find Order by custom Order ID (GS-XXXX)
export const findOrderAsync = async (orderId: string) => {
  try {
    const ordersQuery = query(collection(db, "orders"), where("orderId", "==", orderId));
    const querySnapshot = await getDocs(ordersQuery);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    }
    return null;
  } catch (error) {
    console.error("Error finding order:", error);
    throw error;
  }
};

// 🔥 STORE SETTINGS (FREE GIFT, etc.)
const SETTINGS_COLLECTION = "settings";
const STORE_CONFIG_DOC = "storeConfig";

export const getStoreSettings = async () => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, STORE_CONFIG_DOC);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return docSnap.data();
    }
    
    // Default fallback with multi-tier support
    return {
      isFreeGiftEnabled: false,
      offers: [
        { id: 'initial-1', threshold: 2000, giftName: "Premium Gift Pack" }
      ]
    };
  } catch (error) {
    console.error("Error fetching store settings:", error);
    return {
      isFreeGiftEnabled: false,
      offers: [
        { id: 'initial-1', threshold: 2000, giftName: "Premium Gift Pack" }
      ]
    };
  }
};

// 🔥 Real-time listener for store settings (auto-updates without page refresh)
export const subscribeToStoreSettings = (
  onUpdate: (settings: any) => void,
  onError?: () => void
) => {
  const docRef = doc(db, SETTINGS_COLLECTION, STORE_CONFIG_DOC);
  const unsubscribe = onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data());
      } else {
        onUpdate({ isFreeGiftEnabled: false, offers: [] });
      }
    },
    (error) => {
      console.error("Error subscribing to store settings:", error);
      if (onError) onError();
    }
  );
  return unsubscribe;
};


export const updateStoreSettings = async (settings: any) => {
  try {
    const docRef = doc(db, SETTINGS_COLLECTION, STORE_CONFIG_DOC);
    await setDoc(docRef, {
      ...settings,
      updatedAt: serverTimestamp()
    }, { merge: true });
    return true;
  } catch (error) {
    console.error("Error updating store settings:", error);
    throw error;
  }
};

// ✅ Check if Category is used by Products
export const isCategoryInUse = (categorySlug: string) => {
  const products = getProducts();
  return products.some(p => (p as any).categorySlug === categorySlug);
};

// ✅ Get Product by ID
export const getProductById = (id: string | number): Product | undefined => {
  return getProducts().find(p => p.id.toString() == id.toString());
};

// ✅ Get Products by Category
export const getProductsByCategory = (category: string) => {
  return getProducts().filter(p => p.category === category);
};

// ✅ Get Products by Category Slug
export const getProductsByCategorySlug = (slug: string) => {
  return getProducts().filter(p => (p as any).categorySlug === slug);
};

// 🔥 CRUD OPERATIONS

// ✅ Add Product
export const addProduct = async (product: any) => {
  try {
    const docRef = await addDoc(collection(db, "products"), product);
    return docRef.id;
  } catch (error) {
    console.error("Error adding product:", error);
    throw error;
  }
};

// ✅ Update Product
export const updateProduct = async (id: string, product: any) => {
  try {
    const docRef = doc(db, "products", id);
    await updateDoc(docRef, product);
  } catch (error) {
    console.error("Error updating product:", error);
    throw error;
  }
};

// ✅ Delete Product
export const deleteProduct = async (id: string) => {
  try {
    const docRef = doc(db, "products", id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error("Error deleting product:", error);
    throw error;
  }
};

// ✅ Bulk Delete Products
export const deleteProductsBulk = async (ids: string[]) => {
  try {
    const batch = writeBatch(db);
    ids.forEach(id => {
      const docRef = doc(db, "products", id);
      batch.delete(docRef);
    });
    await batch.commit();
    console.log(`✅ Bulk delete successful: ${ids.length} products`);
  } catch (error) {
    console.error("Error in bulk delete:", error);
    throw error;
  }
};

// ✅ Get Single Product by ID (Async for fresh data)
export const getProductByIdAsync = async (id: string): Promise<Product | null> => {
  try {
    const docRef = doc(db, "products", id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Product;
    }
    return null;
  } catch (error) {
    console.error("Error fetching product:", error);
    throw error;
  }
};

// ✅ Get Category by Slug (Async)
export const getCategoryBySlugAsync = async (slug: string) => {
  try {
    const q = query(collection(db, "categories"), where("slug", "==", slug));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as { id: string; name: string; slug: string; imageUrl?: string };
    }
    return null;
  } catch (error) {
    console.error("Error fetching category:", error);
    throw error;
  }
};

// ✅ Get All Categories (Async)
export const getCategoriesAsync = async () => {
  try {
    const categoriesQuery = query(collection(db, "categories"), orderBy("name", "asc"));
    const querySnapshot = await getDocs(categoriesQuery);
    const categories = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    // Apply the same custom sort as CategoryContext to prevent layout jumps
    return categories.sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      return a.name.localeCompare(b.name);
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }
};


// ✅ Get All Products Summary (Async for dropdowns)
export const getProductsAsync = async () => {
  try {
    const productsQuery = query(collection(db, "products"), orderBy("name", "asc"));
    const querySnapshot = await getDocs(productsQuery);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      name: doc.data().name,
      category: doc.data().category
    }));
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};

// 🔥 STORAGE OPERATIONS

// ✅ Upload Product Image (Automated Compression)
export const uploadProductImage = async (productId: string, file: File) => {
  try {
    // 1. Compress Image
    const compressedFile = await compressImage(file);
    
    // 2. Upload to Storage
    const uniqueName = `${Date.now()}-${compressedFile.name}`;
    const storageRef = ref(storage, `products/${productId}/${uniqueName}`);
    await uploadBytes(storageRef, compressedFile);
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading product image:", error);
    throw error;
  }
};

// ✅ Upload Category Icon
export const uploadCategoryIcon = async (slug: string, file: File): Promise<string> => {
  console.log("Starting uploadCategoryIcon for:", slug);
  try {
    // 1. Compress Image
    const compressedFile = await compressImage(file);

    const uniqueName = `${slug}-${Date.now()}-${compressedFile.name}`;
    const storageRef = ref(storage, `categories/icons/${uniqueName}`);

    // 2. Simple and reliable upload
    const snapshot = await uploadBytes(storageRef, compressedFile);
    
    // Get URL after upload
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Firebase simple upload error:", error);
    throw error;
  }
};