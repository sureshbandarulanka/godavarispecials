"use client";
import React from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useCategories } from '@/context/CategoryContext';

export default function MobileCategories() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const { categories, loading } = useCategories();

  const currentSlug = typeof params?.slug === 'string' ? params.slug : '';

  const handleCategoryClick = (slug: string) => {
    if (slug === '/') {
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
    { id: 'foryou', name: 'For You', slug: '/', imageUrl: '/assets/categories/foryou.png' },
    ...categories
  ];

  return (
    <div className="mobile-categories-section">
      <div className="category-row">
        {loading ? (
           Array(8).fill(0).map((_, i) => (
             <div key={i} className="category-item" style={{ opacity: 0.5 }}>
               <div className="category-icon-wrapper" style={{ backgroundColor: '#f1f5f9' }} />
               <span className="category-name">...</span>
             </div>
           ))
        ) : displayCategories.map((cat) => {
          const isActive = cat.slug === '/' 
            ? pathname === '/' 
            : currentSlug === cat.slug;

          return (
            <div 
              key={cat.id || cat.name} 
              onClick={() => handleCategoryClick(cat.slug)}
              className={`category-item clickable ${isActive ? 'active' : ''}`}
            >
              <div className="category-icon-wrapper">
                {cat.tag && (
                  <div className={`mobile-category-tag ${cat.tag.includes('Organic') ? 'blue-tag' : ''}`}>
                    {cat.tag}
                  </div>
                )}
                <img 
                  src={cat.imageUrl || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="%23cccccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>'} 
                  alt={cat.name} 
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="%23cccccc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                  }}
                />
              </div>
              <span className="category-name">{cat.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
