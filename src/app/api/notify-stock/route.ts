import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, productName, productId } = body;

    console.log(`[STOCK NOTIFICATION] User ${email} requested notification for ${productName} (ID: ${productId})`);

    // Create transporter using SMTP details from .env
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    // Send email to Admin
    await transporter.sendMail({
      from: `"Godavari Specials" <${SMTP_USER}>`,
      to: ADMIN_EMAIL,
      subject: `📢 Out of Stock Request: ${productName}`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #3b82f6;">Product Restock Request</h2>
          <p><strong>Product:</strong> ${productName}</p>
          <p><strong>Customer Email:</strong> <a href="mailto:${email}">${email}</a></p>
          <br/>
          <p>A user requested notification when this product is back in stock.</p>
        </div>
      `,
    });

    return NextResponse.json({ message: 'Notification request received' }, { status: 200 });
  } catch (error) {
    console.error('Notify Error:', error);
    return NextResponse.json({ error: 'Failed to process request' }, { status: 500 });
  }
}

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = process.env.SMTP_PORT;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
