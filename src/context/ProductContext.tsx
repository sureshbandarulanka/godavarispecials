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

export const ProductProvider = ({ 
  children, 
  initialProducts = [] 
}: { 
  children: React.ReactNode, 
  initialProducts?: Product[] 
}) => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [loading, setLoading] = useState(initialProducts.length === 0);
  const [error, setError] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeToProducts(
      (items) => {
        // Only update if we have items to prevent flash
        if (items && items.length > 0) {
          setProducts(items);
        }
        setLoading(false);
      },
      () => {
        // Fallback to initial products if error occurs after mount
        if (products.length === 0) {
          setError(true);
        }
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
