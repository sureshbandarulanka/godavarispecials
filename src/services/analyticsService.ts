import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc, increment, collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';

export const logVisitDetails = async (user: any | null) => {
  try {
    if (typeof window === 'undefined') return;
    
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const visitKey = `visit_logged_${user ? user.uid : 'guest'}_${dateStr}`;
    if (localStorage.getItem(visitKey)) return;

    let deviceType = 'Desktop';
    const ua = navigator.userAgent;
    if (/Mobi|Android/i.test(ua)) deviceType = 'Mobile';
    else if (/Tablet|iPad/i.test(ua)) deviceType = 'Tablet';

    const visitData = {
      timestamp: today,
      type: user ? 'User' : 'Guest',
      userId: user?.uid || null,
      name: user?.displayName || user?.name || null,
      email: user?.email || null,
      phone: user?.phone || user?.phoneNumber || null,
      userAgent: navigator.userAgent,
      device: deviceType,
      url: window.location.href
    };

    const visitRef = doc(db, 'analytics', dateStr);
    
    await setDoc(visitRef, {
      count: increment(1),
      date: dateStr,
      timestamp: today
    }, { merge: true });

    const visitsCol = collection(db, 'analytics', dateStr, 'visits');
    await addDoc(visitsCol, visitData);

    localStorage.setItem(visitKey, 'true');
    
  } catch (error) {
    console.error('Failed to log visit details:', error);
  }
};

export const getTodayVisits = async (): Promise<number> => {
  try {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const visitRef = doc(db, 'analytics', dateStr);
    const docSnap = await getDoc(visitRef);
    
    if (docSnap.exists()) {
      return docSnap.data().count || 0;
    }
    return 0;
  } catch (error) {
    console.error('Failed to get today visits:', error);
    return 0;
  }
};

export const getTodayVisitDetails = async () => {
  try {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    
    const visitsCol = collection(db, 'analytics', dateStr, 'visits');
    const q = query(visitsCol, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Failed to get detailed visits:', error);
    return [];
  }
};
