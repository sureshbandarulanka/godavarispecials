"use client";
import React from 'react';
import { useClientMount } from '@/hooks/useClientMount';
import PageSkeleton from './PageSkeleton';

export default function AppStateProvider({ children }: { children: React.ReactNode }) {
  const mounted = useClientMount();

  // We no longer block the entire app with a skeleton.
  // Content is now SSR-ready for better performance.

  return (
    <div className="app-ready">
      {children}
    </div>
  );
}
