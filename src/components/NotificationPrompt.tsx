"use client";

import React, { useState, useEffect } from 'react';
import styles from './NotificationPrompt.module.css';
import { requestNotificationPermission, generateFCMToken } from '@/services/notificationService';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

export default function NotificationPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [isHiding, setIsHiding] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Check if notifications are supported and permission is 'default'
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === 'default') {
        // Show after a short delay to not overwhelm the user on page load
        const timer = setTimeout(() => {
          // Don't show if they already dismissed it in this session
          if (!sessionStorage.getItem('notification_prompt_dismissed')) {
            setIsVisible(true);
          }
        }, 8000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleAllow = async () => {
    const permission = await requestNotificationPermission();
    
    if (permission === 'granted') {
      // If user is logged in, sync the token immediately
      if (user) {
        try {
          const token = await generateFCMToken();
          if (token) {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
              fcmTokens: arrayUnion(token)
            });
          }
        } catch (err) {
          console.warn("FCM Sync Error:", err);
        }
      }
      handleClose();
    } else if (permission === 'denied') {
      handleClose();
    }
  };

  const handleClose = () => {
    setIsHiding(true);
    sessionStorage.setItem('notification_prompt_dismissed', 'true');
    setTimeout(() => {
      setIsVisible(false);
    }, 300);
  };

  if (!isVisible) return null;

  return (
    <div className={`${styles.prompt} ${isHiding ? styles.hiding : ''}`}>
      <div className={styles.header}>
        <div className={styles.icon}>🔔</div>
        <div className={styles.content}>
          <h3 className={styles.title}>Stay Updated! 🌶️</h3>
          <p className={styles.description}>
            Enable notifications for **exclusive offers**, spicy deals, and instant **order updates**!
          </p>
        </div>
      </div>
      <div className={styles.actions}>
        <button onClick={handleAllow} className={styles.btnAllow}>
          Enable Notifications
        </button>
        <button onClick={handleClose} className={styles.btnCancel}>
          Not Now
        </button>
      </div>
    </div>
  );
}
