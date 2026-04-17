"use client";
import React from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import styles from './CategoriesRow.module.css';
import { useCategories } from '@/context/CategoryContext';

import Image from 'next/image';

export default function CategoriesRow({ initialCategories = [] }: { initialCategories?: any[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const { categories, loading: contextLoading } = useCategories();

  const loading = contextLoading && categories.length === 0 && initialCategories.length === 0;

  const currentSlug = typeof params?.slug === 'string' ? params.slug : '';

  const handleCategoryClick = (slug: string) => {
    if (slug === 'for-you' || slug === '/') {
      if (pathname === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        router.push('/');
      }
    } else {
      router.push(`/category/${slug}`);
    }
  };

  const displayCategories = [
    { id: 'foryou', name: 'FOR YOU', slug: '/', imageUrl: '/assets/categories/foryou.png' },
    ...(categories.length > 0 ? categories : initialCategories)
  ];

  return (
    <section className="container desktop-only">
      <div className={styles['categories-container']}>
        {loading ? (
           Array(8).fill(0).map((_, i) => (
             <div key={i} className={styles.categoryCard} style={{ opacity: 0.5 }}>
               <div className={styles.imageRelative}>
                 <div className={styles.imageWrapper} style={{ backgroundColor: '#f1f5f9' }} />
               </div>
                <div className={styles.textWrap}>
                  <div className="skeleton" style={{ width: '60px', height: '12px', borderRadius: '4px' }} />
                </div>
             </div>
           ))
        ) : displayCategories.map((cat) => {
          const isActive = cat.slug === '/' 
            ? pathname === '/' 
            : currentSlug === cat.slug;

          return (
            <div 
              key={cat.id} 
              className={`${styles.categoryCard} ${isActive ? styles.activeCard : ''}`}
              onClick={() => handleCategoryClick(cat.slug)}
            >
              {cat.tag && (
                <div className={`${styles.topCurvedTag} ${cat.tag.includes('Organic') ? styles.blueTag : ''}`}>
                  {cat.tag}
                </div>
              )}
              <div className={styles.imageRelative}>
                <div className={styles.imageWrapper}>
                  <Image 
                    src={cat.imageUrl || '/assets/categories/foryou.png'} 
                    alt={cat.name || 'Category'} 
                    className={styles.categoryImage} 
                    width={68}
                    height={68}
                    priority={cat.slug === '/'}
                  />
                </div>
              </div>

            <div className={styles.textWrap}>
              <span className={styles.categoryName}>{cat.name}</span>
            </div>

            </div>
          );
        })}
      </div>
    </section>
  );
}
