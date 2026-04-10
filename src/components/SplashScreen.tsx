"use client";
import React, { useEffect, useState } from "react";
import { useClientMount } from "@/hooks/useClientMount";

/**
 * SplashScreen — shown once per session on mobile.
 *
 * Guarded by useClientMount so it never renders on the server,
 * preventing hydration mismatches from window/sessionStorage access.
 */
export default function SplashScreen() {
  const mounted = useClientMount();
  const [isVisible, setIsVisible] = useState(false);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (!mounted) return;

    // Only show on mobile screens, once per session
    const hasShown = sessionStorage.getItem("mobile_splash_shown");
    const isMobile = window.innerWidth <= 768;

    if (!hasShown && isMobile) {
      setIsVisible(true);

      const fadeTimer = setTimeout(() => {
        setIsFading(true);

        const hideTimer = setTimeout(() => {
          setIsVisible(false);
          sessionStorage.setItem("mobile_splash_shown", "true");
        }, 500);

        return () => clearTimeout(hideTimer);
      }, 2000);

      return () => clearTimeout(fadeTimer);
    }
  }, [mounted]);

  // Don't render anything server-side or before mount
  if (!mounted || !isVisible) return null;

  return (
    <div className={`mobile-splash-screen ${isFading ? "fade-out" : ""}`}>
      <div className="splash-logo-container">
        <img
          src="/assets/logo.png"
          alt="Godavari Specials"
          className="splash-logo"
          width={120}
          height={120}
        />
        <div className="splash-brand-name">godavari specials</div>
        <div className="splash-loader">
          <div className="loader-bar" />
        </div>
      </div>
    </div>
  );
}
