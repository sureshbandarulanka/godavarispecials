"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { subscribeToProducts } from "@/services/productService";
import { Product } from "@/data/products";

interface ProductContextType {
  products: Product[];
  loading: boolean;
  error: boolean;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider = ({ children }: { children: React.ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToProducts(
      (items) => {
        setProducts(items);
        setLoading(false);
      },
      () => {
        setError(true);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return (
    <ProductContext.Provider value={{ products, loading, error }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error("useProducts must be used within a ProductProvider");
  }
  return context;
};
