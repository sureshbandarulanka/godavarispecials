"use client";
import React, { useState, useEffect, useRef } from 'react';
import OfferCard from './OfferCard';
import { subscribeToActiveOffers, Offer } from '@/services/offerService';
import Skeleton from './Skeleton';
import styles from './CategorySection.module.css';

export default function BestOffers({ initialOffers = [] }: { initialOffers?: Offer[] }) {
  const [offers, setOffers] = useState<Offer[]>(initialOffers);
  const [loading, setLoading] = useState(initialOffers.length === 0);
  const carouselRef = useRef<HTMLDivElement>(null);
  
  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 400;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    setLoading(true);
    // Real-time listener — auto-updates when admin adds/edits offers
    const unsubscribe = subscribeToActiveOffers(
      (allActive) => {
        setOffers(allActive);
        setLoading(false);
      },
      () => {
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  if (!loading && offers.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <h2 className={styles.title}>Best Offers</h2>
          <div className={styles.headerRight}>
            <button className={styles.viewAll}>View All</button>
            <div className={styles.scrollButtons}>
              <button className={styles.scrollBtn} onClick={() => scroll('left')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              <button className={styles.scrollBtn} onClick={() => scroll('right')}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
          </div>
        </div>
        
        <div className={styles.carouselContainer}>
          <div className={styles.carousel} ref={carouselRef}>
            {loading 
              ? Array.from({ length: 5 }).map((_, idx) => (
                  <div key={idx} className={styles.carouselItem}>
                    <Skeleton />
                  </div>
                ))
              : offers.map((offer) => (
                  <div key={offer.id} className={styles.carouselItem}>
                    <OfferCard offer={offer} />
                  </div>
                ))
            }
          </div>
        </div>
      </div>
    </section>
  );
}
