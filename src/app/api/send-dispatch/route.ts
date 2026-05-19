import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { generateOrderPDF } from '@/utils/pdfGenerator';
import admin from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const { orderId: firebaseId, trackingId, courierName } = await req.json();

    if (!firebaseId) {
      return NextResponse.json({ success: false, error: "Order ID missing" }, { status: 400 });
    }

    // 1. Fetch Fresh Data from Firestore (Authority Check using Admin SDK)
    const orderSnap = await admin.firestore().collection('orders').doc(firebaseId).get();
    if (!orderSnap.exists) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }
    const order = { id: orderSnap.id, ...orderSnap.data() };

    const { orderId, items, address, total, paymentMethod } = order as any;

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    // Resolve Logo Path for CID Embedding (HTML Template)
    const logoRelPath = 'public/assets/logo.png';
    const logoAbsPath = path.join(process.cwd(), logoRelPath);
    const hasLogo = fs.existsSync(logoAbsPath);

    const sharedAttachments: any[] = [];
    if (hasLogo) {
      sharedAttachments.push({
        filename: 'logo.png',
        path: logoAbsPath,
        cid: 'logo-brand'
      });
    }

    // CUSTOMER EMAIL TEMPLATE
    let customerMailOptions = null;
    if (address.email && address.email.trim() !== "") {
      customerMailOptions = {
        from: `"Godavari Specials" <${process.env.EMAIL_USER}>`,
        to: address.email,
        subject: `Your Order is Dispatched 🚚 - Godavari Specials`,
        attachments: sharedAttachments,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #3472ba; padding: 25px; text-align: center;">
              ${hasLogo ? `<img src="cid:logo-brand" alt="Godavari Specials" style="max-width: 180px; height: auto; margin-bottom: 15px; display: block; margin: 0 auto;" />` : `<h2 style="color: white; margin: 0;">Godavari Specials</h2>`}
              <h1 style="color: white; margin: 0; font-size: 24px;">Order Dispatched!</h1>
            </div>
            <div style="padding: 24px; text-align: center;">
              <h2 style="color: #3472ba; margin-top: 0;">🚚 Your order is on the way!</h2>
              <p style="font-size: 16px;">Hello <b>${address.name}</b>,</p>
              <p>Your order <b>${orderId}</b> has been dispatched and is making its way to you.</p>
              
              <div style="margin: 30px 0; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background: #f8fafc; text-align: left;">
                <h3 style="margin-top: 0; color: #333;">Tracking Details</h3>
                <p style="margin: 8px 0; font-size: 16px;"><b>Courier:</b> ${courierName || 'Our Delivery Partner'}</p>
                <p style="margin: 8px 0; font-size: 16px;"><b>Tracking ID:</b> ${trackingId || 'N/A'}</p>
              </div>

              <p style="color: #666;">We will keep you updated on the delivery status.</p>
              
              <a href="https://wa.me/919491559901" style="display: inline-block; background-color: #25D366; color: white; padding: 12px 25px; text-decoration: none; border-radius: 30px; font-weight: bold; margin-top: 20px;">
                Chat with us on WhatsApp 💬
              </a>
            </div>
            <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 11px; color: #999;">
              You received this email because you placed an order at Godavari Specials.<br/>
              © 2026 Godavari Specials. All rights reserved.
            </div>
          </div>
        `
      };
    }

    // Send Email
    if (customerMailOptions) {
      await transporter.sendMail(customerMailOptions);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Email sending error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
