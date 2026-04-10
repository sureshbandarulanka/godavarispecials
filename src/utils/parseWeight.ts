/**
 * Parses a weight string (e.g., "500g", "1kg", "250 Grams") 
 * and returns the numeric value in Kilograms.
 * 
 * @param weightStr The weight as a string
 * @returns Numeric weight in KG
 */
export const parseWeight = (weightStr: string): number => {
  if (!weightStr) return 0;
  
  const normalized = weightStr.toLowerCase().trim();
  const value = parseFloat(normalized);
  
  if (isNaN(value)) return 0;
  
  if (normalized.includes('kg')) {
    return value;
  }
  
  if (normalized.includes('g') || normalized.includes('grams')) {
    return value / 1000;
  }
  
  return value; // Default to kg if no units found
};
