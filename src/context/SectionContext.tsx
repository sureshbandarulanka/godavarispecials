"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { subscribeToSections, seedDefaultSections, Section } from "@/services/sectionService";

interface SectionContextType {
  sections: Section[];
  loading: boolean;
  error: Error | null;
  setSections: (sections: Section[]) => void;
  refreshSections: () => Promise<void>;
}

const SectionContext = createContext<SectionContextType | undefined>(undefined);

export const SectionProvider = ({ 
  children, 
  initialSections = [] 
}: { 
  children: React.ReactNode, 
  initialSections?: Section[] 
}) => {
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [loading, setLoading] = useState(initialSections.length === 0);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // 1. Subscribe to sections collection in real-time
    const unsubscribe = subscribeToSections(
      async (sectionList) => {
        // 2. If collection is empty, trigger seed logic
        if (sectionList.length === 0 && !loading) {
          try {
            setLoading(true);
            await seedDefaultSections();
          } catch (err) {
            console.error("Failed to auto-seed sections in context:", err);
          } finally {
            setLoading(false);
          }
        } else {
          setSections(sectionList);
          setLoading(false);
        }
      },
      (err) => {
        console.error("Error streaming sections in context:", err);
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const refreshSections = async () => {
    // Context is active and real-time, but we expose a manual refresh trigger
    // that triggers seeding just in case
    try {
      setLoading(true);
      await seedDefaultSections();
    } catch (err: any) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionContext.Provider value={{ sections, loading, error, setSections, refreshSections }}>
      {children}
    </SectionContext.Provider>
  );
};

export const useSections = () => {
  const context = useContext(SectionContext);
  if (context === undefined) {
    throw new Error("useSections must be used within a SectionProvider");
  }
  return context;
};
