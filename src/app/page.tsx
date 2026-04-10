"use client";
import React, { useEffect } from 'react';
import Header from "@/components/Header";
import HeroBanner from "@/components/HeroBanner";
import CategoriesRow from "@/components/CategoriesRow";
import BestOffers from "@/components/BestOffers";
import HomeGiftPromo from "@/components/HomeGiftPromo";
import CategorySection from "@/components/CategorySection";
import Footer from "@/components/Footer";
import FloatingNav from "@/components/FloatingNav";
import { subscribeToProducts } from "@/services/productService";
import { products as localProducts } from "@/data/products";
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useCategories } from '@/context/CategoryContext';
import { Suspense } from 'react';
import PageSkeleton from "@/components/PageSkeleton";
import JsonLd, { getLocalBusinessSchema } from "@/components/JsonLd";

function HomeContent() {
  const searchParams = useSearchParams();
  const { categories, loading: categoriesLoading } = useCategories();
  const [allProducts, setAllProducts] = useState<any[]>([]);

  useEffect(() => {
    if (searchParams.get('scrollToTop') === 'true') {
      const banner = document.getElementById('home-banner');
      if (banner) {
        banner.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }, [searchParams]);

  // 🔥 Real-time product subscription — auto-updates when admin adds/edits
  useEffect(() => {
    const unsubscribe = subscribeToProducts(
      (products) => setAllProducts(products),
      () => setAllProducts(localProducts) // fallback on error
    );
    return () => unsubscribe();
  }, []);

  return (
    <div className="pb-mobile-nav">
      <JsonLd data={getLocalBusinessSchema()} />
      <Header />
      <main className="main-content">
        <HeroBanner />
        <HomeGiftPromo />
        <CategoriesRow />
        <BestOffers />
        {categories.map((category, index) => {
          const catProducts = allProducts.filter((p: any) => p.categorySlug === category.slug);
          return (
            <CategorySection 
              key={category.id || category.slug} 
              title={category.name} 
              slug={category.slug}
              products={catProducts} 
              isAlternate={index % 2 !== 0} 
            />
          );
        })}
      </main>
      <Footer />
      <FloatingNav />
    </div>
  );
}

export default function Home() {
  return (
    <HomeContent />
  );
}
