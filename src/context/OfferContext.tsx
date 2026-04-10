"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { subscribeToActiveOffers, Offer } from "@/services/offerService";

interface OfferContextType {
  activeOffers: Offer[];
  loading: boolean;
  getOfferForProduct: (productId: string) => Offer | undefined;
}

const OfferContext = createContext<OfferContextType | undefined>(undefined);

export const OfferProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeOffers, setActiveOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToActiveOffers(
      (offers) => {
        setActiveOffers(offers);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const getOfferForProduct = useCallback((productId: string) => {
    return activeOffers.find(o => o.productId === productId);
  }, [activeOffers]);

  return (
    <OfferContext.Provider value={{ activeOffers, loading, getOfferForProduct }}>
      {children}
    </OfferContext.Provider>
  );
};

export const useOffers = () => {
  const context = useContext(OfferContext);
  if (context === undefined) {
    throw new Error("useOffers must be used within an OfferProvider");
  }
  return context;
};
