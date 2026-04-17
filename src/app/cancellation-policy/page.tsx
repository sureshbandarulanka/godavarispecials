"use client";
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function CancellationPolicyPage() {
  return (
    <div className="pb-mobile-nav">
      <Header />
      <main className="container main-content policy-page-content" style={{ padding: '32px 16px 100px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '24px', color: 'var(--text-primary)' }}>
          CANCELLATION POLICY
        </h1>
        
        <div style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <p>
            At Godavari Specials, we deal with freshly prepared homemade food products. Due to the nature of our products, all orders are processed immediately after confirmation.
          </p>

          <div style={{ background: '#fff1f2', padding: '20px', borderRadius: '12px', border: '1px solid #ffe4e6' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#e11d48', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>❌</span> Order Cancellation
            </h3>
            <p style={{ color: '#be123c', fontWeight: '600' }}>
              Once an order is placed, it cannot be cancelled under any circumstances.
            </p>
            <p style={{ marginTop: '12px', color: '#881337' }}>This policy is in place because:</p>
            <ul style={{ listStyleType: 'disc', paddingLeft: '24px', marginTop: '8px', color: '#be123c' }}>
              <li>Products are freshly prepared or packed immediately</li>
              <li>Ingredients and resources are allocated instantly</li>
              <li>Orders are dispatched quickly to maintain freshness</li>
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📦</span> Order Modification
            </h3>
            <p>
              Changes to orders (items, address, etc.) are not guaranteed once placed. However, you may contact our support team immediately after placing the order, and we will try our best to assist if the order has not yet been processed.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>💰</span> Refund Policy
            </h3>
            <p>
              Since cancellations are not allowed, refunds will not be issued for successfully placed orders.
            </p>
            <p style={{ marginTop: '12px' }}>Refunds are only applicable in the following cases:</p>
            <ul style={{ listStyleType: 'disc', paddingLeft: '24px', marginTop: '8px' }}>
              <li>Wrong item delivered</li>
              <li>Damaged product received</li>
              <li>Order not delivered</li>
            </ul>
          </div>

          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📞</span> Support
            </h3>
            <p>
              For any issues, please contact us immediately after delivery with proper proof (images/videos).
            </p>
            <p style={{ marginTop: '12px', fontWeight: '700' }}>
              Phone/WhatsApp: +91 9491559901<br />
              Email: contact@godavarispecials.in
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
