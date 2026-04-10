"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import ContactModal from './ContactModal';
import { useClientMount } from '@/hooks/useClientMount';

export default function MobileBottomNav() {
  const mounted = useClientMount();
  const [isContactOpen, setIsContactOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();


  // Hide nav on specific pages (e.g. checkout usually hides it)
  const hideOnPaths: string[] = []; // Add paths here if needed
  if (hideOnPaths.some(path => pathname === path || pathname.startsWith(path))) {
    return null;
  }

  const navItems = [
    { 
      label: 'Home', 
      href: '/',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      )
    },
    { 
      label: 'Orders', 
      href: '/my-orders',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
      )
    },
    { 
      label: 'Categories', 
      href: '/categories',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
      )
    },
    { 
      label: 'Account', 
      href: '/my-profile',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      )
    },
    { 
      label: 'Contact', 
      href: 'tel:+919491559901',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
        </svg>
      )
    },
  ];

  return (
    <>
      <nav className="mobile-bottom-nav">
        {navItems.map((item) => {
          const isContact = item.label === 'Contact';
          const isActive = pathname === item.href;

          return (
            <div 
              key={item.label} 
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={(e) => {
                if (isContact) {
                  e.preventDefault();
                  setIsContactOpen(true);
                } else if (item.href === '/' && pathname === '/') {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                  router.push(item.href);
                }
              }}
            >
              <span className="nav-icon">{item.icon(isActive)}</span>
              <span className="nav-label">{item.label}</span>
            </div>
          );
        })}
      </nav>
      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </>
  );
}
