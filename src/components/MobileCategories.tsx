"use client";
import React from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { useCategories } from '@/context/CategoryContext';

export default function MobileCategories({ initialCategories = [] }: { initialCategories?: any[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const { categories, loading: contextLoading } = useCategories();

  const loading = contextLoading && categories.length === 0 && initialCategories.length === 0;

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
    ...(categories.length > 0 ? categories : initialCategories)
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
                <Image 
                  src={cat.imageUrl || '/assets/categories/foryou.png'} 
                  alt={cat.name || 'Category'} 
                  fill
                  style={{ objectFit: 'contain' }}
                  priority={cat.slug === '/'}
                  sizes="(max-width: 768px) 48px, 48px"
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
