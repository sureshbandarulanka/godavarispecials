"use client";
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './LoginModal.module.css';
import { X, ChevronRight, Lock } from 'lucide-react';

const GoogleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

const LoadingSpinner = () => <div className={styles.spinner} />;

export default function LoginModal() {
  const { isLoginModalOpen, closeLoginModal, loginWithGoogle, loading: authLoading } = useAuth();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      // closeLoginModal is handled by context if successful
    } catch (err: any) {
      setError(err.message || 'Google login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isGlobalLoading = loading || authLoading;

  return (
    <div className={styles.overlay} onClick={closeLoginModal}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.dragHandle} />
        
        <div className={styles.content}>
          <header className={styles.header}>
            <h2 className={styles.title}>Welcome to Godavari Specials</h2>
            <p className={styles.subtitle}>Sign in to unlock exclusive offers and track your orders</p>
          </header>
          
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.actionSection}>
            <button 
              type="button" 
              className={styles.googleBtn} 
              onClick={handleGoogleLogin} 
              disabled={isGlobalLoading}
            >
              {isGlobalLoading ? (
                <div className={styles.btnContent}>
                  <LoadingSpinner />
                  <span>Authenticating...</span>
                </div>
              ) : (
                <div className={styles.btnContent}>
                  <div className={styles.googleIconWrapper}><GoogleIcon /></div>
                  <span>Continue with Google</span>
                  <ChevronRight className={styles.chevron} />
                </div>
              )}
            </button>
          </div>

          <div className={styles.footer}>
            <div className={styles.secureBadge}>
              <Lock className="w-3 h-3" />
              <span>Secure Authentication</span>
            </div>
            <p className={styles.legal}>
              By joining, you agree to our 
              <button className={styles.legalLink}>Terms</button> and 
              <button className={styles.legalLink}>Privacy Policy</button>.
            </p>
            
            <button className={styles.closeBtn} onClick={closeLoginModal} aria-label="Close">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
