import { NextResponse } from "next/server";
import Razorpay from "razorpay";

export async function POST(request: Request) {
  try {
    const { amount, currency = "INR" } = await request.json();

    const key_id = process.env.RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret || key_id === 'your_live_key_id') {
      console.error("❌ Razorpay keys are missing or still using placeholders in .env.local");
      return NextResponse.json(
        { error: "Payment gateway is not configured. Please add valid Razorpay keys to .env.local." },
        { status: 500 }
      );
    }

    if (!amount) {
      return NextResponse.json(
        { error: "Amount is required" },
        { status: 400 }
      );
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    const options = {
      amount: Math.round(Number(amount) * 100), // convert to paisa
      currency,
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("❌ Razorpay Order Creation Error:", error);
    
    // Check for specific Razorpay error details
    const errorMessage = error.error?.description || error.message || "Failed to create order";
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
