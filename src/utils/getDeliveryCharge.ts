/**
 * Determines the estimated delivery charge based on distance and total weight.
 * 
 * @param distance Distance in kilometers
 * @param totalWeightKg Total cart weight in kilograms
 * @returns Delivery charge as a numeric value
 */
export const getDeliveryCharge = (distance: number, totalWeightKg: number = 0): number => {
  let baseCharge = 0;

  if (distance <= 10) baseCharge = 0;
  else if (distance <= 30) baseCharge = 40;
  else if (distance <= 100) baseCharge = 70;
  else baseCharge = 110;

  let weightCharge = 0;

  if (totalWeightKg > 5) {
    // ₹20 for every 5kg above 5kg
    weightCharge = Math.ceil((totalWeightKg - 5) / 5) * 20;
  }

  // Max Cap is ₹199
  return Math.min(baseCharge + weightCharge, 199);
};
