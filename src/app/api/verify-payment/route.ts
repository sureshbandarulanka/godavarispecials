import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      return NextResponse.json(
        { error: "Razorpay secret is not configured" },
        { status: 500 }
      );
    }

    // Creating hmac object 
    const hmac = crypto.createHmac("sha256", secret);

    // Passing the data to be hashed
    hmac.update(razorpay_order_id + "|" + razorpay_payment_id);

    // Creating the hmac in the required format
    const generated_signature = hmac.digest("hex");

    if (generated_signature === razorpay_signature) {
      return NextResponse.json({ success: true, message: "Payment verified successfully" });
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid payment signature" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("❌ Payment Verification Error:", error);
    return NextResponse.json(
      { error: "Internal server error during verification" },
      { status: 500 }
    );
  }
}
