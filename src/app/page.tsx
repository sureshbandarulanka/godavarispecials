import React from 'react';
import HomeContent from "@/components/HomeContent";
import { getProductsAsync, getCategoriesAsync } from "@/services/productService";
import { getActiveBanners } from "@/services/bannerService";
import { getActiveOffers } from "@/services/offerService";
import JsonLd, { getLocalBusinessSchema } from "@/components/JsonLd";
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Godavari Specials | Home of Authentic Telugu Ruchulu & Pindi Vantalu",
  description: "Experience the real Godavari Ruchulu. Shop for 100% natural, healthy organic pickles, traditional sweets, and pure oils. Authentic Telugu foods delivered fresh.",
};

// This is a Server Component by default in Next.js 16/15
export default async function Home() {
  // Fetch data in parallel on the server
  const [products, categories, banners, offers] = await Promise.all([
    getProductsAsync(),
    getCategoriesAsync(),
    getActiveBanners(),
    getActiveOffers()
  ]);

  // Convert Firebase timestamps to strings/numbers for serialization if necessary
  const serializedProducts = JSON.parse(JSON.stringify(products));
  const serializedCategories = JSON.parse(JSON.stringify(categories));
  const serializedBanners = JSON.parse(JSON.stringify(banners));
  const serializedOffers = JSON.parse(JSON.stringify(offers));

  return (
    <>
      <JsonLd data={getLocalBusinessSchema()} />
      <HomeContent 
        initialProducts={serializedProducts} 
        initialCategories={serializedCategories}
        initialBanners={serializedBanners}
        initialOffers={serializedOffers}
      />
    </>
  );
}
