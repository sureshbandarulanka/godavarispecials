"use client";
import React from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function AboutUsPage() {
  return (
    <div className="pb-mobile-nav">
      <Header />
      <main className="container main-content policy-page-content" style={{ padding: '120px 20px 100px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '800', marginBottom: '24px', color: 'var(--text-primary)' }}>
          ABOUT US
        </h1>
        
        <div style={{ color: 'var(--text-secondary)', lineHeight: '1.8', fontSize: '16px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--brand-blue)', marginBottom: '8px' }}>
              Welcome to Godavari Specials ❤️
            </h2>
            <p style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)' }}>
              We bring you the authentic taste of Godavari right to your doorstep.
            </p>
            <p style={{ marginTop: '12px' }}>
              Godavari Specials was born with a simple mission — to deliver pure, homemade, and traditional food products prepared with love and care. Every item we offer reflects the rich culinary heritage of Rajamahendravaram (Rajahmundry), known for its unique flavors and timeless recipes.
            </p>
          </div>

          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🍲</span> Our Story
            </h3>
            <p>
              In every home across Godavari, food is more than just a meal — it is an emotion. We started Godavari Specials to share these authentic homemade flavors with people who miss the taste of home or want to experience real traditional food.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🥭</span> What We Offer
            </h3>
            <p>We specialize in:</p>
            <ul style={{ listStyleType: 'disc', paddingLeft: '24px', marginTop: '8px' }}>
              <li>Homemade pickles (Avakai, Gongura, etc.)</li>
              <li>Traditional sweets</li>
              <li>Dry fish and local delicacies</li>
            </ul>
            <p style={{ marginTop: '12px' }}>
              All our products are carefully prepared using quality ingredients, maintaining hygiene and traditional methods.
            </p>
          </div>

          <div style={{ background: '#f0fdf4', padding: '20px', borderRadius: '12px', border: '1px solid #dcfce7' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#166534', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🚚</span> Freshness & Delivery
            </h3>
            <p style={{ color: '#14532d' }}>
              We ensure that every order is freshly packed and delivered safely to maintain taste and quality. From our kitchen in Rajamahendravaram, we ship across India with care.
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>❤️</span> Our Promise
            </h3>
            <ul style={{ listStyleType: 'disc', paddingLeft: '24px', marginTop: '8px', fontWeight: '500' }}>
              <li>Authentic homemade taste</li>
              <li>Quality ingredients</li>
              <li>Hygienic preparation</li>
              <li>Transparent pricing</li>
              <li>Reliable delivery</li>
            </ul>
            <p style={{ marginTop: '12px', fontStyle: 'italic' }}>
              We are committed to bringing you the true flavors of Godavari, just like homemade food.
            </p>
          </div>

          <div style={{ textAlign: 'center', marginTop: '16px', padding: '32px 0', borderTop: '1px solid #e2e8f0' }}>
            <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
              <span>🙏</span> Thank You
            </h3>
            <p style={{ marginBottom: '16px' }}>
              Thank you for choosing Godavari Specials. Your support helps us keep traditional flavors alive and reach more homes across India.
            </p>
            <p style={{ fontSize: '20px', fontWeight: '700', color: 'var(--brand-blue)', fontStyle: 'italic' }}>
              “From our home to yours — with love and tradition.”
            </p>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
