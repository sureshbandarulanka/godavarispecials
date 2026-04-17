"use client";
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function RefundPolicyPage() {
  return (
    <div className="pb-mobile-nav">
      <Header />
      <main className="container main-content policy-page-content" style={{ padding: '32px 16px 100px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '24px', color: 'var(--text-primary)' }}>
          REFUND POLICY
        </h1>
        
        <div style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <p>
            At Godavari Specials, we take utmost care in preparing and delivering fresh, homemade food products. Due to the perishable nature of our items, refunds are only provided under specific conditions.
          </p>

          <div style={{ background: '#fff1f2', padding: '20px', borderRadius: '12px', border: '1px solid #ffe4e6' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#e11d48', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>❌</span> No Refund Policy
            </h3>
            <p style={{ color: '#be123c', fontWeight: '600' }}>
              We do not offer refunds for:
            </p>
            <ul style={{ listStyleType: 'disc', paddingLeft: '24px', marginTop: '8px', color: '#be123c' }}>
              <li>Change of mind after placing the order</li>
              <li>Incorrect address provided by the customer</li>
              <li>Failed delivery due to unavailability of the customer</li>
              <li>Delays caused by courier services beyond our control</li>
            </ul>
          </div>

          <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '12px', border: '1px solid #dcfce7' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#166534', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>✅</span> Eligible Refund Cases
            </h3>
            <p style={{ color: '#14532d', fontWeight: '600' }}>
              Refunds will only be considered in the following situations:
            </p>
            <ul style={{ listStyleType: 'disc', paddingLeft: '24px', marginTop: '8px', color: '#14532d' }}>
              <li>Wrong item delivered</li>
              <li>Damaged or spoiled product received</li>
              <li>Order not delivered</li>
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📸</span> Proof Requirement
            </h3>
            <p>To process a refund, customers must:</p>
            <ul style={{ listStyleType: 'disc', paddingLeft: '24px', marginTop: '8px' }}>
              <li>Contact us within 24 hours of delivery</li>
              <li>Provide clear photos or videos as proof</li>
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>💰</span> Refund Process
            </h3>
            <ul style={{ listStyleType: 'disc', paddingLeft: '24px', margin: '0' }}>
              <li>Once verified, the refund will be initiated within 2–5 business days</li>
              <li>Refund will be credited to the original payment method</li>
            </ul>
          </div>

          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔁</span> Replacement Option
            </h3>
            <p>
              In some cases, we may offer a replacement instead of a refund based on availability.
            </p>
          </div>

          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '8px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📞</span> Support
            </h3>
            <p>
              For any issues, please contact our support team immediately with order details and proof.
            </p>
            <p style={{ marginTop: '12px', fontWeight: '700' }}>
              We strive to ensure every order meets our quality standards and reaches you safely.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
