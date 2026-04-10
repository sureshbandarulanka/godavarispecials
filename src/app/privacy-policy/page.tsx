"use client";
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PrivacyPolicyPage() {
  return (
    <div className="pb-mobile-nav">
      <Header />
      <main className="container main-content policy-page-content" style={{ padding: '120px 20px 100px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '24px', color: 'var(--text-primary)' }}>
          PRIVACY POLICY
        </h1>
        
        <div style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <p>
            At Godavari Specials, we value your privacy and are committed to protecting your personal information.
          </p>

          <div>
             <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📌</span> Information We Collect
            </h3>
            <p>We may collect the following information:</p>
            <ul style={{ listStyleType: 'disc', paddingLeft: '24px', marginTop: '8px' }}>
              <li>Name</li>
              <li>Phone number</li>
              <li>Email address</li>
              <li>Delivery address</li>
              <li>Order details</li>
            </ul>
          </div>

          <div>
             <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📌</span> How We Use Your Information
            </h3>
            <p>Your information is used to:</p>
            <ul style={{ listStyleType: 'disc', paddingLeft: '24px', marginTop: '8px' }}>
              <li>Process and deliver your orders</li>
              <li>Communicate order updates</li>
              <li>Improve our services</li>
              <li>Send offers and updates (optional)</li>
            </ul>
          </div>
          
          <div>
             <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📌</span> Data Protection
            </h3>
            <p>
              We take appropriate security measures to protect your personal data. Your information is stored securely and is not shared unnecessarily.
            </p>
          </div>

          <div>
             <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📌</span> Sharing of Information
            </h3>
            <p>We do not sell or rent your personal data. We may share limited information with:</p>
            <ul style={{ listStyleType: 'disc', paddingLeft: '24px', marginTop: '8px' }}>
              <li>Delivery partners (for order fulfillment)</li>
              <li>Payment gateways (for transaction processing)</li>
            </ul>
          </div>

          <div>
             <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📌</span> Cookies
            </h3>
            <p>
              Our website may use cookies to enhance user experience and analyze website traffic.
            </p>
          </div>

          <div>
             <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📌</span> Your Rights
            </h3>
            <p>You have the right to:</p>
            <ul style={{ listStyleType: 'disc', paddingLeft: '24px', marginTop: '8px' }}>
              <li>Request access to your data</li>
              <li>Request correction or deletion of your data</li>
            </ul>
          </div>

          <div>
             <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📌</span> Updates to Policy
            </h3>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this page.
            </p>
          </div>

          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '8px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📌</span> Contact Us
            </h3>
            <p>
              For any privacy-related concerns, please contact us at:
            </p>
            <p style={{ marginTop: '8px', fontWeight: '600' }}>
              📧 support@godavarispecials.com
            </p>
          </div>
          
          <p style={{ fontWeight: '600', marginTop: '8px' }}>
            By using our website, you agree to this Privacy Policy.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
