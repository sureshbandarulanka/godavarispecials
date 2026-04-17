"use client";
import React, { useEffect, useState, Suspense } from 'react';
import Header from "@/components/Header";
import HeroBanner from "@/components/HeroBanner";
import CategoriesRow from "@/components/CategoriesRow";
import BestOffers from "@/components/BestOffers";
import HomeGiftPromo from "@/components/HomeGiftPromo";
import CategorySection from "@/components/CategorySection";
import Footer from "@/components/Footer";
import FloatingNav from "@/components/FloatingNav";
import { subscribeToProducts } from "@/services/productService";
import { useSearchParams } from 'next/navigation';
import { useCategories } from '@/context/CategoryContext';
import JsonLd, { getLocalBusinessSchema } from "@/components/JsonLd";

interface HomeContentProps {
  initialProducts: any[];
  initialCategories: any[];
  initialBanners: any[];
  initialOffers: any[];
}

function ScrollToTop() {
  const searchParams = useSearchParams();

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

  return null;
}

export default function HomeContent({ 
  initialProducts, 
  initialCategories,
  initialBanners,
  initialOffers 
}: HomeContentProps) {
  const { categories, setCategories } = useCategories();
  const [allProducts, setAllProducts] = useState<any[]>(initialProducts);

  // Real-time product subscription
  useEffect(() => {
    const unsubscribe = subscribeToProducts(
      (products) => setAllProducts(products),
      () => setAllProducts(initialProducts) // fallback to initial data on error
    );
    return () => unsubscribe();
  }, [initialProducts]);

  const displayCategories = categories.length > 0 ? categories : initialCategories;
  
  // Use useMemo to prevent unnecessary re-renders of the category list mapping
  const categorySections = React.useMemo(() => {
    return displayCategories.map((category, index) => {
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
    });
  }, [displayCategories, allProducts]);

  return (
    <div className="pb-mobile-nav home-page">
      <Suspense fallback={null}>
        <ScrollToTop />
      </Suspense>
      <Header />
      <main className="main-content">
        <HeroBanner initialBanners={initialBanners} />
        <HomeGiftPromo />
        <CategoriesRow initialCategories={initialCategories} />
        <BestOffers initialOffers={initialOffers} />
        {categorySections}
      </main>
      <Footer />
      <FloatingNav />
    </div>
  );
}
