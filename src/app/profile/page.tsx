"use client";
import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingNav from '@/components/FloatingNav';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import styles from './Profile.module.css';

export default function ProfilePage() {
  const { user, openLoginModal, logout } = useAuth();
  const { showToast } = useCart();
  const [isClient, setIsClient] = useState(false);

  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    if (!localStorage.getItem('user') && !localStorage.getItem('guest_user')) {
      setTimeout(() => openLoginModal(), 100);
    }
  }, [openLoginModal]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Godavari Specials',
          text: 'Check out these delicious pickles and sweets!',
          url: window.location.origin,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      showToast('Sharing not supported on this browser');
    }
  };

  const handleFeatureToast = (feature: string) => {
    showToast(`${feature} coming soon!`);
  };

  if (!isClient) return null;

  if (!user) {
    return (
      <div className="pb-mobile-nav guest-profile-view">
        <Header />
        <main className="container main-content">
          <div className="premium-card">
            <div style={{ fontSize: '80px', filter: 'grayscale(0.5)', opacity: 0.8, marginBottom: '16px' }}>👤</div>
            <h2 className="h2 text-bold" style={{ marginBottom: '16px' }}>Login to View Profile</h2>
            <p className="text-secondary" style={{ marginBottom: '24px', maxWidth: '300px' }}>Please login or sign up to view your personalized dashboard.</p>
            <button className="btn-login" onClick={openLoginModal}>Login Now</button>
          </div>
        </main>
        <FloatingNav />
      </div>
    );
  }

  const mockAddresses = [
    "Plot No. 42, Jubilee Hills, Hyderabad, Telangana 500033"
  ];
  const mockOrders = [] as any[];

  return (
    <div className="pb-mobile-nav">
      <div className="desktop-only">
        <Header />
        <main className="container main-content" style={{ marginBottom: '80px', marginTop: '30px' }}>
          <div className={styles.profileGrid}>
            
            <div className={styles.leftColumn}>
              {/* Identity Card */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className="h3">My Profile</h3>
                  <button className={styles.editBtn} onClick={() => router.push('/my-profile')}>Edit Profile</button>
                </div>
                
                <div className={styles.userInfo}>
                  <div className={styles.avatar}>{user.name.charAt(0).toUpperCase()}</div>
                  <div>
                    <p className={styles.name}>{user.name}</p>
                    <p className={styles.email}>{user.email}</p>
                    <p className={styles.mobile}>+91 9618070847</p>
                  </div>
                </div>
              </div>

              {/* Addresses Card */}
              <div className={styles.card} style={{ marginTop: '24px' }}>
                <div className={styles.cardHeader}>
                  <h4 style={{ fontWeight: 600, fontSize: '18px' }}>Saved Addresses</h4>
                  <button className={styles.addAddressBtn} onClick={() => router.push('/my-profile')}>+ Add New</button>
                </div>
                
                {mockAddresses.length > 0 ? (
                  <div className={styles.addressBox}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '2px', color: 'var(--brand-blue)' }}>
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <p>{mockAddresses[0]}</p>
                  </div>
                ) : (
                  <p className="text-secondary" style={{ fontSize: '14px' }}>No saved addresses.</p>
                )}

                <button className={styles.logoutBtn} onClick={() => { logout(); router.push('/'); }}>Log Out</button>
              </div>
            </div>

            {/* Orders Section */}
            <div className={styles.card}>
              <h3 className="h3" style={{ marginBottom: '24px' }}>My Orders</h3>
              
              {mockOrders.length === 0 ? (
                <div className={styles.emptyOrders}>
                  <svg width="70" height="70" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '20px' }}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                    <path d="M8 14h.01"></path>
                    <path d="M12 14h.01"></path>
                    <path d="M16 14h.01"></path>
                    <path d="M8 18h.01"></path>
                    <path d="M12 18h.01"></path>
                    <path d="M16 18h.01"></path>
                  </svg>
                  <h4 style={{ fontWeight: 700, fontSize: '20px', marginBottom: '10px' }}>No orders yet</h4>
                  <p className="text-secondary" style={{ fontSize: '15px', marginBottom: '24px' }}>Start exploring delicious items now</p>
                  <button className={styles.browseBtn} onClick={() => router.push('/')}>Start Shopping</button>
                </div>
              ) : (
                <div className={styles.orderList}>
                  {/* Simulated iteration */}
                </div>
              )}
            </div>
            
          </div>
        </main>
        <Footer />
      </div>

      {/* Mobile Profile View */}
      <div className="mobile-only mobile-profile-page">
        {/* Header with Back Button */}
        <div className="mobile-profile-header-new">
          <button className="back-btn" onClick={() => router.back()}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          
          <div className="profile-identity" onClick={() => router.push('/my-profile')}>
            <div className="profile-avatar-large">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="profile-name-large">{user.name}</h2>
            <div className="profile-meta-row">
              <span className="profile-phone-large">📞 9618070847</span>
              <span className="profile-dob-large">🎂 07 Dec 1994</span>
            </div>
          </div>
        </div>

        <div className="mobile-profile-content">
          {/* Quick Stats/Actions */}
          <div className="quick-actions-grid">
            <div className="quick-action-card" onClick={() => router.push('/my-orders')}>
              <div className="qa-icon-box orders">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path>
                  <path d="M3 6h18"></path>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
              </div>
              <span className="qa-label">Your orders</span>
            </div>
            <div className="quick-action-card" onClick={() => handleFeatureToast('Godavari Money')}>
              <div className="qa-icon-box money">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="5" width="20" height="14" rx="2"></rect>
                  <line x1="2" y1="10" x2="22" y2="10"></line>
                  <circle cx="12" cy="14" r="2"></circle>
                </svg>
              </div>
              <span className="qa-label">Godavari Money</span>
            </div>
            <div className="quick-action-card" onClick={() => handleFeatureToast('Help Center')}>
              <div className="qa-icon-box help">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  <circle cx="12" cy="9" r="0.01"></circle>
                  <path d="M12 12v3"></path>
                </svg>
              </div>
              <span className="qa-label">Need help?</span>
            </div>
          </div>

          {/* Your Information */}
          <div className="settings-section-title">Your information</div>
          <div className="profile-settings-group section-card">
            <SettingsItem 
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path><path d="M8 7h6"></path><path d="M8 11h8"></path></svg>} 
              text="Address book" 
              onClick={() => router.push('/my-profile')} 
            />
            <SettingsItem 
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z"></path><path d="M8 12h8"></path><path d="M12 8v8"></path></svg>} 
              text="Bookmarked recipes" 
              onClick={() => handleFeatureToast('Recipes')} 
            />
            <SettingsItem 
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>} 
              text="Your wishlist" 
              onClick={() => handleFeatureToast('Wishlist')} 
            />

            <SettingsItem 
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="12" rx="2"></rect><path d="M12 8V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v4"></path><path d="M8 8V4a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v4"></path></svg>} 
              text="E-gift cards" 
              onClick={() => handleFeatureToast('Gift Cards')} 
            />
            <SettingsItem 
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.5 22q-.5 0-1-.2t-.8-.8l-6.5-6.5q-.5-.5-.5-1t.2-1l2-2q.5-.5 1-.5t1 .2l6.5 6.5q.8.8.8 1.8t-.8 1.8l-1.9 1.9q-.4.3-.9.3Zm1.5-12 1.5-1.5 6 6-1.5 1.5-6-6Z"></path></svg>} 
              text="Your prescriptions" 
              onClick={() => handleFeatureToast('Prescriptions')} 
            />
          </div>

          {/* Payment and coupons */}
          <div className="settings-section-title">Payment and coupons</div>
          <div className="profile-settings-group section-card">
            <SettingsItem 
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"></rect><line x1="2" y1="10" x2="22" y2="10"></line><circle cx="12" cy="14" r="2"></circle></svg>} 
              text="Godavari Money" 
              onClick={() => handleFeatureToast('Godavari Money')} 
            />

            <SettingsItem 
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 7h3a5 5 0 0 1 5 5 5 5 0 0 1-5 5h-3m-6 0H6a5 5 0 0 1-5-5 5 5 0 0 1 5-5h3"></path><line x1="8" y1="12" x2="16" y2="12"></line></svg>} 
              text="Claim Gift card" 
              onClick={() => handleFeatureToast('Claim Gift card')} 
            />
            <SettingsItem 
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="7"></circle><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"></polyline></svg>} 
              text="Your collected rewards" 
              onClick={() => handleFeatureToast('Rewards')} 
            />
          </div>

          {/* Others */}
          <div className="settings-section-title">Other Information</div>
          <div className="profile-settings-group section-card">
            <SettingsItem 
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>} 
              text="Share the app" 
              onClick={handleShare} 
            />
            <SettingsItem 
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>} 
              text="About us" 
              onClick={() => handleFeatureToast('About Us')} 
            />

            <SettingsItem 
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>} 
              text="Notification preferences" 
              onClick={() => handleFeatureToast('Notification settings')} 
            />
            <div className="profile-list-item clickable" onClick={() => { logout(); router.push('/'); }}>
              <div className="pli-left">
                <span className="pli-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
                </span>
                <span className="pli-text">Log out</span>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </div>

          <div className="mobile-profile-footer">
            <h1 className="footer-brand">godavari specials</h1>
            <p className="footer-version">v1.24.5</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsItem({ icon, text, onClick }: { icon: React.ReactNode; text: string; onClick?: () => void }) {
  return (
    <div className="profile-list-item clickable" onClick={onClick}>
      <div className="pli-left">
        <span className="pli-icon">{icon}</span>
        <span className="pli-text">{text}</span>
      </div>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-secondary)" strokeWidth="2">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    </div>
  );
}
