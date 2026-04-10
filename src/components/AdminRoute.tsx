"use client";
import React, { useEffect } from 'react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { useRouter } from 'next/navigation';

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/admin/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="admin-loading-overlay">
        <div className="admin-spinner"></div>
        <p>Verifying Credentials...</p>
        <style jsx>{`
          .admin-loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: #ffffff;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            gap: 16px;
            color: #1a73e8;
            font-weight: 500;
          }
          .admin-spinner {
            width: 40px;
            height: 40px;
            border: 3px solid #e0e0e0;
            border-top: 3px solid #1a73e8;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}
