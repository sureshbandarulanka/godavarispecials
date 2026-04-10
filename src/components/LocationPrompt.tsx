"use client";

import React, { useState, useEffect } from 'react';
import styles from './LocationPrompt.module.css';
import { useLocation } from '@/context/LocationContext';
import { MapPin, X, Loader2, Navigation, Target } from 'lucide-react';
import { useJsApiLoader } from '@react-google-maps/api';

const LIBRARIES: ("places")[] = ["places"];

export default function LocationPrompt() {
  const { location, updateLocation } = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES
  });

  useEffect(() => {
    const checkStatus = async () => {
      // 1. Don't show if user already has a saved manual location or isn't using the default
      const savedLocation = localStorage.getItem('userLocation');
      if (savedLocation) {
        const parsed = JSON.parse(savedLocation);
        if (parsed.source === 'manual') return;
      }

      // 2. Don't show if dismissed in this session
      if (sessionStorage.getItem('location_prompt_dismissed')) return;

      // 3. Check browser permissions
      if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
        try {
          const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          
          if (result.state === 'granted') {
            // Already granted! Detect silently
            handleDetect();
          } else if (result.state === 'prompt') {
            // Need to ask - show the popup after a delay
            const timer = setTimeout(() => setIsVisible(true), 3000);
            return () => clearTimeout(timer);
          }
          // If 'denied', we don't show the prompt to respect their choice
        } catch (e) {
          // Fallback if permissions API not supported
          const timer = setTimeout(() => setIsVisible(true), 5000);
          return () => clearTimeout(timer);
        }
      }
    };

    checkStatus();
  }, []);

  const handleDetect = () => {
    if (!navigator.geolocation) return;

    setIsDetecting(true);
    
    // Ensure we are showing the popup if we're detecting and it was manual
    // If it's silent (granted), isVisible might be false, which is fine.

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        
        if (!isLoaded) {
          // If maps not loaded, we can't reverse geocode yet
          // In a real scenario, we might wait or use a fallback
          setIsDetecting(false);
          return;
        }

        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          setIsDetecting(false);
          
          if (status === "OK" && results?.[0]) {
            const result = results[0];
            let city = "";
            let state = "";
            let pincode = "";
            let area = "";

            result.address_components.forEach(comp => {
              if (comp.types.includes("locality") || comp.types.includes("administrative_area_level_2")) {
                if (!city) city = comp.long_name;
              }
              if (comp.types.includes("administrative_area_level_1")) {
                state = comp.long_name;
              }
              if (comp.types.includes("postal_code")) {
                pincode = comp.long_name;
              }
              if (comp.types.includes("sublocality") || comp.types.includes("neighborhood")) {
                area = comp.long_name;
              }
            });

            updateLocation({
              city: city || "Unknown City",
              area: area,
              state: state,
              pincode: pincode,
              lat,
              lng,
              country: "India",
              isServiceable: true,
              source: 'auto'
            });
            
            handleClose();
          }
        });
      },
      () => {
        setIsDetecting(false);
        // If they denied in the system prompt, close our UI
        handleClose();
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleManual = () => {
    // We'll trigger the global location modal search by simply closing this 
    // and letting the user click the header, OR we can try to find the modal trigger.
    // For now, let's just close this and set a flag.
    handleClose();
    // Dispatch a custom event to open the Location Modal if possible
    window.dispatchEvent(new CustomEvent('open-location-modal'));
  };

  const handleClose = () => {
    setIsHiding(true);
    sessionStorage.setItem('location_prompt_dismissed', 'true');
    setTimeout(() => {
      setIsVisible(false);
    }, 400);
  };

  if (!isVisible && !isDetecting) return null;

  return (
    <div className={`${styles.prompt} ${isHiding ? styles.hiding : ''}`}>
      <button className={styles.closeBtn} onClick={handleClose}>
        <X size={18} />
      </button>

      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <MapPin className={styles.icon} size={24} />
        </div>
        <div className={styles.content}>
          <h3 className={styles.title}>Delivery Location? 🚚</h3>
          <p className={styles.description}>
            Detect your location for accurate shipping rates and faster delivery estimates!
          </p>
        </div>
      </div>

      <div className={styles.actions}>
        <button 
          className={styles.btnDetect} 
          onClick={handleDetect}
          disabled={isDetecting}
        >
          {isDetecting ? (
            <Loader2 className={styles.loaderIcon} size={18} />
          ) : (
            <Target size={18} />
          )}
          {isDetecting ? 'Detecting...' : 'Use Precise GPS'}
        </button>
        <button className={styles.btnManual} onClick={handleManual} disabled={isDetecting}>
          Select City
        </button>
      </div>
    </div>
  );
}
