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
  order?: number;
  types?: string[]; // Custom filters for this category
  createdAt?: any;
}

interface CategoryContextType {
  categories: Category[];
  loading: boolean;
  error: Error | null;
  setCategories: (categories: Category[]) => void;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const CategoryProvider = ({ 
  children, 
  initialCategories = [] 
}: { 
  children: React.ReactNode, 
  initialCategories?: Category[] 
}) => {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [loading, setLoading] = useState(initialCategories.length === 0);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Listen to changes in the "categories" collection
    // We order by name as a fallback because orderBy filters out docs missing the field
    const q = query(collection(db, "categories"), orderBy("name", "asc"));
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const catList: Category[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        } as Category));
        
        // Custom sort to prioritize 'order' field
        catList.sort((a, b) => {
          if (a.order !== undefined && b.order !== undefined) {
            return a.order - b.order;
          }
          if (a.order !== undefined) return -1;
          if (b.order !== undefined) return 1;
          return a.name.localeCompare(b.name);
        });

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
    <CategoryContext.Provider value={{ categories, loading, error, setCategories }}>
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
