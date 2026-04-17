"use client";
import React from 'react';
import { useCategories } from '@/context/CategoryContext';
import Header from '@/components/Header';
import Link from 'next/link';
import Footer from '@/components/Footer';

export default function CategoriesPage() {
  const { categories, loading } = useCategories();

  return (
    <div className="pb-mobile-nav">
      <Header />
      <main className="container main-content categories-page">
        <div className="categories-header-title">
          <h1 className="h2">All Categories</h1>
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
      </main>
      <Footer />
    </div>
  );
}
