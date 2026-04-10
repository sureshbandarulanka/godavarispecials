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

  return (
    <div className={`container ${styles.promoWrapper}`}>
      <div className={styles.rewardsStrip} onClick={openCart}>
        <div className={styles.leftLabel}>
          <Gift size={16} className={styles.giftIcon} />
          <span>FREE GIFTS</span>
        </div>

        <div className={styles.tiersRow}>
          {offers.map((offer: any, index: number) => {
            const isUnlocked = productValue >= offer.threshold;
            return (
              <div key={offer.id} className={`${styles.tierItem} ${isUnlocked ? styles.unlocked : ''}`}>
                <div className={styles.dot}>
                  {isUnlocked ? <CheckCircle2 size={10} strokeWidth={3} /> : (index + 1)}
                </div>
                <span className={styles.tierName}>{offer.giftName}</span>
                <span className={styles.tierValue}>₹{offer.threshold}</span>
              </div>
            );
          })}
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
    </div>
  );
}
