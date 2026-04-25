import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const app = initializeApp({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});
const db = getFirestore(app);

async function run() {
  const d = new Date();
  const ds = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  
  const visitsDoc = await getDoc(doc(db, 'analytics', ds));
  console.log('Today visits count:', visitsDoc.data());

  const s = await getDocs(collection(db, 'analytics', ds, 'visits'));
  console.log('Detailed visits:', s.docs.map(x => x.data()));
  process.exit(0);
}
run();
