"use client";
import React from 'react';
import { useCategories } from '@/context/CategoryContext';
import Link from 'next/link';
import Footer from '@/components/Footer';

export default function CategoriesPage() {
  const { categories, loading } = useCategories();

  return (
    <div className="categories-page">
      <div className="categories-header-title">
        <h2>All Categories</h2>
      </div>
      
      <div className="categories-grid">
        {loading ? (
           <p style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Loading categories...</p>
        ) : categories.map((cat) => (
          <Link 
            key={cat.id || cat.slug} 
            href={`/category/${cat.slug}`}
            className="category-tile"
          >
            <div className="category-tile-icon">
              <img src={cat.imageUrl || "/assets/categories/foryou.png"} alt={cat.name} />
            </div>
            <span className="category-tile-name">{cat.name}</span>
          </Link>
        ))}
      </div>
      <div className="categories-tagline-banner">
        Authentic Godavari flavors, freshly delivered to your doorstep 🚚
      </div>
      <Footer />
    </div>
  );
}
