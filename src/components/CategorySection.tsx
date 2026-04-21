"use client";
import React, { useRef } from 'react';
import Link from 'next/link';
import ProductCard from './ProductCard';
import { Product } from '@/data/products';
import styles from './CategorySection.module.css';

interface Props {
  title: string;
  slug: string;
  products: Product[];
  isAlternate?: boolean;
}

export default function CategorySection({ title, slug, products, isAlternate }: Props) {
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

  const displayProducts = products;

  return (
    <section className={`${styles.section} ${isAlternate ? styles.alternateBg : ''}`}>
      <div className={`container ${styles.container}`}>
        <div className={styles.header}>
          <h2 className={styles.title}>{title}</h2>
          <div className={styles.headerRight}>
            <Link href={`/category/${slug}`} className={styles.viewAll}>
              View All
            </Link>
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
            {displayProducts.map((product) => (
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
