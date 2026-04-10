/**
 * Determines the estimated delivery time based on distance.
 * 
 * @param distance Distance in kilometers
 * @returns Delivery time as a string
 */
export const getDeliveryTime = (distance: number): string => {
  if (distance <= 10) return "2 Hours Delivery";
  if (distance <= 30) return "Same Day Delivery";
  if (distance <= 100) return "1 Day Delivery";
  return "2-3 Days Delivery";
};
