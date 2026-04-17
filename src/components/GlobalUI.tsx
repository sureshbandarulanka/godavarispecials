"use client";
import React from 'react';
import dynamic from 'next/dynamic';
import Toast from "@/components/Toast";
import { useClientMount } from '@/hooks/useClientMount';

// Dynamically import heavy UI components with ssr: false
const LoginModal = dynamic(() => import("@/components/LoginModal"), { ssr: false });
const CartDrawer = dynamic(() => import("@/components/CartDrawer"), { ssr: false });
const StickyCartBar = dynamic(() => import("@/components/StickyCartBar"), { ssr: false });
const NotificationPrompt = dynamic(() => import("@/components/NotificationPrompt"), { ssr: false });
const LocationPrompt = dynamic(() => import("@/components/LocationPrompt"), { ssr: false });
const MobileBottomNav = dynamic(() => import("@/components/MobileBottomNav"), { ssr: false });
const AutoLoginPrompt = dynamic(() => import("@/components/AutoLoginPrompt"), { ssr: false });

export default function GlobalUI() {
  const mounted = useClientMount();

  if (!mounted) return null;

  return (
    <>
      <MobileBottomNav />
      <StickyCartBar />
      <LoginModal />
      <CartDrawer />
      <Toast />
      <NotificationPrompt />
      <LocationPrompt />
      <AutoLoginPrompt />
    </>
  );
}
