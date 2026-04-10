"use client";
import React, { useState, useEffect, useRef } from 'react';
import styles from './LocationModal.module.css';
import { useLocation } from '@/context/LocationContext';
import { Search, MapPin, X, Loader2, MessageCircle, Target } from 'lucide-react';
import { useJsApiLoader } from '@react-google-maps/api';

const LIBRARIES: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

export default function LocationModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { location, updateLocation } = useLocation();
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: LIBRARIES
  });

  const autocompleteService = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesService = useRef<google.maps.places.PlacesService | null>(null);
  const placesAttributionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoaded && !autocompleteService.current) {
      autocompleteService.current = new google.maps.places.AutocompleteService();
    }
  }, [isLoaded]);

  // Lazy initialize PlacesService when the hidden div is ready
  useEffect(() => {
    if (isLoaded && !placesService.current && placesAttributionRef.current) {
      console.log('✅ PlacesService Initialized');
      placesService.current = new google.maps.places.PlacesService(placesAttributionRef.current);
    }
  }, [isLoaded, placesAttributionRef.current]);

  // Handle Input Changes with Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue.length > 2) {
        handleSearch(inputValue);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue]);

  const handleSearch = async (value: string) => {
    // 1. PINCODE LOOKUP (6 Digits)
    if (/^[1-9][0-9]{5}$/.test(value)) {
      setIsSearching(true);
      try {
        const res = await fetch(`https://api.postalpincode.in/pincode/${value}`);
        const data = await res.json();
        
        if (data[0].Status === "Success") {
          const po = data[0].PostOffice[0];
          updateLocation({
            city: po.District,
            area: po.Name,
            state: po.State,
            pincode: value,
            country: "India",
            isServiceable: true,
            source: 'manual'
          });
          onClose();
          setInputValue("");
        } else {
          setError("❌ Invalid Indian Pincode");
        }
      } catch (err) {
        setError("❌ Pincode lookup failed");
      } finally {
        setIsSearching(false);
      }
      return;
    }

    // 2. GOOGLE AUTOCOMPLETE (India Restricted)
    if (autocompleteService.current && value.length > 2) {
      setIsSearching(true);
      autocompleteService.current.getPlacePredictions(
        {
          input: value,
          componentRestrictions: { country: "in" },
          types: ["(cities)"]
        },
        (predictions, status) => {
          setIsSearching(false);
          if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
            setSuggestions(predictions);
          } else {
            setSuggestions([]);
          }
        }
      );
    }
  };

  const handleSelectSuggestion = (suggestion: google.maps.places.AutocompletePrediction) => {
    console.log('📍 SELECTING SUGGESTION:', suggestion.description, 'ID:', suggestion.place_id);
    
    if (!placesService.current) {
      console.warn('⚠️ PlacesService not initialized, using fallback');
      updateLocation({
        city: suggestion.structured_formatting.main_text,
        state: suggestion.structured_formatting.secondary_text,
        country: "India",
        isServiceable: true,
        source: 'manual'
      });
      onClose();
      return;
    }

    setIsSearching(true);
    placesService.current.getDetails(
      { 
        placeId: suggestion.place_id,
        fields: ['geometry', 'address_components']
      },
      (place, status) => {
        setIsSearching(false);
        console.log('📍 PlaceDetails status:', status, 'Place:', place);

        if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          console.log('✅ FOUND COORDS:', lat, lng);
          
          let state = "";
          place.address_components?.forEach(comp => {
            if (comp.types.includes("administrative_area_level_1")) {
              state = comp.long_name;
            }
          });

          updateLocation({
            city: suggestion.structured_formatting.main_text,
            state: state || suggestion.structured_formatting.secondary_text,
            lat,
            lng,
            pincode: undefined, // Clear stale pincode
            country: "India",
            isServiceable: true,
            source: 'manual'
          });
          onClose();
          setInputValue("");
          setSuggestions([]);
        } else {
          console.error('❌ PlaceDetails FAILED or no geometry. Status:', status);
          updateLocation({
            city: suggestion.structured_formatting.main_text,
            state: suggestion.structured_formatting.secondary_text,
            lat: null, // Clear stale coordinates
            lng: null,
            pincode: undefined, // Clear stale pincode
            country: "India",
            isServiceable: true,
            source: 'manual'
          });
          onClose();
        }
      }
    );
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError("❌ Geolocation is not supported by your browser");
      return;
    }

    setIsDetectingLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        
        if (!isLoaded) {
          setError("⚠️ Maps API not loaded yet. Please try again.");
          setIsDetectingLocation(false);
          return;
        }

        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          setIsDetectingLocation(false);
          
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
            onClose();
          } else {
            setError("❌ Could not determine address from your location");
          }
        });
      },
      (err) => {
        setIsDetectingLocation(false);
        if (err.code === 1) {
          setError("❌ Location permission denied");
        } else {
          setError("❌ Failed to detect location");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleWhatsAppEnquiry = () => {
    const message = `Hi, I need international delivery for Godavari Specials to ${inputValue || location.city}`;
    window.open(`https://wa.me/919491559901?text=${encodeURIComponent(message)}`, "_blank");
  };

  if (!isOpen) return null;

  return (
    <div className={`${styles.overlay} location-modal-align-bottom`} onClick={onClose}>
      <div className={`${styles.modal} location-modal-mobile-compact`} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.titleArea}>
            <MapPin size={20} className={styles.titleIcon} />
            <h3>Select Delivery Location</h3>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.body}>
          <div className={styles.searchContainer}>
            <div className={styles.searchWrapper}>
              {isSearching ? <Loader2 className={styles.loaderIcon} size={18} /> : <Search className={styles.searchIcon} size={18} />}
              <input 
                type="text" 
                className={styles.cityInput}
                placeholder="Enter City or Pincode (e.g. 500081)"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                autoFocus
              />
            </div>

            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <div className={styles.suggestionsList}>
                {suggestions.map((s) => (
                  <div 
                    key={s.place_id} 
                    className={styles.suggestionItem}
                    onClick={() => handleSelectSuggestion(s)}
                  >
                    <MapPin size={16} />
                    <div className={styles.suggestionText}>
                      <span className={styles.mainText}>{s.structured_formatting.main_text}</span>
                      <span className={styles.subText}>{s.structured_formatting.secondary_text}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {error && <div className={styles.errorMsg}>{error}</div>}

          <div className={styles.indiaInfo}>
            <span className={styles.deliveryBadge}>🚚 PAN INDIA</span>
            <p>We deliver across India — Fast & Reliable Shipping</p>
          </div>

          {/* Always Visible WhatsApp CTA */}
          <div className={styles.internationalCTA}>
            <div className={styles.ctaHeader}>
              <MessageCircle size={18} />
              <span>Need International Delivery?</span>
            </div>
            <p className={styles.ctaSubtext}>We ship worldwide! Chat with us for global rates.</p>
            <button className={styles.whatsappBtn} onClick={handleWhatsAppEnquiry}>
              Chat on WhatsApp
            </button>
          </div>
          
          {/* Attribution div for Google Places */}
          <div ref={placesAttributionRef} style={{ display: 'none' }} />

          <div className={styles.popularSection}>
            <span className={styles.sectionLabel}>Popular Cities</span>
            <div className={styles.cityGrid}>
              {[
                { name: "Hyderabad", lat: 17.3850, lng: 78.4867, state: "Telangana" },
                { name: "Rajahmundry", lat: 17.0005, lng: 81.7835, state: "Andhra Pradesh" },
                { name: "Chennai", lat: 13.0827, lng: 80.2707, state: "Tamil Nadu" },
                { name: "Mumbai", lat: 19.0760, lng: 72.8777, state: "Maharashtra" },
                { name: "Bangalore", lat: 12.9716, lng: 77.5946, state: "Karnataka" },
                { name: "Pune", lat: 18.5204, lng: 73.8567, state: "Maharashtra" }
              ].map(city => (
                <button 
                  key={city.name} 
                  className={styles.cityChip}
                  onClick={() => {
                    updateLocation({ 
                      city: city.name, 
                      state: city.state,
                      lat: city.lat, 
                      lng: city.lng,
                      pincode: undefined, // Clear stale pincode
                      country: "India", 
                      isServiceable: true, 
                      source: 'manual' 
                    });
                    onClose();
                  }}
                >
                  {city.name}
                </button>
              ))}
            </div>

            <button 
              className={`${styles.detectButton} ${isDetectingLocation ? styles.loading : ''}`}
              onClick={handleDetectLocation}
              disabled={isDetectingLocation}
            >
              {isDetectingLocation ? (
                <>
                  <Loader2 className={styles.detectLoader} size={18} />
                  <span>Detecting your location...</span>
                </>
              ) : (
                <>
                  <Target className={styles.detectIcon} size={18} />
                  <span>Use Current Location</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
