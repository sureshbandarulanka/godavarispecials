'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext';
import AdminNotificationHandler, { useAdminNotifications } from '@/components/admin/AdminNotificationHandler';
import { useRouter } from 'next/navigation';

interface NavItemProps {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NavItem = ({ href, label, icon }: NavItemProps) => {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== '/admin' && pathname?.startsWith(href));

  return (
    <Link href={href} className={`admin-nav-item ${isActive ? 'active' : ''}`}>
      <span className="admin-nav-icon">{icon}</span>
      {label}
    </Link>
  );
};

function AdminHeader() {
  const { isMuted, toggleMute, permissionStatus, requestPermission } = useAdminNotifications();
  const { user, logout } = useAdminAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/admin/login');
  };

  return (
    <header className="admin-header">
      <div className="admin-header-title">
        <h1>Admin Panel</h1>
      </div>
      <div className="admin-actions">
        {permissionStatus !== 'granted' && (
          <button 
            className="admin-action-btn warning" 
            onClick={requestPermission}
            title="Click to enable browser notifications"
          >
            <span className="admin-icon">🔔</span>
            <span className="admin-badge">!</span>
          </button>
        )}

        <button 
          className={`admin-action-btn ${isMuted ? 'muted' : ''}`} 
          onClick={toggleMute}
          title={isMuted ? 'Unmute' : 'Mute Notifications'}
        >
          <span className="admin-icon">{isMuted ? '🔇' : '🔊'}</span>
        </button>

        <div className="admin-user-profile">
          <div className="admin-user-info">
            <span className="admin-user-name">{user?.name || 'Admin'}</span>
            <span className="admin-user-role">Super Admin</span>
          </div>
          <button onClick={handleLogout} className="admin-logout-btn" title="Logout">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
          </button>
        </div>
      </div>
    </header>
  );
}

export default function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminNotificationHandler>
      <div className="admin-layout">
        <aside className="admin-sidebar">
          <div className="admin-sidebar-logo">
            <Image
              src="/assets/logo.png"
              alt="Godavari Specials"
              width={150}
              height={60}
              style={{ objectFit: 'contain', maxWidth: '100%', height: 'auto' }}
              priority
            />
          </div>
          <nav className="admin-nav">
            <NavItem 
              href="/admin/dashboard" 
              label="Dashboard" 
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>} 
            />
            <NavItem 
              href="/admin/products" 
              label="Products" 
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>} 
            />
            <NavItem 
              href="/admin/categories" 
              label="Categories" 
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>} 
            />
            <NavItem 
              href="/admin/offers" 
              label="Offers" 
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>} 
            />
            <NavItem 
              href="/admin/banners" 
              label="Banners" 
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>} 
            />
            <NavItem 
              href="/admin/orders" 
              label="Orders" 
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>} 
            />
            <NavItem 
              href="/admin/notifications" 
              label="Notifications" 
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>} 
            />
            <NavItem 
              href="/admin/coupons" 
              label="Coupons" 
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5l-1.41 1.41L15.17 8H2V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line><path d="M9 19c-5 0-7-3-7-3s2-3 7-3 7 3 7 3-2 3-7 3z"></path></svg>} 
            />
            <NavItem 
              href="/admin/free-gift" 
              label="Free Gift" 
              icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12"></polyline><rect x="2" y="7" width="20" height="5"></rect><line x1="12" y1="22" x2="12" y2="7"></line><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path></svg>} 
            />
          </nav>
        </aside>

        <main className="admin-main">
          <AdminHeader />
          <div className="admin-content">
            {children}
          </div>
        </main>
      </div>
    </AdminNotificationHandler>
  );
}
