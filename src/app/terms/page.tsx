"use client";
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <div className="pb-mobile-nav">
      <Header />
      <main className="container main-content policy-page-content" style={{ padding: '120px 20px 100px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '24px', color: 'var(--text-primary)' }}>
          TERMS & CONDITIONS
        </h1>
        
        <div style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <p>
            Welcome to Godavari Specials. By using our website and placing an order, you agree to the following terms:
          </p>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>1. Product Nature:</h3>
            <p>All our products are homemade food items. Taste and appearance may slightly vary as they are prepared in batches.</p>
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>2. Pricing:</h3>
            <p>All product prices are fixed and displayed clearly. Delivery charges are calculated separately based on the delivery location.</p>
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>3. Orders:</h3>
            <p>Once an order is placed, it cannot be cancelled or modified.</p>
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>4. Delivery:</h3>
            <p>Delivery timelines are estimated and may vary based on location and courier conditions.</p>
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>5. Responsibility:</h3>
            <p>We are not responsible for delays caused by courier services or unforeseen circumstances.</p>
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>6. Returns & Refunds:</h3>
            <p>Refunds are only applicable in case of damaged, incorrect, or undelivered items.</p>
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>7. User Information:</h3>
            <p>Customers must provide accurate delivery details. We are not responsible for incorrect addresses.</p>
          </div>

          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '8px' }}>8. Policy Updates:</h3>
            <p>We reserve the right to update these terms at any time without prior notice.</p>
          </div>

          <p style={{ marginTop: '20px', fontWeight: '600' }}>
            By continuing to use our services, you agree to these terms.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
