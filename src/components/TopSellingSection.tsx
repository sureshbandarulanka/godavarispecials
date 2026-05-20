"use client";
import React, { useRef } from 'react';
import ProductCard from './ProductCard';
import { Product } from '@/data/products';
import styles from './TopSellingSection.module.css';

interface Props {
  products: Product[];
}

export default function TopSellingSection({ products }: Props) {
  const carouselRef = useRef<HTMLDivElement>(null);
  
  if (products.length === 0) return null;

  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = 400;
      carouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <section className={styles.section}>
      <div className="container">
        <div className={styles.header}>
          <div className={styles.headerTitleWrap}>
            <span className={styles.flameIcon}>🔥</span>
            <h2 className={styles.title}>Top Selling Specials</h2>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.scrollButtons}>
              <button className={styles.scrollBtn} onClick={() => scroll('left')} aria-label="Scroll left">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>
              <button className={styles.scrollBtn} onClick={() => scroll('right')} aria-label="Scroll right">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>
            </div>
          </div>
        </div>
        
        <div className={styles.carouselContainer}>
          <div className={styles.carousel} ref={carouselRef}>
            {products.map((product) => (
              <div key={product.id} className={styles.carouselItem}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
