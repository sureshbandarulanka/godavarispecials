"use client";
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ShippingPolicyPage() {
  return (
    <div className="pb-mobile-nav">
      <Header />
      <main className="container main-content policy-page-content" style={{ padding: '32px 16px 100px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '24px', color: 'var(--text-primary)' }}>
          SHIPPING POLICY
        </h1>
        
        <div style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <p>
            At Godavari Specials, we ensure that all our homemade food products are packed with care and delivered fresh to your doorstep.
          </p>

          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📍</span> Shipping Coverage
            </h3>
            <p>
              We currently deliver across India. Delivery availability may vary based on your location.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🚚</span> Shipping Charges
            </h3>
            <p>
              Shipping charges are calculated based on the delivery location and distance from our origin (Rajamahendravaram, Andhra Pradesh).
            </p>
            <p style={{ marginTop: '8px' }}>
              The exact shipping cost will be displayed at checkout before placing the order.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📦</span> Order Processing
            </h3>
            <ul style={{ listStyleType: 'disc', paddingLeft: '24px', margin: '0' }}>
              <li>Orders are processed immediately after confirmation.</li>
              <li>Since our products are freshly prepared, processing may take a short time before dispatch.</li>
            </ul>
          </div>

          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--brand-blue)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⏱</span> Delivery Time
            </h3>
            <p style={{ marginBottom: '12px' }}>Estimated delivery time depends on your location:</p>
            <ul style={{ listStyleType: 'disc', paddingLeft: '24px', margin: '0', fontWeight: '500' }}>
              <li>Local (within 20 km): Same day / within hours</li>
              <li>Nearby cities: 1 day</li>
              <li>Other locations: 2–6 business days</li>
            </ul>
            <p style={{ marginTop: '16px', fontSize: '14px', color: '#64748b' }}>
              <em>Please note: Delivery timelines are estimates and may vary due to courier delays, weather conditions, or other unforeseen factors.</em>
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📦</span> Order Tracking
            </h3>
            <p>
              Once your order is shipped, tracking details will be shared with you. You can use the tracking ID to monitor your shipment status.
            </p>
          </div>

          <div style={{ background: '#fff1f2', padding: '20px', borderRadius: '12px', border: '1px solid #ffe4e6' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#e11d48', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>❗</span> Delivery Delays
            </h3>
            <p style={{ color: '#be123c' }}>
              We are not responsible for delays caused by courier partners. However, we will assist you in tracking and resolving delivery issues.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📍</span> Address Accuracy
            </h3>
            <p>
              Customers are requested to provide accurate delivery details. We are not responsible for failed deliveries due to incorrect or incomplete addresses.
            </p>
          </div>

          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '8px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📞</span> Support
            </h3>
            <p>
              For any shipping-related queries, please contact our support team with your order details.
            </p>
            <p style={{ marginTop: '12px', fontWeight: '700' }}>
              We strive to deliver every order safely, quickly, and in the best condition possible.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
