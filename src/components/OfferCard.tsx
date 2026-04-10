"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './OfferCard.module.css';
import { Offer } from '@/services/offerService';
import { useCountdown } from '@/hooks/useCountdown';

export default function OfferCard({ offer }: { offer: Offer }) {
  const router = useRouter();
  const { timeLeft, isUrgent, isExpired } = useCountdown(offer.endDate);
  const [isVisible, setIsVisible] = useState(true);

  // Hybrid Expired State: Show "Expired" briefly then hide
  useEffect(() => {
    if (isExpired) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000); // 5 seconds delay before hiding
      return () => clearTimeout(timer);
    }
  }, [isExpired]);

  if (!isVisible) return null;

  const handleClick = () => {
    if (isExpired) return;
    router.push(`/product/${offer.productId}`);
  };

  // Safe discount calculation
  const discount = offer.originalPrice > 0
    ? Math.round(((offer.originalPrice - offer.offerPrice) / offer.originalPrice) * 100)
    : 0;

  return (
    <div 
      className={`${styles.offerCard} ${isExpired ? styles.disabled : ''}`} 
      onClick={handleClick}
    >
      {/* 🔹 Offer Badge (Top Left) */}
      <div className={styles.offerBadge}>{discount}% OFF</div>
      
      <div className={styles.imageContainer}>
        {offer.imageUrl ? (
          <img src={offer.imageUrl} alt={offer.title} className={styles.offerImage} loading="lazy" />
        ) : offer.productImage ? (
          <img src={offer.productImage} alt={offer.title} className={styles.offerImage} loading="lazy" />
        ) : (
          <div className={styles.placeholder}>
            No Banner Uploaded
          </div>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.title}>{offer.title}</div>
        
        <div className={styles.priceSection}>
          <span className={styles.offerPrice}>₹{offer.offerPrice}</span>
          <span className={styles.originalPrice}>₹{offer.originalPrice}</span>
        </div>

        {/* 🔹 Limited Deal Tag (Now inside content, above timer) */}
        <div className={styles.limitedBadge}>
          🔥 Limited Time Deal
        </div>
        
        {/* 🔹 Countdown Pill (Bottom) */}
        <div className={`${styles.countdown} ${isUrgent ? styles.urgent : ''} ${isExpired ? styles.expired : ''}`}>
          {isExpired ? '⌛ Expired' : `⏳ Ends in ${timeLeft}`}
        </div>
      </div>
    </div>
  );
}
