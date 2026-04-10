import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";
import * as fs from 'fs';
import * as path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8');
  envFile.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      const key = match[1];
      let value = match[2] || '';
      if (value.length > 0 && value.charAt(0) === '"' && value.charAt(value.length - 1) === '"') {
        value = value.replace(/\\n/gm, '\n');
      }
      value = value.replace(/(^['"]|['"]$)/g, '').trim();
      process.env[key] = value;
    }
  });
}

// Ensure firebase config matches your project format
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const seedCategories = async () => {
  const existingDocs = await getDocs(collection(db, "categories"));
  if (!existingDocs.empty) {
    console.log("Categories already exist. Aborting seed.");
    return;
  }

  const defaultCategories = [
    { name: "Pickles", slug: "pickles", tag: "Veg & Non-Veg", imageUrl: "" },
    { name: "Sweets", slug: "sweets", imageUrl: "" },
    { name: "Spices", slug: "spices", imageUrl: "" },
    { name: "Authentic Podis", slug: "authentic-podis", tag: "Veg & Non-Veg", imageUrl: "" },
    { name: "Vadiyalu", slug: "vadiyalu", imageUrl: "" },
    { name: "Dry Fish", slug: "dry-fish", imageUrl: "" },
    { name: "Ghee & Oils", slug: "ghee-oils", tag: "Ghee & Oils", imageUrl: "" },
    { name: "Dry Fruits", slug: "dry-fruits", imageUrl: "" },
    { name: "Honey", slug: "honey", tag: "Fresh & Organic", imageUrl: "" },
    { name: "Araku Coffee", slug: "araku-coffee", imageUrl: "" },
  ];

  console.log("Seeding default categories...");
  for (const cat of defaultCategories) {
    await addDoc(collection(db, "categories"), cat);
  }
  console.log("Seeding complete!");
};

seedCategories().catch(console.error);
