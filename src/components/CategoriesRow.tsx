"use client";
import React from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import styles from './CategoriesRow.module.css';
import { useCategories } from '@/context/CategoryContext';

export default function CategoriesRow() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const { categories, loading } = useCategories();

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
    ...categories
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
                  <img 
                    src={cat.imageUrl || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="%23cccccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>'} 
                    alt={cat.name} 
                    className={styles.categoryImage} 
                    loading="lazy"
                    width={68}
                    height={68}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="68" height="68" viewBox="0 0 24 24" fill="none" stroke="%23cccccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                    }}
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
