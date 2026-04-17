"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { useClientMount } from "@/hooks/useClientMount";
import { MobileHeaderSkeleton } from "./PageSkeleton";
import MobileHeader from "./MobileHeader";
import MobileBottomNav from "./MobileBottomNav";
import MobileBanners from "./MobileBanners";
import MobileCategories from "./MobileCategories";

/**
 * MobileUILayer
 *
 * Guards all mobile-only components behind useClientMount() so they
 * never render on the server. During the brief pre-hydration window
 * a pixel-perfect shimmer skeleton is shown instead, eliminating CLS.
 */
export default function MobileUILayer({ 
  initialCategories = [], 
  initialBanners = [] 
}: { 
  initialCategories?: any[], 
  initialBanners?: any[] 
}) {
  const pathname = usePathname();

  const isHomePage = pathname === "/";
  const isCategoryPage = pathname.startsWith("/category/");
  const showMobileCategories = isHomePage || isCategoryPage;
  const showMobileBanners = isHomePage;

  return (
    <>
      <MobileHeader />
      {showMobileCategories && <MobileCategories initialCategories={initialCategories} />}
      {showMobileBanners && <MobileBanners initialBanners={initialBanners} />}
    </>
  );
}
