import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});
const db = getFirestore(app);

async function run() {
  const d = new Date();
  const ds = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  
  const s = await getDocs(collection(db, 'analytics', ds, 'visits'));
  const actualCount = s.docs.length;
  
  await setDoc(doc(db, 'analytics', ds), { count: actualCount }, { merge: true });
  console.log('Fixed today count to:', actualCount);
  process.exit(0);
}
run();
