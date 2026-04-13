"use client";

import React, { useEffect, useState } from 'react';
import styles from './HomeGiftPromo.module.css';
import { subscribeToStoreSettings } from '@/services/productService';
import { useCart } from '@/context/CartContext';
import { Gift, Sparkles, CheckCircle2 } from 'lucide-react';

export default function HomeGiftPromo() {
  const [giftSettings, setGiftSettings] = useState<any>(null);
  const { itemsTotal, comboDiscount, openCart } = useCart();
  const productValue = itemsTotal - comboDiscount;

  useEffect(() => {
    // Real-time listener — auto-updates when admin adds/deletes tiers
    const unsubscribe = subscribeToStoreSettings(
      (settings) => setGiftSettings(settings),
      () => setGiftSettings(null)
    );
    return () => unsubscribe();
  }, []);

  if (!giftSettings?.isFreeGiftEnabled || !giftSettings?.offers?.length) return null;

  const offers = [...giftSettings.offers].sort((a: any, b: any) => a.threshold - b.threshold);
  const nextOffer = offers.find((o: any) => productValue < o.threshold) || offers[offers.length - 1];
  const isAllUnlocked = productValue >= offers[offers.length - 1].threshold;

  // Calculate progress percentage for the bar
  const calculateTotalProgress = () => {
    if (!offers.length) return 0;
    const maxThreshold = offers[offers.length - 1].threshold;
    if (productValue >= maxThreshold) return 100;
    
    // Divide the bar into equal segments for each tier
    const segmentWidth = 100 / offers.length;
    let totalProgress = 0;
    
    for (let i = 0; i < offers.length; i++) {
      const currentThreshold = offers[i].threshold;
      const prevThreshold = i === 0 ? 0 : offers[i-1].threshold;
      
      if (productValue >= currentThreshold) {
        totalProgress += segmentWidth;
      } else {
        // Linear progress within this segment
        const segmentProgress = (productValue - prevThreshold) / (currentThreshold - prevThreshold);
        totalProgress += segmentProgress * segmentWidth;
        break;
      }
    }
    return Math.max(2, totalProgress); // min 2% for visibility
  };

  return (
    <div className={styles.promoWrapper}>
      <div className={styles.rewardsStrip} onClick={openCart}>
        <div className={styles.headerRow}>
          <div className={styles.leftLabel}>
            <Gift size={16} className={styles.giftIcon} />
            <span>FREE GIFTS</span>
          </div>

          <div className={styles.statusSection}>
            {isAllUnlocked ? (
              <span className={styles.unlockedAllText}>🎉 ALL REWARDS UNLOCKED!</span>
            ) : (
              <div className={styles.progressText}>
                Add <strong>₹{Math.ceil(nextOffer.threshold - productValue)}</strong> for <strong>{nextOffer.giftName}</strong>
              </div>
            )}
            <Sparkles size={14} className={styles.sparkle} />
          </div>
        </div>

        <div className={styles.tiersContainer}>
          <div className={styles.progressBarBase}>
            <div 
              className={styles.progressBarFill} 
              style={{ width: `${calculateTotalProgress()}%` }} 
            />
          </div>
          <div className={styles.tiersRow}>
            {offers.map((offer: any, index: number) => {
              const isUnlocked = productValue >= offer.threshold;
              return (
                <div key={offer.id} className={`${styles.tierItem} ${isUnlocked ? styles.unlocked : ''}`}>
                  <div className={styles.dot}>
                    {isUnlocked ? <CheckCircle2 size={12} strokeWidth={3} /> : (index + 1)}
                  </div>
                  <div className={styles.tierInfo}>
                    <span className={styles.tierName}>{offer.giftName}</span>
                    <span className={styles.tierValue}>₹{offer.threshold}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
