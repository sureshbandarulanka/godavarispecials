"use client";
import React from 'react';
import styles from './Footer.module.css';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';

export default function Footer() {
  const router = useRouter();
  const pathname = usePathname();

  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (pathname === '/') {
      const banner = document.getElementById('home-banner');
      if (banner) {
        banner.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      router.push('/?scrollToTop=true');
    }
  };

  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        {/* Column 1: Brand + Trust */}
        <div className={styles.column}>
          <a href="/" onClick={handleLogoClick}>
            <img src="/assets/logo.png" alt="Godavari Specials" className={styles.footerLogo} />
          </a>
          <p className={styles.tagline}>Authentic Godavari Foods, Delivered Fresh.</p>
          <p className={styles.description}>
            Traditional homemade pickles, sweets & dry fish directly from Godavari region.
          </p>
          <div className={styles.trustBadges}>
            <div className={styles.trustBadge}>
              <span>✅</span> 100% Homemade
            </div>
            <div className={styles.trustBadge}>
              <span>🚚</span> Fast Delivery
            </div>
            <div className={styles.trustBadge}>
              <span>🔒</span> Secure Payments
            </div>
          </div>
          <p className={styles.highlightLine}>
            🚀 2-Hour Delivery available in Rajahmundry surroundings
          </p>
        </div>

        {/* Column 2: Explore */}
        <div className={styles.column}>
          <h4 className={styles.heading}>Explore</h4>
          <ul className={styles.links}>
            <li><Link href="/category/pickles">Pickles</Link></li>
            <li><Link href="/category/sweets">Sweets</Link></li>
            <li><Link href="/category/dry-fish">Dry Fish</Link></li>
            <li><Link href="/category/ghee-oils">Ghee & Oils</Link></li>
          </ul>
        </div>

        {/* Column 3: Company */}
        <div className={styles.column}>
          <h4 className={styles.heading}>Company</h4>
          <ul className={styles.links}>
            <li><Link href="/about">About Us</Link></li>
            <li><Link href="/contact">Contact Us</Link></li>
            <li><Link href="/privacy-policy">Privacy Policy</Link></li>
            <li><Link href="/terms">Terms & Conditions</Link></li>
            <li><Link href="/cancellation-policy">Cancellation Policy</Link></li>
            <li><Link href="/refund-policy">Refund Policy</Link></li>
            <li><Link href="/shipping-policy">Shipping Policy</Link></li>
          </ul>
        </div>

        {/* Column 4: Contact + Social */}
        <div className={styles.column}>
          <h4 className={styles.heading}>Contact Us</h4>
          <div className={styles.contactDetails}>
            <a href="tel:+919491559901" className={styles.contactItem}>
              <span>📞</span> 9491559901
            </a>
            <a href="mailto:contact@godavarispecials.in" className={styles.contactItem}>
              <span>📧</span> contact@godavarispecials.in
            </a>
          </div>
          <div className={styles.deliveryScope}>
            <span>🌍</span> Delivering across India & International Shipping available
          </div>
          <div className={styles.socials}>
            <a href="https://wa.me/919491559901" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
              <img src="https://cdn-icons-png.flaticon.com/512/733/733585.png" alt="WhatsApp" width={24} height={24} />
            </a>
            <a href="https://www.instagram.com/godavari_specials.in?igsh=ZXB3eTA4anVrMW9j" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
              <img src="https://cdn-icons-png.flaticon.com/512/2111/2111463.png" alt="Instagram" width={24} height={24} />
            </a>
            <a href="https://www.facebook.com/profile.php?id=61574321437065" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
              <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" alt="Facebook" width={24} height={24} />
            </a>
          </div>
        </div>
      </div>

      {/* Payment + Security Strip */}
      <div className={styles.bottomStrips}>
        <div className={styles.paymentStrip}>
          <div className={styles.paymentIcons}>
            <span className={styles.paymentLogo}>UPI</span>
            <span className={styles.paymentLogo}>PhonePe</span>
            <span className={styles.paymentLogo}>GPay</span>
            <span className={styles.paymentLogo}>Visa / Mastercard</span>
          </div>
          <span className={styles.secureText}>🔒 100% Secure Payments</span>
        </div>

        {/* Copyright Bar */}
        <div className={styles.copyrightBar}>
          © {new Date().getFullYear()} Godavari Specials. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
