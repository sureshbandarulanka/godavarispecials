"use client";
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useLocation } from '@/context/LocationContext';
import { useRouter } from 'next/navigation';
import styles from './MyProfile.module.css';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function MyProfilePage() {
  const { user, logout } = useAuth();
  const { showToast } = useCart();
  const { location } = useLocation();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [hideSensitive, setHideSensitive] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dob: '',
    address: ''
  });
  
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        dob: user.dob || ''
      }));
    }
  }, [user]);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsSaved(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      const userRef = doc(db, 'users', user.uid);
      
      await updateDoc(userRef, {
        displayName: formData.name,
        phone: formData.phone,
        dob: formData.dob,
        detailedAddress: formData.address
      });

      showToast("Profile updated successfully! ✨");
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast("Failed to update profile. Please try again.");
    }
  };

  if (!isClient) return null;

  return (
    <ProtectedRoute>
      <div className="pb-mobile-nav">
        <div className="desktop-only">
          <Header />
        <main className={`container main-content ${styles.page}`}>
          <div className={styles.profileContainer}>
            <div className={styles.sidebar}>
              <div className={styles.userCard}>
                <div className={styles.avatar}>{formData.name.charAt(0).toUpperCase()}</div>
                <div className={styles.userInfo}>
                  <h2 className={styles.userName}>{formData.name || 'User'}</h2>
                  <p className={styles.userEmail}>{formData.email}</p>
                </div>
              </div>
              <nav className={styles.nav}>
                <button className={`${styles.navItem} ${styles.navActive}`}>Personal Information</button>
                <button className={styles.navItem} onClick={() => router.push('/my-orders')}>My Orders</button>
                <button className={`${styles.navItem} ${styles.logout}`} onClick={() => { logout(); router.push('/'); }}>Logout</button>
              </nav>
            </div>

            <div className={styles.content}>
              <h1 className={styles.contentTitle}>Personal Information</h1>
              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.formGrid}>
                  <div className={styles.formGroup}>
                    <label>Full Name</label>
                    <input 
                      type="text" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleChange} 
                      placeholder="Enter your name" 
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Email Address</label>
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange} 
                      contentEditable={false} // Email typically uneditable if from OAuth
                      placeholder="Enter your email" 
                      className={styles.input}
                      disabled
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Phone Number</label>
                    <input 
                      type="tel" 
                      name="phone" 
                      value={formData.phone} 
                      onChange={handleChange} 
                      placeholder="Enter 10-digit mobile number" 
                      className={styles.input}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Date of Birth</label>
                    <input 
                      type="date" 
                      name="dob" 
                      value={formData.dob} 
                      onChange={handleChange} 
                      className={styles.input}
                    />
                  </div>
                </div>

                <div className={styles.sectionTitle}>Delivery Address</div>
                <div className={styles.addressBox}>
                  <div className={styles.addressIcon}>📍</div>
                  <div className={styles.addressDetails}>
                    <div className={styles.currentAddressLabel}>Current Selected Location</div>
                    <div className={styles.currentAddressValue}>{[location.area, location.city, location.state, location.pincode].filter(Boolean).join(', ')}</div>
                    <p className={styles.addressHint}>You can change this anytime from the location picker in the header.</p>
                  </div>
                </div>

                <div className={styles.formGroup} style={{ marginTop: '24px' }}>
                  <label>Default Detailed Address (House No, Area, etc.)</label>
                  <textarea 
                    name="address" 
                    value={formData.address} 
                    onChange={handleChange} 
                    placeholder="Enter your detailed address for faster checkout" 
                    className={styles.textarea}
                    rows={3}
                  />
                </div>

                <div className={styles.actions}>
                  <button type="submit" className={styles.btnSave}>
                    {isSaved ? '✓ Profile Saved' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
        <Footer />
      </div>

      {/* Mobile Profile View (Blinkit Style) */}
      <div className="mobile-only mobile-profile-page">
        {/* Header with Back Button */}
        <div className="mobile-profile-header-new">
          <button className="back-btn" onClick={() => router.back()}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          
          <div className="profile-identity">
            <div className="profile-avatar-large">
              {formData.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="profile-name-large">{formData.name}</h2>
            <div className="profile-meta-row">
              {formData.phone ? (
                <span className="profile-phone-large">📞 {formData.phone}</span>
              ) : (
                <span className="profile-add-info-btn" onClick={() => (document.getElementsByName('phone')[0] as HTMLElement)?.focus()}>
                  Add Phone Number
                </span>
              )}
              {formData.dob ? (
                <span className="profile-dob-large">🎂 {new Date(formData.dob).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              ) : (
                <span className="profile-add-info-btn" onClick={() => (document.getElementsByName('dob')[0] as HTMLElement)?.focus()}>
                  Add Date of Birth
                </span>
              )}
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


          <div className="profile-settings-group">
            <div className="profile-list-item clickable" onClick={() => setHideSensitive(!hideSensitive)}>
              <div className="pli-left">
                <div className="pli-icon-wrapper secondary">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                </div>
                <div className="pli-text-stack">
                  <span className="pli-text-bold">Hide sensitive Data</span>
                  <span className="pli-subtext">Address, Phone Number, etc..,</span>
                </div>
              </div>
              <div className="pli-right">
                <div className={`mobile-toggle ${hideSensitive ? 'active' : ''}`}>
                  <div className="toggle-handle"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Your Information */}
          <div className="settings-section-title">Your information</div>
          <div className="profile-settings-group section-card">
            <SettingsItem 
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path><path d="M8 7h6"></path><path d="M8 11h8"></path></svg>} 
              text="Address book" 
              onClick={() => handleFeatureToast('Address Book')} 
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
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>} 
              text="GST details" 
              onClick={() => handleFeatureToast('GST details')} 
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
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>} 
              text="Payment settings" 
              onClick={() => handleFeatureToast('Payment settings')} 
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
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>} 
              text="Account privacy" 
              onClick={() => handleFeatureToast('Account Privacy')} 
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
    </ProtectedRoute>
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
