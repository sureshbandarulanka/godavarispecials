"use client";
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function ContactUsPage() {
  return (
    <div className="pb-mobile-nav">
      <Header />
      <main className="container main-content" style={{ padding: '120px 20px 60px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '24px', color: 'var(--text-primary)' }}>
          CONTACT US
        </h1>
        
        <div style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--brand-blue)', marginBottom: '8px' }}>
              We'd love to hear from you! ❤️
            </h2>
            <p>
              Whether you have a question about our products, orders, or delivery — feel free to reach out.
            </p>
          </div>

          <div style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
               <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📍</span> Our Location
              </h3>
              <p>
                Rajamahendravaram (Rajahmundry),<br/>
                Andhra Pradesh, India
              </p>
            </div>

            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
               <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📞</span> Phone
              </h3>
              <p>+91 9491559901</p>
            </div>

            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
               <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📧</span> Email
              </h3>
              <p>support@godavarispecials.com</p>
            </div>

            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
               <h3 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🕒</span> Support Hours
              </h3>
              <p>Monday – Sunday:<br/>9:00 AM – 8:00 PM</p>
            </div>
          </div>

          <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '12px', border: '1px solid #dcfce7' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#166534', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>💬</span> WhatsApp Support
            </h3>
            <p style={{ color: '#14532d' }}>
              Chat with us directly for quick assistance and order updates.
            </p>
          </div>

          <div style={{ background: '#fff7ed', padding: '20px', borderRadius: '12px', border: '1px solid #ffedd5' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#c2410c', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📦</span> Order Support
            </h3>
            <p style={{ color: '#9a3412', marginBottom: '8px' }}>
              For order-related queries, please share:
            </p>
            <ul style={{ listStyleType: 'disc', paddingLeft: '24px', color: '#9a3412', fontWeight: '500' }}>
              <li>Order ID</li>
              <li>Name</li>
              <li>Issue details</li>
            </ul>
            <p style={{ color: '#9a3412', marginTop: '8px', fontStyle: 'italic' }}>
              This will help us assist you faster.
            </p>
          </div>

          <div style={{ textAlign: 'center', marginTop: '16px', padding: '32px 0', borderTop: '1px solid #e2e8f0' }}>
            <p style={{ fontSize: '18px', marginBottom: '8px' }}>
              We are always here to help you and ensure a smooth experience.
            </p>
            <p style={{ fontSize: '20px', fontWeight: '800', color: 'var(--brand-blue)' }}>
              Thank you for choosing Godavari Specials 🙏
            </p>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
