/**
 * Coupon Validation & Calculation Engine
 */

export interface Coupon {
  id?: string;
  code: string;
  discountType: 'flat' | 'percentage';
  discountValue: number;
  maxDiscount?: number;
  minOrderValue: number;
  usageLimit: number;
  usedCount: number;
  perUserLimit: number;
  expiryDate: any; // Firestore Timestamp
  isActive: boolean;
  createdAt?: any;
  
  // Smart Coupon Features
  autoApply: boolean;           // true → system auto applies
  priority: number;             // higher = more priority
  userType: 'all' | 'new' | 'repeat' | 'inactive';
  isStackable: boolean;         // false = prevent stacking
}

// Business Safety Rules
const MAX_ALLOWED_DISCOUNT_PERCENT = 25; // Never allow more than 25% of total
const MIN_PROFIT_THRESHOLD = 40;        // Minimum Profit per order (Simplified)

/**
 * Validates a coupon against a user and cart total.
 * Returns null if valid, or a string error message if invalid.
 */
export function validateCoupon(
  coupon: Coupon, 
  userUsedCoupons: string[] = [], 
  cartTotal: number,
  totalOrders: number = 0
): string | null {
  if (!coupon) return "Invalid coupon code";

  if (!coupon.isActive) return "This coupon is currently inactive";

  // Check Expiry
  const expiry = coupon.expiryDate?.toDate ? coupon.expiryDate.toDate() : new Date(coupon.expiryDate);
  if (new Date() > expiry) return "This coupon has expired";

  // Check Min Order Value
  if (cartTotal < coupon.minOrderValue) {
    return `Minimum order of ₹${coupon.minOrderValue} required for this coupon`;
  }

  // Check User Type Targeting
  if (coupon.userType === 'new' && totalOrders > 0) {
    return "This coupon is only for new users";
  }
  if (coupon.userType === 'repeat' && totalOrders < 1) {
    return "This coupon is only for existing customers";
  }

  // Check Global Usage Limit
  if (coupon.usedCount >= coupon.usageLimit) {
    return "This coupon has reached its maximum usage limit";
  }

  // Check Per-User Limit
  const userUsageCount = userUsedCoupons.filter(code => code === coupon.code).length;
  if (userUsageCount >= coupon.perUserLimit) {
    return "You have already used this coupon maximum number of times";
  }

  return null;
}

/**
 * Calculates the discount amount for a given coupon and cart total.
 * Includes business safety checks to prevent losses.
 */
export function calculateDiscount(coupon: Coupon, cartTotal: number): number {
  let discount = 0;

  if (coupon.discountType === 'flat') {
    discount = coupon.discountValue;
  } else if (coupon.discountType === 'percentage') {
    discount = (cartTotal * coupon.discountValue) / 100;
    if (coupon.maxDiscount && discount > coupon.maxDiscount) {
      discount = coupon.maxDiscount;
    }
  }

  // Business Safety: Never allow more than MAX_ALLOWED_DISCOUNT_PERCENT of total
  const maxSafeDiscount = (cartTotal * MAX_ALLOWED_DISCOUNT_PERCENT) / 100;
  discount = Math.min(discount, maxSafeDiscount);

  // Business Safety: Minimum cart value after discount should not lead to loss
  // For simplicity, we ensure discount doesn't leave the order at less than 50% of original value if it's very large
  if (cartTotal - discount < MIN_PROFIT_THRESHOLD) {
     discount = Math.max(0, cartTotal - MIN_PROFIT_THRESHOLD);
  }

  // Ensure discount doesn't exceed cart total
  return Math.min(Math.round(discount), cartTotal);
}
