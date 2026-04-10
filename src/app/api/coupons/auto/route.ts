import { NextResponse } from 'next/server';
import { getActiveCoupons, getUserUsedCoupons, getUserTotalOrders } from '@/services/couponService';
import { autoApplyCoupon } from '@/utils/autoCouponEngine';

export async function POST(request: Request) {
  try {
    const { cartTotal, userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 });
    }

    // 1. Fetch All Active & Non-Expired Coupons
    const allActiveCoupons = await getActiveCoupons();
    
    // 2. Fetch User Data
    const [userUsedCoupons, totalOrders] = await Promise.all([
      getUserUsedCoupons(userId),
      getUserTotalOrders(userId)
    ]);

    // 3. Find the BEST eligible coupon
    const result = autoApplyCoupon(allActiveCoupons, userUsedCoupons, cartTotal, totalOrders);

    if (!result) {
      return NextResponse.json({ 
        success: true, 
        applied: false,
        message: "No eligible coupons found" 
      });
    }

    return NextResponse.json({
      success: true,
      applied: result.isAuto, // Only mark as applied if autoApply is true
      suggested: !result.isAuto, // If not auto, it's a suggestion
      discount: result.discount,
      coupon: {
        id: result.coupon.id,
        code: result.coupon.code,
        discountType: result.coupon.discountType,
        discountValue: result.coupon.discountValue,
        autoApply: result.coupon.autoApply
      }
    });

  } catch (error) {
    console.error("API Auto Coupon Error:", error);
    return NextResponse.json({ success: false, message: "Failed to find best coupon" }, { status: 500 });
  }
}
