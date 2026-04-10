import { db } from "@/lib/firebase";
import { collection, doc, setDoc } from "firebase/firestore";
import { products, CATEGORIES } from "@/data/products";

const seedFirebase = async () => {
  try {
    console.log("🚀 Uploading categories...");

    // 👉 Upload Categories
    for (const category of CATEGORIES) {
      const slug = category
        .toLowerCase()
        .replace(/ & /g, "-")
        .replace(/\s+/g, "-");

      await setDoc(doc(db, "categories", slug), {
        name: category,
        slug: slug,
      });
    }

    console.log("✅ Categories uploaded");

    console.log("🚀 Uploading products...");

    // 👉 Upload Products
    for (const product of products) {
      const {
        id,
        name,
        category,
        type,
        description,
        image,
        variants,
      } = product;

      const cleanData = {
        name: name || "",
        category: category || "",
        type: type || null,
        description: description || "",
        image: image || "", // 🔥 IMPORTANT FIX
        variants: variants || [],
      };

      await setDoc(doc(db, "products", id.toString()), cleanData);
    }

    console.log("✅ Products uploaded");
    console.log("🎉 Upload complete!");
  } catch (error) {
    console.error("❌ Error seeding Firebase:", error);
  }
};

seedFirebase();