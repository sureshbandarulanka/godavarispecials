"use client";
import React, { useEffect, useState, Suspense } from 'react';
import Header from "@/components/Header";
import HeroBanner from "@/components/HeroBanner";
import CategoriesRow from "@/components/CategoriesRow";
import BestOffers from "@/components/BestOffers";
import HomeGiftPromo from "@/components/HomeGiftPromo";
import CategorySection from "@/components/CategorySection";
import TopSellingSection from "@/components/TopSellingSection";
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

  // Filter active and non-deleted top-selling products
  const topSellingProducts = React.useMemo(() => {
    return allProducts.filter((p: any) => p.isTopSelling && !p.isDeleted);
  }, [allProducts]);

  const displayCategories = categories.length > 0 ? categories : initialCategories;
  
  // Use useMemo to prevent unnecessary re-renders of the category list mapping
  const categorySections = React.useMemo(() => {
    return displayCategories.map((category, index) => {
      const catProducts = allProducts.filter((p: any) => p.categorySlug === category.slug);
      
      if (category.slug === 'pickles') {
        const isProductNonVeg = (p: any) => {
          if (p.type) return p.type === 'nonveg';
          const nameLower = (p.name || '').toLowerCase();
          return nameLower.includes('chicken') || 
                 nameLower.includes('mutton') || 
                 nameLower.includes('fish') || 
                 nameLower.includes('prawns') || 
                 nameLower.includes('prawn');
        };
        
        const vegPickles = catProducts.filter((p: any) => !isProductNonVeg(p));
        const nonVegPickles = catProducts.filter((p: any) => isProductNonVeg(p));
        
        return (
          <React.Fragment key={category.id || category.slug}>
            <CategorySection 
              title="Traditional Veg Pickles" 
              slug={category.slug}
              products={vegPickles} 
              isAlternate={index % 2 !== 0} 
            />
            {nonVegPickles.length > 0 && (
              <CategorySection 
                title="Non-Veg Pickles" 
                slug={category.slug}
                products={nonVegPickles} 
                isAlternate={index % 2 === 0} 
              />
            )}
          </React.Fragment>
        );
      }

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
        {topSellingProducts.length > 0 && <TopSellingSection products={topSellingProducts} />}
        <BestOffers initialOffers={initialOffers} />
        {categorySections}
      </main>
      <Footer />
      <FloatingNav />
    </div>
  );
}
