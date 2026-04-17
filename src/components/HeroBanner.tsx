import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './HeroBanner.module.css';
import { subscribeToActiveBanners, Banner } from '@/services/bannerService';

// Fallback banners for when Firebase is unreachable
const FALLBACK_BANNERS: any[] = [
  {
    id: 'fb-1',
    imageUrl: '/assets/banners/banner01-slide01.png',
    title: 'Authentic Veg Pickles',
    subtitle: 'Homemade with Traditional Godavari Recipes',
    redirectUrl: '/category/Veg%20Pickles',
    isActive: true,
    priority: 1
  },
  {
    id: 'fb-2',
    imageUrl: '/assets/banners/banner01-slide02.png',
    title: 'Traditional Podis',
    subtitle: 'Freshly Prepared and Delivered to Your Doorstep',
    redirectUrl: '/category/Authentic%20Podis',
    isActive: true,
    priority: 2
  },
  {
    id: 'fb-3',
    imageUrl: '/assets/banners/banner02-slide02.png',
    title: 'Spicy Non-Veg Pickles',
    subtitle: 'Premium Chicken, Mutton & Fish Pickles',
    redirectUrl: '/category/Non-Veg%20Pickles',
    isActive: true,
    priority: 3
  }
];

export default function HeroBanner({ initialBanners = [] }: { initialBanners?: any[] }) {
  const [activeBanners, setActiveBanners] = useState<any[]>(initialBanners);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(initialBanners.length === 0);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    const unsubscribe = subscribeToActiveBanners(
      (banners) => {
        setActiveBanners(banners || []);
        setLoading(false);
      },
      () => {
        setActiveBanners(FALLBACK_BANNERS);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Auto-advance the window across all 3 slots every 4s
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [activeBanners.length]);

  const resolveBannerPath = (banner: any) => {
    if (banner.type === 'product' && banner.referenceId) return `/product/${banner.referenceId}`;
    if (banner.type === 'category' && banner.referenceId) return `/category/${banner.referenceId}`;
    if (banner.type === 'custom' && banner.redirectUrl) return banner.redirectUrl;
    return banner.redirectUrl || '/';
  };

  const handleBannerClick = (banner: any) => {
    router.push(resolveBannerPath(banner));
  };

  if (loading) {
    return (
      <section className={`container ${styles['banner-section']} desktop-only`}>
        <div className={styles['banner-container']}>
          <div className={styles['loading-skeleton']} />
          <div className={styles['loading-skeleton']} />
          <div className={styles['loading-skeleton']} />
        </div>
      </section>
    );
  }

  if (!loading && activeBanners.length === 0) return null;

  const total = activeBanners.length;

  // 3 slots rotate as a sliding window through all banners
  const b1 = activeBanners[currentIndex % total];
  const b2 = activeBanners[(currentIndex + 1) % total];
  const b3 = activeBanners[(currentIndex + 2) % total];

  // If fewer than 3 banners, some slots will repeat — that's fine
  const slots = [b1, b2, b3];

  return (
    <section id="home-banner" className={`container ${styles['banner-section']} desktop-only`}>
      <div className={styles['banner-container']}>
        {slots.map((banner, slotIdx) => (
          <div
            key={`${banner.id}-slot${slotIdx}-${currentIndex}`}
            className={styles['banner-card']}
            onClick={() => handleBannerClick(banner)}
          >
            <Image
              src={banner.imageUrl}
              alt={banner.title || 'Godavari Specials Banner'}
              fill
              priority={slotIdx === 0}
              className={styles.bannerImage}
              style={{ objectFit: 'cover' }}
              sizes="(max-width: 768px) 100vw, 33vw"
            />
            <div className={styles.overlay} />
            <div className={styles.contentOverlay}>
              <div className={styles.bannerInfo}>
                <h3 className={styles.bannerTitle}>{banner.title || 'Special Offers'}</h3>
                {(banner.subtitle || banner.tagline) && (
                  <p className={styles.bannerSubtitle}>{banner.subtitle || banner.tagline}</p>
                )}
              </div>
              <button
                className={styles.ctaButton}
                onClick={(e) => { e.stopPropagation(); handleBannerClick(banner); }}
              >
                ORDER NOW
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Dot indicators showing which set of 3 is active */}
      {total > 1 && (
        <div className={styles.dotsContainer}>
          {activeBanners.map((_, idx) => (
            <div
              key={idx}
              className={`${styles.dot} ${idx === currentIndex ? styles.activeDot : ''}`}
              onClick={() => setCurrentIndex(idx)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
