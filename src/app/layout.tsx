import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "./mobile.css";

// Providers & global components
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { LocationProvider } from "@/context/LocationContext";
import { CategoryProvider } from "@/context/CategoryContext";
import { OfferProvider } from "@/context/OfferContext";
import { ProductProvider } from "@/context/ProductContext";
import AppStateProvider from "@/components/AppStateProvider";
import GlobalUI from "@/components/GlobalUI";
import MobileUILayer from "@/components/MobileUILayer";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { getCategoriesAsync } from "@/services/productService";
import { getActiveBanners } from "@/services/bannerService";

// Load Inter with font-display: swap to avoid FOIT (Flash of Invisible Text)
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL('https://godavarispecials.in'),
  title: {
    default: "GS | Godavari Specials - Authentic Homemade Pickles & Sweets",
    template: "%s | Godavari Specials"
  },
  description: "Order authentic homemade pickles (Avakaya, Chicken, Mutton), traditional sweets, and spices from Godavari. 100% natural, fresh, and delivered across India by GS.",
  keywords: [
    "GS", "Godavari Specials", "Godavari", "Telugu Foods", "Telugu Ruchulu",
    "Godavari Ruchulu", "godavarispecials", "Telugu Specials", "Telugu Pickles",
    "Pickles", "Pindi Vantalu", "Pindi Vantalu Online", "Sweets", "Telugu Sweets",
    "Ghee", "Oils", "Natural Oils", "Healthy Food", "Healthy Organic Food",
    "Organic Food", "GS Pickles", "GS Sweets", "Andhra Pickles", "Homemade Foods", "rajahmundry", "rjy", "rajamahendravaram", "andhra foods"
  ],
  icons: {
    icon: "/assets/favicon.png",
    shortcut: "/assets/favicon.png",
    apple: "/assets/favicon.png"
  },
  manifest: "/manifest.json",
  authors: [{ name: "Godavari Specials" }],
  creator: "Godavari Specials",
  publisher: "Godavari Specials",
  openGraph: {
    title: "GS | Godavari Specials - Authentic Homemade Pickles & Sweets",
    description: "Experience the real taste of Godavari with GS. Buy 100% homemade pickles, sweets, and podis online. Fresh quality, traditional recipes.",
    url: 'https://godavarispecials.in',
    siteName: 'Godavari Specials',
    images: [{ url: '/assets/favicon.png' }],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Godavari Specials | Authentic Homemade Foods",
    description: "Pure, fresh, and traditional Godavari tastes delivered to your doorstep.",
    images: ['/assets/favicon.png'],
  },
  verification: {
    google: "9WwBS1zr9-5RZ-bFjgAlYkybwMcUSRiBhweegs4p0fs",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#FFD700',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch global data on server to avoid client-side waterfalls
  const [categories, banners] = await Promise.all([
    getCategoriesAsync().catch(() => []),
    getActiveBanners().catch(() => [])
  ]);

  const serializedCategories = JSON.parse(JSON.stringify(categories));
  const serializedBanners = JSON.parse(JSON.stringify(banners));
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to improve performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://maps.googleapis.com" />
        <link rel="preconnect" href="https://maps.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link rel="dns-prefetch" href="https://ipapi.co" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <LocationProvider>
            <CartProvider>
              <ProductProvider>
                <OfferProvider>
                  <CategoryProvider initialCategories={serializedCategories}>
                    <AppStateProvider>
                      <div className="app-shell">
                        <MobileUILayer
                          initialCategories={serializedCategories}
                          initialBanners={serializedBanners}
                        />
                        {children}
                      </div>
                      <GlobalUI />
                    </AppStateProvider>
                  </CategoryProvider>
                </OfferProvider>
              </ProductProvider>
            </CartProvider>
          </LocationProvider>
        </AuthProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
