"use client";
import React, { useEffect, useState } from 'react';
import { subscribeToProducts } from "@/services/productService";
import { products as localProducts } from "@/data/products";
import { useSearchParams } from 'next/navigation';
import { useCategories } from '@/context/CategoryContext';
import Header from "@/components/Header";
import HeroBanner from "@/components/HeroBanner";
import CategoriesRow from "@/components/CategoriesRow";
import BestOffers from "@/components/BestOffers";
import HomeGiftPromo from "@/components/HomeGiftPromo";
import CategorySection from "@/components/CategorySection";
import Footer from "@/components/Footer";
import FloatingNav from "@/components/FloatingNav";
import JsonLd, { getLocalBusinessSchema } from "@/components/JsonLd";

export default function HomeClientWrapper() {
  const searchParams = useSearchParams();
  const { categories } = useCategories();
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

  // Real-time product subscription
  useEffect(() => {
    const unsubscribe = subscribeToProducts(
      (products) => setAllProducts(products),
      () => setAllProducts(localProducts)
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
