"use client";
import React from 'react';
import { useClientMount } from '@/hooks/useClientMount';
import PageSkeleton from './PageSkeleton';

export default function AppStateProvider({ children }: { children: React.ReactNode }) {
  const mounted = useClientMount();

  if (!mounted) {
    return <PageSkeleton />;
  }

  return (
    <div className="app-ready">
      {children}
    </div>
  );
}
