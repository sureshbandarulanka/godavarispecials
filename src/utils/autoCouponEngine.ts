import { Coupon, validateCoupon, calculateDiscount } from './couponEngine';

/**
 * Filter all active, non-expired coupons that meet the basic criteria.
 */
export function getEligibleCoupons(
  coupons: Coupon[], 
  userUsedCoupons: string[] = [], 
  cartTotal: number,
  totalOrders: number = 0
): Coupon[] {
  return coupons.filter(coupon => {
    // Basic validation check (isActive, expiry, minOrder, userType)
    const error = validateCoupon(coupon, userUsedCoupons, cartTotal, totalOrders);
    return error === null;
  });
}

/**
 * Picks the absolute BEST coupon from a list of eligible ones.
 * Primary Sort: Actual Savings (₹ value)
 * Secondary Sort: Admin Priority
 * Tertiary Sort: Closest Expiry
 */
export function getBestCoupon(
  eligibleCoupons: Coupon[], 
  cartTotal: number
): { coupon: Coupon; savings: number } | null {
  if (eligibleCoupons.length === 0) return null;

  // Calculate savings for each and attach for sorting
  const couponsWithSavings = eligibleCoupons.map(coupon => ({
    coupon,
    savings: calculateDiscount(coupon, cartTotal)
  }));

  // Sort by Savings (Desc), then Priority (Desc), then Expiry (Asc)
  const sorted = couponsWithSavings.sort((a, b) => {
    if (b.savings !== a.savings) {
      return b.savings - a.savings; // Highest savings first
    }
    
    if (b.coupon.priority !== a.coupon.priority) {
      return b.coupon.priority - a.coupon.priority; // Highest priority first
    }

    const expiryA = a.coupon.expiryDate?.toDate ? a.coupon.expiryDate.toDate().getTime() : new Date(a.coupon.expiryDate).getTime();
    const expiryB = b.coupon.expiryDate?.toDate ? b.coupon.expiryDate.toDate().getTime() : new Date(b.coupon.expiryDate).getTime();
    
    return expiryA - expiryB; // Expiring soonest first
  });

  return sorted[0];
}

/**
 * Master function for the Smart Auto-Apply system.
 */
export function autoApplyCoupon(
  coupons: Coupon[], 
  userUsedCoupons: string[] = [], 
  cartTotal: number,
  totalOrders: number = 0
): { coupon: Coupon; discount: number; isAuto: boolean } | null {
  const eligible = getEligibleCoupons(coupons, userUsedCoupons, cartTotal, totalOrders);
  const bestResult = getBestCoupon(eligible, cartTotal);

  if (!bestResult) return null;

  return {
    coupon: bestResult.coupon,
    discount: bestResult.savings,
    isAuto: bestResult.coupon.autoApply
  };
}
