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
import { useSections } from '@/context/SectionContext';
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
  const { sections } = useSections();
  const [allProducts, setAllProducts] = useState<any[]>(initialProducts);

  // Real-time product subscription
  useEffect(() => {
    const unsubscribe = subscribeToProducts(
      (products) => setAllProducts(products),
      () => setAllProducts(initialProducts) // fallback to initial data on error
    );
    return () => unsubscribe();
  }, [initialProducts]);

  // Use useMemo to compile active sections dynamically in their exact drag-and-drop order
  const categorySections = React.useMemo(() => {
    return sections.map((sec, index) => {
      // Helper to classify non-veg products for backward compatibility
      const isProductNonVeg = (p: any) => {
        const nameLower = (p.name || '').toLowerCase();
        const typeLower = (p.type || '').toLowerCase();
        
        const hasNonVegKeywords = nameLower.includes('chicken') || 
                                  nameLower.includes('mutton') || 
                                  nameLower.includes('fish') || 
                                  nameLower.includes('prawn') || 
                                  nameLower.includes('non-veg') ||
                                  nameLower.includes('nonveg');
                                  
        const hasNonVegType = typeLower === 'nonveg' || typeLower === 'non-veg';
        
        return hasNonVegKeywords || hasNonVegType;
      };

      // 1. Resolve products matching this section (Explicit binding + Dynamic category fallback)
      let sectionProducts = [];

      if (sec.slug === 'top-selling-specials') {
        sectionProducts = allProducts.filter((p: any) => 
          (p.isTopSelling || p.sections?.includes('top-selling-specials')) && !p.isDeleted
        );
      } else if (sec.slug === 'non-veg-pickles') {
        sectionProducts = allProducts.filter((p: any) => 
          (p.categorySlug === 'pickles' && isProductNonVeg(p)) || 
          p.sections?.includes('non-veg-pickles')
        );
      } else if (sec.slug === 'traditional-veg-pickles') {
        sectionProducts = allProducts.filter((p: any) => 
          (p.categorySlug === 'pickles' && !isProductNonVeg(p)) || 
          p.sections?.includes('traditional-veg-pickles')
        );
      } else {
        // Custom created section OR standard categories row slug fallback
        sectionProducts = allProducts.filter((p: any) => 
          p.categorySlug === sec.slug || 
          p.sections?.includes(sec.slug)
        );
      }

      // Filter out soft-deleted items for UI rendering
      const activeSectionProducts = sectionProducts.filter((p: any) => !p.isDeleted && p.isActive !== false);

      // 2. If the section is empty, hide it gracefully
      if (activeSectionProducts.length === 0) return null;

      // 3. Render the dynamic element
      if (sec.slug === 'top-selling-specials') {
        return (
          <TopSellingSection 
            key={sec.id || sec.slug} 
            products={activeSectionProducts} 
          />
        );
      }

      // Alternating row backgrounds for modern aesthetics
      const isAlternate = index % 2 !== 0;

      // Redirection slug for "View All" buttons on pickles partitioned sections
      const targetSlug = sec.slug;

      return (
        <CategorySection 
          key={sec.id || sec.slug} 
          title={sec.name} 
          slug={targetSlug}
          products={activeSectionProducts} 
          isAlternate={isAlternate} 
        />
      );
    }).filter(Boolean); // Filter out empty null sections
  }, [sections, allProducts]);

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
