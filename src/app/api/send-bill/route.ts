import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { generateOrderPDF } from '@/utils/pdfGenerator';
import { getOrderByIdAsync } from '@/services/productService';

export async function POST(req: NextRequest) {
  try {
    const { orderId: firebaseId } = await req.json();

    if (!firebaseId) {
      return NextResponse.json({ success: false, error: "Order ID missing" }, { status: 400 });
    }

    // 1. Fetch Fresh Data from Firestore (Authority Check)
    const order = await getOrderByIdAsync(firebaseId) as any;
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    // 2. Strict Status Validation for "Final Bill"
    if (order.status !== 'Delivered') {
      return NextResponse.json({ 
        success: false, 
        error: `Invalid status: Final bill can only be generated for 'Delivered' orders. Current status: ${order.status}` 
      }, { status: 400 });
    }

    const { orderId, address, total } = order;

    // 3. Generate "FINAL BILL" PDF on Server
    const { buffer, filename } = await generateOrderPDF(order, 'BILL');

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Resolve Logo Path for CID Embedding
    const logoRelPath = 'public/assets/logo.png';
    const logoAbsPath = path.join(process.cwd(), logoRelPath);
    const hasLogo = fs.existsSync(logoAbsPath);

    // Shared Attachments
    const sharedAttachments: any[] = [
      {
        filename: filename,
        content: buffer
      }
    ];

    if (hasLogo) {
      sharedAttachments.push({
        filename: 'logo.png',
        path: logoAbsPath,
        cid: 'logo-brand'
      });
    }

    // CUSTOMER EMAIL TEMPLATE (Delivery Confirmation)
    if (address.email && address.email.trim() !== "") {
      const mailOptions = {
        from: `"Godavari Specials" <${process.env.EMAIL_USER}>`,
        to: address.email,
        subject: `Order Delivered ✅ - Final Bill Attached`,
        attachments: sharedAttachments,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #2E7D32; padding: 25px; text-align: center;">
              ${hasLogo ? `<img src="cid:logo-brand" alt="Godavari Specials" style="max-width: 180px; height: auto; margin-bottom: 15px; display: block; margin: 0 auto;" />` : `<h2 style="color: white; margin: 0;">Godavari Specials</h2>`}
              <h1 style="color: white; margin: 0; font-size: 24px;">Delivered Successfully!</h1>
            </div>
            <div style="padding: 24px; text-align: center;">
              <h2 style="color: #2E7D32; margin-top: 0;">✅ Order Delivered!</h2>
              <p style="font-size: 16px;">Hi <b>${address.name}</b>, your order <b>${orderId}</b> has been delivered.</p>
              <p>We hope you enjoy our fresh homemade delicacies! Your final receipt/bill is attached to this email.</p>
              
              <div style="margin: 30px 0; padding: 20px; border: 1px solid #2E7D32; border-radius: 8px; background: #f0fdf4;">
                <h3 style="margin-top: 0; color: #2E7D32;">Payment Received</h3>
                <div style="font-size: 20px; font-weight: bold;">Amount Paid: ₹${total}</div>
                <p style="font-size: 12px; color: #15803d; margin-top: 5px;">Status: PAID</p>
              </div>

              <p style="color: #666;">If you have any feedback, we'd love to hear from you!</p>
              
              <a href="https://wa.me/919491559901" style="display: inline-block; background-color: #25D366; color: white; padding: 12px 25px; text-decoration: none; border-radius: 30px; font-weight: bold; margin-top: 20px;">
                WhatsApp Feedback 💬
              </a>
            </div>
            <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 11px; color: #999;">
              Thank you for trusting Godavari Specials.<br/>
              © 2026 Godavari Specials. All rights reserved.
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
    }

    return NextResponse.json({ success: true, message: "Delivery email sent with bill" });
  } catch (error: any) {
    console.error('Bill sending error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
