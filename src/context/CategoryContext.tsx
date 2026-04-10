"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { collection, onSnapshot, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string;
  tag?: string;
  createdAt?: any;
}

interface CategoryContextType {
  categories: Category[];
  loading: boolean;
  error: Error | null;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const CategoryProvider = ({ children }: { children: React.ReactNode }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Listen to changes in the "categories" collection
    const q = query(collection(db, "categories"), orderBy("name", "asc"));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const catList: Category[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        } as Category));
        setCategories(catList);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching categories:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <CategoryContext.Provider value={{ categories, loading, error }}>
      {children}
    </CategoryContext.Provider>
  );
};

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error("useCategories must be used within a CategoryProvider");
  }
  return context;
};
