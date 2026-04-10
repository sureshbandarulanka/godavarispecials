"use client";

import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { usePathname } from "next/navigation";

/**
 * PRODUCTION-GRADE AUTO LOGIN PROMPT
 * Features: 2-second delay, Route-awareness, and Idempotency
 */
export default function AutoLoginPrompt() {
  const { user, loading, openLoginModal, isLoginModalOpen } = useAuth();
  const pathname = usePathname();

  useEffect(() => {
    // 1. Skip if user is already logged in or loading
    if (user || loading) return;

    // 2. Skip on sensitive routes where modal might be distracting (e.g., admin checkout for now)
    if (pathname.includes('/admin')) return;

    // 3. 2-second polite delay for a smooth guest transition
    const timer = setTimeout(() => {
      if (!user && !isLoginModalOpen) {
        openLoginModal();
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [user, loading, pathname, openLoginModal, isLoginModalOpen]);

  return null;
}
