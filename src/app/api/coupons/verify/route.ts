import { NextResponse } from 'next/server';
import { getCouponByCode, getUserUsedCoupons } from '@/services/couponService';
import { validateCoupon, calculateDiscount } from '@/utils/couponEngine';

export async function POST(request: Request) {
  try {
    const { code, cartTotal, userId } = await request.json();

    if (!code) {
      return NextResponse.json({ success: false, message: "Coupon code is required" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID is required" }, { status: 400 });
    }

    // Fetch Coupon from DB
    const coupon = await getCouponByCode(code.toUpperCase());
    if (!coupon) {
      return NextResponse.json({ success: false, message: "Invalid coupon code" }, { status: 404 });
    }

    // Fetch User's history from DB
    const userUsedCoupons = await getUserUsedCoupons(userId);

    // Validate using Engine
    const validationError = validateCoupon(coupon, userUsedCoupons, cartTotal);
    if (validationError) {
      return NextResponse.json({ success: false, message: validationError }, { status: 400 });
    }

    // Calculate Discount
    const discount = calculateDiscount(coupon, cartTotal);

    return NextResponse.json({
      success: true,
      message: "Coupon applied successfully! 🎉",
      discount,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
      }
    });

  } catch (error) {
    console.error("API Apply Coupon Error:", error);
    return NextResponse.json({ success: false, message: "Failed to apply coupon. Please try again." }, { status: 500 });
  }
}
