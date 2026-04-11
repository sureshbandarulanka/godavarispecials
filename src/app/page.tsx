import React, { Suspense } from 'react';
import HomeClientWrapper from "@/components/HomeClientWrapper";
import PageSkeleton from "@/components/PageSkeleton";

/**
 * Home Page (Server Component)
 * 
 * Provides an immediate server-rendered shell.
 * Wraps dynamic client components in Suspense with a pixel-perfect
 * PageSkeleton to eliminate CLS and improve perceived performance.
 */
export default function Home() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <HomeClientWrapper />
    </Suspense>
  );
}
