"use client";
import { useState, useEffect } from "react";

/**
 * Returns `false` on server / first SSR render, `true` after hydration.
 * Use this to guard any component that reads `localStorage`, `window`,
 * or any browser-only API — preventing hydration mismatches.
 *
 * Usage:
 *   const mounted = useClientMount();
 *   if (!mounted) return <SkeletonPlaceholder />;
 */
export function useClientMount(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return mounted;
}
