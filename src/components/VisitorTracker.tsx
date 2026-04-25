'use client';

import { useEffect } from 'react';
import { logVisitDetails } from '@/services/analyticsService';
import { useAuth } from '@/context/AuthContext';

export default function VisitorTracker() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      logVisitDetails(user);
    }
  }, [user, loading]);

  return null;
}
