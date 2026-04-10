"use client";
import React from 'react';
import AdminShell from '@/components/admin/AdminShell';
import AdminRoute from '@/components/AdminRoute';
import { AdminAuthProvider } from '@/context/AdminAuthContext';
import '../admin.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminRoute>
      <AdminShell>
        {children}
      </AdminShell>
    </AdminRoute>
  );
}
