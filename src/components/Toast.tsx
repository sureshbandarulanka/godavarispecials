"use client";
import React from 'react';
import { useCart } from '@/context/CartContext';
import styles from './Toast.module.css';

export default function Toast() {
  const { toastMessage } = useCart();

  if (!toastMessage) return null;

  return (
    <div className={styles.toast}>
      <div className={styles.toastContent}>
        <span className={styles.icon}>✓</span>
        {toastMessage}
      </div>
    </div>
  );
}
