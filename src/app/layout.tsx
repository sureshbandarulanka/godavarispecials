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
import LoginModal from "@/components/LoginModal";
import CartDrawer from "@/components/CartDrawer";
import StickyCartBar from "@/components/StickyCartBar";
import MobileBottomNav from "@/components/MobileBottomNav";
import Toast from "@/components/Toast";
import MobileUILayer from "@/components/MobileUILayer";
import SplashScreen from "@/components/SplashScreen";
import AutoLoginPrompt from "@/components/AutoLoginPrompt";
import NotificationPrompt from "@/components/NotificationPrompt";
import LocationPrompt from "@/components/LocationPrompt";
import AppStateProvider from "@/components/AppStateProvider";
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';

// Load Inter with font-display: swap to avoid FOIT (Flash of Invisible Text)
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL('https://godavarispecials.in'),
  title: {
    default: "Godavari Specials - Fresh Local Products Delivery",
    template: "%s | Godavari Specials"
  },
  description: "Order fresh and authentic Godavari special products online. Fast delivery, best quality groceries, snacks, and local items delivered to your doorstep.",
  keywords: ["Godavari specials", "godavarispecials", "godavari specials", "gs", "godavari foods", "online groceries Andhra Pradesh", "local products delivery", "Rajahmundry food delivery", "East Godavari snacks", "fresh groceries online India"],
  authors: [{ name: "Godavari Specials" }],
  creator: "Godavari Specials",
  publisher: "Godavari Specials",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Godavari Specials - Fresh Local Products Delivery",
    description: "Order fresh and authentic Godavari special products online. Fast delivery, best quality groceries, snacks, and local items delivered to your doorstep.",
    url: 'https://godavarispecials.in',
    siteName: 'Godavari Specials',
    images: [
      {
        url: '/api/og', 
        width: 1200,
        height: 630,
        alt: 'Godavari Specials - Authentic Homemade Foods',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Godavari Specials - Fresh Local Products Delivery",
    description: "Order fresh and authentic Godavari special products online. Fast delivery, best quality groceries, snacks, and local items delivered to your doorstep.",
    creator: '@godavarispecials',
    images: ['/og-image.jpg'], 
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
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#FFD700',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <AutoLoginPrompt />
          <LocationProvider>
            <CartProvider>
              <ProductProvider>
                <OfferProvider>
                  <CategoryProvider>
                    <AppStateProvider>
                      <div className="app-shell">
                        <MobileUILayer />
                        {children}
                      </div>
                      <MobileBottomNav />
                      <StickyCartBar />
                      <LoginModal />
                      <CartDrawer />
                      <Toast />
                      <NotificationPrompt />
                      <LocationPrompt />
                    </AppStateProvider>
                  </CategoryProvider>
                </OfferProvider>
              </ProductProvider>
            </CartProvider>
          </LocationProvider>
        </AuthProvider>
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}
