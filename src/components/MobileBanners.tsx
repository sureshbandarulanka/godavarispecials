"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { subscribeToActiveBanners, Banner } from '@/services/bannerService';

const FALLBACK_MOBILE_BANNERS = [
  { id: 'm-fb-1', imageUrl: '/assets/banners/banner01-slide01.png', title: 'Authentic Avakai Pickle', redirectUrl: '/category/Veg%20Pickles' },
  { id: 'm-fb-2', imageUrl: '/assets/banners/banner01-slide02.png', title: 'Authentic Chicken Pickle', redirectUrl: '/category/Non-Veg%20Pickles' },
  { id: 'm-fb-3', imageUrl: '/assets/banners/banner02-slide01.png', title: 'Premium Buffalo Ghee', redirectUrl: '/category/Ghee%20%26%20Oils' },
  { id: 'm-fb-4', imageUrl: '/assets/banners/banner02-slide02.png', title: 'Traditional Podis', redirectUrl: '/category/Authentic%20Podis' },
];

export default function MobileBanners() {
  const [banners, setBanners] = useState<(Banner | any)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    // Real-time listener — updates automatically when admin changes banners
    const unsubscribe = subscribeToActiveBanners(
      (data) => {
        setBanners(data || []);
        setLoading(false);
      },
      () => {
        // Only use fallback when Firebase is unreachable
        setBanners(FALLBACK_MOBILE_BANNERS);
        setLoading(false);
      }
    );
    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setActiveIndex((current) => {
        const next = (current + 1) % banners.length;
        if (scrollRef.current) {
          const cardWidth = scrollRef.current.scrollWidth / banners.length;
          scrollRef.current.scrollTo({ left: cardWidth * next, behavior: 'smooth' });
        }
        return next;
      });
    }, 4500);

    return () => clearInterval(interval);
  }, [banners.length]);

  const handleScroll = () => {
    if (scrollRef.current && banners.length > 0) {
      const cardWidth = scrollRef.current.scrollWidth / banners.length;
      const index = Math.round(scrollRef.current.scrollLeft / cardWidth);
      setActiveIndex(index);
    }
  };

  const resolveBannerPath = (banner: Banner) => {
    if (banner.type === 'product' && banner.referenceId) {
      return `/product/${banner.referenceId}`;
    }
    if (banner.type === 'category' && banner.referenceId) {
      return `/category/${banner.referenceId}`;
    }
    if (banner.type === 'custom' && banner.redirectUrl) {
      return banner.redirectUrl;
    }
    return banner.redirectUrl || '/';
  };

  const handleBannerClick = (banner: Banner) => {
    const path = resolveBannerPath(banner);
    router.push(path);
  };

  if (loading) {
    return (
      <div className="mobile-banners-loading">
        <div className="mobile-skeleton" />
      </div>
    );
  }

  return (
    <div className="mobile-banners-section">
      <div 
        className="banner-scroll" 
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {banners.map((banner) => (
          <div 
            key={banner.id} 
            className="banner-card" 
            onClick={() => handleBannerClick(banner)}
            style={{ cursor: 'pointer', position: 'relative' }}
          >
            <Image 
              src={banner.imageUrl} 
              alt={banner.title || 'Banner'} 
              fill
              priority
              style={{ objectFit: 'cover' }}
              sizes="100vw"
            />
            <div className="banner-overlay">
              <button 
                className="banner-order-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleBannerClick(banner);
                }}
              >
                ORDER NOW
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {banners.length > 1 && (
        <div className="banner-dots">
          {banners.map((_, i) => (
            <div 
              key={i} 
              className={`banner-dot ${activeIndex === i ? 'active' : ''}`}
              onClick={() => {
                setActiveIndex(i);
                if (scrollRef.current) {
                  const cardWidth = scrollRef.current.scrollWidth / banners.length;
                  scrollRef.current.scrollTo({ left: cardWidth * i, behavior: 'smooth' });
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
