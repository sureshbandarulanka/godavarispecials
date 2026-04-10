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
    const order = await getOrderByIdAsync(firebaseId);
    if (!order) {
      return NextResponse.json({ success: false, error: "Order not found" }, { status: 404 });
    }

    const { orderId, items, address, total, paymentMethod } = order as any;

    // 2. Generate PDF on Server (Security Check)
    const { buffer, filename } = await generateOrderPDF(order, 'INVOICE');

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

    const itemsTableRows = items.map((item: any) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name} (${item.weight})</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${Number(item.price) * item.quantity}</td>
      </tr>
    `).join('');

    const fullAddress = [
      address.name,
      address.address1,
      address.address2,
      address.city,
      address.pincode
    ].filter(Boolean).join(', ');

    // Shared Attachments (Logo + Invoice)
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

    // 1. ADMIN EMAIL TEMPLATE
    const adminMailOptions = {
      from: `"Godavari Specials Order" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `New Order Received - ${orderId}`,
      attachments: sharedAttachments,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #2E7D32; padding: 25px; text-align: center;">
            ${hasLogo ? `<img src="cid:logo-brand" alt="Godavari Specials" style="max-width: 180px; height: auto; margin-bottom: 10px; display: block; margin: 0 auto;" />` : `<h2 style="color: white; margin: 0;">Godavari Specials</h2>`}
            <h1 style="color: white; margin: 0; font-size: 24px;">Order Notification</h1>
          </div>
          <div style="padding: 24px;">
            <h2 style="color: #2E7D32; margin-top: 0;">New Order Received 🚀</h2>
            <p style="margin-bottom: 20px;">A fresh order has been placed. Invoice is attached.</p>
            
            <div style="background: #f9f9f9; padding: 15px; border-radius: 6px; margin-bottom: 24px;">
              <h3 style="margin-top: 0; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 8px;">Customer Details</h3>
              <p style="margin: 8px 0;"><b>Name:</b> ${address.name}</p>
              <p style="margin: 8px 0;"><b>Phone:</b> ${address.phone}</p>
              <p style="margin: 8px 0;"><b>Address:</b> ${fullAddress}</p>
              <p style="margin: 8px 0;"><b>Payment:</b> ${paymentMethod.toUpperCase()}</p>
            </div>
          </div>
          <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; color: #888;">
            This is an automated notification from Godavari Specials Backend.
          </div>
        </div>
      `
    };

    // 2. CUSTOMER EMAIL TEMPLATE
    let customerMailOptions = null;
    if (address.email && address.email.trim() !== "") {
      customerMailOptions = {
        from: `"Godavari Specials" <${process.env.EMAIL_USER}>`,
        to: address.email,
        subject: `Order Confirmed 🎉 - Godavari Specials`,
        attachments: sharedAttachments,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #eee; border-radius: 8px; overflow: hidden;">
            <div style="background-color: #3472ba; padding: 25px; text-align: center;">
              ${hasLogo ? `<img src="cid:logo-brand" alt="Godavari Specials" style="max-width: 180px; height: auto; margin-bottom: 15px; display: block; margin: 0 auto;" />` : `<h2 style="color: white; margin: 0;">Godavari Specials</h2>`}
              <h1 style="color: white; margin: 0; font-size: 24px;">Order Confirmed!</h1>
            </div>
            <div style="padding: 24px; text-align: center;">
              <h2 style="color: #3472ba; margin-top: 0;">🎉 Order Confirmed!</h2>
              <p style="font-size: 16px;">Thank you for shopping with Godavari Specials, <b>${address.name}</b>.</p>
              <p>We've received your order <b>${orderId}</b> and it's being prepared for delivery 🚚.</p>
              <p>Your digital invoice has been attached to this email.</p>
              
              <div style="margin: 30px 0; padding: 20px; border: 1px dashed #3472ba; border-radius: 8px; background: #f0f7fd;">
                <h3 style="margin-top: 0; color: #3472ba;">Order Summary</h3>
                <div style="font-size: 18px; font-weight: bold;">Grand Total: ₹${total}</div>
              </div>

              <p style="color: #666;">Our delivery partner will reach out to you shortly at <b>${address.phone}</b>.</p>
              
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

    // Send Emails
    await transporter.sendMail(adminMailOptions);
    if (customerMailOptions) {
      await transporter.sendMail(customerMailOptions);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Email sending error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
