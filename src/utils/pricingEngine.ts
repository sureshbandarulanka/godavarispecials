/**
 * Pure Admin Pricing Engine
 * Displays exactly what is entered in the Admin Panel / Database.
 */

/**
 * Gets the final display price for a product variant.
 * If an active offer exists, applies the discount percent.
 */
export function getDisplayPrice(variant: any, activeOffer?: any) {
  const basePrice = getBasePrice(variant);
  if (basePrice === null) return null;

  if (activeOffer && activeOffer.isActive && activeOffer.discountPercent > 0) {
    const discounted = basePrice - (basePrice * activeOffer.discountPercent) / 100;
    return Math.round(discounted);
  }

  return Math.round(basePrice);
}

/**
 * Gets the raw base selling price from the variant.
 */
export function getBasePrice(variant: any) {
  if (!variant) return null;

  // Raw Price from Admin Panel (Selling Price)
  const price = Number(variant.price || variant.cost || 0);

  if (!price || price <= 0) {
    console.error("Invalid pricing data:", variant);
    return null;
  }

  return price;
}

/**
 * Combo Discount Logic (Marketing Feature)
 */
export function calculateComboDiscount(qty: number) {
  if (qty >= 4) return 40;
  if (qty === 3) return 20;
  if (qty === 2) return 10;
  return 0;
}
