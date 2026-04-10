"use client";
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { deliveryZones } from '@/config/deliveryZones';
import { getDistanceKm, getShippingRule, ShippingRule } from '@/utils/shippingEngine';

interface LocationData {
  city: string;
  area?: string;
  state?: string;
  pincode?: string;
  country: string;
  source: 'auto' | 'manual';
  isServiceable: boolean;
  lat?: number | null; // For historical compatibility
  lng?: number | null;
  distanceKm?: number;
  shippingRule?: ShippingRule;
}

interface LocationContextType {
  location: LocationData;
  isDetecting: boolean;
  /** True after localStorage has been read on the client. False during SSR. */
  isHydrated: boolean;
  distanceKm: number;
  shippingRule: ShippingRule | null;
  updateLocation: (data: Partial<LocationData>) => void;
  detectLocation: () => Promise<void>;
}

const DEFAULT_LOCATION: LocationData = {
  city: "Hyderabad",
  state: "Telangana",
  country: "India",
  source: 'auto',
  isServiceable: true,
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<LocationData>(DEFAULT_LOCATION);
  const [distanceKm, setDistanceKm] = useState<number>(0);
  const [shippingRule, setShippingRule] = useState<ShippingRule | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  // isHydrated: false during SSR, true once localStorage has been read
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount (client-only)
  useEffect(() => {
    const saved = localStorage.getItem('userLocation');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const city = parsed.city || "Hyderabad";
        const country = parsed.country || "India";
        setLocation({
          ...parsed,
          city,
          country,
          isServiceable: country === "India"
        });
      } catch (e) {
        detectLocation();
      }
    } else {
      detectLocation();
    }
    // Signal that client-side hydration is complete
    setIsHydrated(true);
  }, []);

  const updateLocation = (data: Partial<LocationData>) => {
    const city = data.city || location.city;
    const country = data.country || location.country || "India";
    const newLocation: LocationData = { 
      ...location, 
      ...data, 
      city,
      country,
      isServiceable: country === "India"
    };
    setLocation(newLocation);
    localStorage.setItem('userLocation', JSON.stringify(newLocation));
  };

  // 🚚 Sync Shipping Rule and Distance
  useEffect(() => {
    const syncShipping = async () => {
      if (!isHydrated) return; // Wait for hydration before expensive/external calls
      
      if (location) {
        const dist = await getDistanceKm({
          lat: location.lat,
          lng: location.lng,
          pincode: location.pincode,
          city: location.city
        });
        const rule = getShippingRule(dist);
        setDistanceKm(dist);
        setShippingRule(rule);
      }
    };
    syncShipping();
  }, [location.lat, location.lng, location.pincode, location.city, isHydrated]);

  const detectLocation = async () => {
    setIsDetecting(true);
    try {
      // SILENT DETECTION (IP-BASED)
      const res = await fetch('https://ipapi.co/json/');
      const data = await res.json();
      
      if (data.city) {
        const country = data.country_name || "India";
        updateLocation({
          city: data.city,
          state: data.region,
          country: country,
          source: 'auto',
          isServiceable: country === "India"
        });
      }
    } catch (error) {
      console.error('Silent location detection failed:', error);
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <LocationContext.Provider value={{ 
      location, 
      isDetecting,
      isHydrated,
      distanceKm,
      shippingRule,
      updateLocation, 
      detectLocation 
    }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
