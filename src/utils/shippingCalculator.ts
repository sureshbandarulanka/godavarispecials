/**
 * Internal Shipping Zone Cost Calculator
 * Used purely for internal cost calculations before margin mapping.
 * 
 * Rules:
 * Same City (Rajahmundry) -> ₹50
 * Same State (Andhra Pradesh/AP/Telangana roughly included below) -> ₹70
 * Other State -> ₹90 (maximum cap)
 */
export function calculateShipping(city: string, state?: string): number {
  if (!city) return 90; // Default max if unknown

  const normalizedCity = city.trim().toLowerCase();
  const normalizedState = state ? state.trim().toLowerCase() : "";

  // Same City Detection
  if (normalizedCity === "rajahmundry" || normalizedCity === "rjy") {
    return 50;
  }

  // Same State Detection (AP, TS are closest zones historically)
  const isSameState = 
    normalizedState.includes("andhra") || 
    normalizedState === "ap" ||
    normalizedState.includes("telangana") || 
    normalizedState === "ts";

  if (isSameState) {
    return 70;
  }

  // Other State
  return 90;
}
