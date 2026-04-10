
/**
 * FINAL: Location-Based Shipping Engine (Stable & Scalable)
 */

export const ORIGIN = {
  lat: 17.0005,
  lng: 81.7835,
  pincode: "533101",
  city: "Rajamahendravaram"
};

export interface ShippingRule {
  min: number;
  max: number;
  shipping: number;
  minOrder: number;
  freeDelivery: number;
  eta: string;
}

export const SHIPPING_RULES: ShippingRule[] = [
  { min: 0, max: 20, shipping: 30, minOrder: 99, freeDelivery: 399, eta: "2 Hours" },
  { min: 20, max: 100, shipping: 80, minOrder: 199, freeDelivery: 499, eta: "1 Day" },
  { min: 100, max: 300, shipping: 90, minOrder: 199, freeDelivery: 499, eta: "1-2 Days" },
  { min: 300, max: 500, shipping: 130, minOrder: 249, freeDelivery: 749, eta: "3-4 Days" },
  { min: 500, max: 800, shipping: 200, minOrder: 249, freeDelivery: 999, eta: "4-5 Days" },
  { min: 800, max: 1000, shipping: 250, minOrder: 349, freeDelivery: 999, eta: "4-6 Days" },
  { min: 1000, max: 1500, shipping: 350, minOrder: 449, freeDelivery: 1199, eta: "4-6 Days" },
  { min: 1500, max: Infinity, shipping: 350, minOrder: 599, freeDelivery: 1499, eta: "5-6 Days" }
];

const DEFAULT_RULE: ShippingRule = {
  shipping: 99,
  minOrder: 199,
  freeDelivery: 499,
  eta: "3-5 Days",
  min: 0,
  max: 0
};

// 🏙️ Popular City Coordinate Map (For zero-API accuracy)
export const CITY_COORDINATES: Record<string, { lat: number, lng: number }> = {
  "hyderabad": { lat: 17.3850, lng: 78.4867 },
  "bangalore": { lat: 12.9716, lng: 77.5946 },
  "bengaluru": { lat: 12.9716, lng: 77.5946 },
  "mumbai": { lat: 19.0760, lng: 72.8777 },
  "bombay": { lat: 19.0760, lng: 72.8777 },
  "chennai": { lat: 13.0827, lng: 80.2707 },
  "madras": { lat: 13.0827, lng: 80.2707 },
  "delhi": { lat: 28.6139, lng: 77.2090 },
  "new delhi": { lat: 28.6139, lng: 77.2090 },
  "pune": { lat: 18.5204, lng: 73.8567 },
  "kolkata": { lat: 22.5726, lng: 88.3639 },
  "ahmedabad": { lat: 23.0225, lng: 72.5714 },
  "kochi": { lat: 9.9312, lng: 76.2673 },
  "kakinada": { lat: 16.9891, lng: 82.2475 },
  "visakhapatnam": { lat: 17.6868, lng: 83.2185 },
  "vizag": { lat: 17.6868, lng: 83.2185 },
  "vijayawada": { lat: 16.5062, lng: 80.6480 },
  "guntur": { lat: 16.3067, lng: 80.4365 },
  "nellore": { lat: 14.4426, lng: 79.9865 },
  "kurnool": { lat: 15.8281, lng: 78.0373 },
  "tirupati": { lat: 13.6285, lng: 79.4192 }
};

// 🚚 Courier Tracking Base URLs
export const COURIER_TRACKING_URLS: Record<string, string> = {
  "Delhivery": "https://www.delhivery.com/track/package/",
  "Xpressbees": "https://www.xpressbees.com/shipment-tracking?awb=",
  "DTDC": "https://www.dtdc.in/tracking/tracking_results.asp?strCnno=",
  "Ekart": "https://ekartlogistics.com/shipmenttrack/"
};

// Simple In-Memory Distance Cache (Key: Pincode)
const distanceCache = new Map<string, number>();

/**
 * Calculates the straight-line distance between two points using the Haversine formula.
 */
export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 1000; // Safe national fallback distance

  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Gets the distance in KM to a destination.
 */
export async function getDistanceKm(destination: { lat?: number | null, lng?: number | null, pincode?: string, city?: string }): Promise<number> {
  // 1. Check Specific Origin Cities (Always 0km)
  const cityName = (destination.city || "").toLowerCase();
  if (cityName.includes("rajahmundry") || cityName.includes("rajamahendravaram") || destination.pincode === "533101") {
    return 0;
  }

  // 2. Check Cache
  const cacheKey = destination.pincode || `${destination.city}-${destination.lat}-${destination.lng}`;
  if (distanceCache.has(cacheKey)) {
    return distanceCache.get(cacheKey)!;
  }

  let distanceKm = 1000; // DEFAULT National Fallback

  // 3. Try Coordinates (Haversine)
  if (destination.lat !== undefined && destination.lat !== null && destination.lng !== undefined && destination.lng !== null) {
    distanceKm = calculateHaversineDistance(ORIGIN.lat, ORIGIN.lng, destination.lat, destination.lng);
  } 
  // 4. Try Popular City Mapping (Normalize for better matching)
  else if (destination.city) {
    const searchName = destination.city.trim().toLowerCase();
    // Fuzzy matching: check if any of our keys are contained as a whole word or significant part
    const matchedKey = Object.keys(CITY_COORDINATES).find(key => {
      const regex = new RegExp(`\\b${key}\\b`, 'i');
      return regex.test(searchName) || searchName === key;
    });
    
    if (matchedKey) {
      const coords = CITY_COORDINATES[matchedKey];
      console.log('🎯 CITY MATCH FOUND:', matchedKey, coords);
      distanceKm = calculateHaversineDistance(ORIGIN.lat, ORIGIN.lng, coords.lat, coords.lng);
    }
  }

  // 5. Cache and Return
  distanceCache.set(cacheKey, distanceKm);
  return distanceKm;
}

/**
 * Returns the shipping rule based on the distance.
 */
export function getShippingRule(distanceKm: number): ShippingRule {
  if (isNaN(distanceKm)) return DEFAULT_RULE;
  const rule = SHIPPING_RULES.find(rule => distanceKm >= rule.min && distanceKm < rule.max);
  return rule || DEFAULT_RULE;
}

/**
 * Returns complete pricing/shipping details for a cart total and distance.
 */
export function getPricingDetails(cartTotal: number, distanceKm: number) {
  const rule = getShippingRule(distanceKm);
  
  let shipping = rule.shipping;

  // FREE DELIVERY Logic
  if (cartTotal >= rule.freeDelivery) {
    shipping = 0;
  }

  // FREE DELIVERY Logic
  if (cartTotal >= rule.freeDelivery) {
    shipping = 0;
  }

  return {
    shipping,
    minOrder: rule.minOrder,
    freeDelivery: rule.freeDelivery,
    eta: rule.eta,
    ruleName: `${rule.min}-${rule.max}km Rule`
  };
}

/**
 * Generates external tracking link
 */
export function getTrackingUrl(courier: string, trackingId: string): string | null {
  if (!courier || !trackingId || !COURIER_TRACKING_URLS[courier]) return null;
  return COURIER_TRACKING_URLS[courier] + trackingId;
}
