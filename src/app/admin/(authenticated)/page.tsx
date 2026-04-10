'use client';

import React, { useEffect, useState } from 'react';
import { getProducts, fetchFirebaseData } from '@/services/productService';
import { useCategories } from '@/context/CategoryContext';
import SendNotification from '@/components/admin/SendNotification';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    orders: 0
  });
  const [loading, setLoading] = useState(true);
  const { categories } = useCategories();

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await fetchFirebaseData();
      
      const products = getProducts();
      
      // Get orders from localStorage as mock for now
      const storedOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      
      setStats({
        products: products.length,
        categories: categories.length,
        orders: storedOrders.length || 12 // Default mock if 0
      });
      setLoading(false);
    };

    if (categories.length > 0 || categories.length === 0) {
      loadData();
    }
  }, [categories]);

  const statCards = [
    { 
      label: 'Total Products', 
      value: stats.products, 
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>,
      colorClass: 'icon-blue'
    },
    { 
      label: 'Total Categories', 
      value: stats.categories, 
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>,
      colorClass: 'icon-green'
    },
    { 
      label: 'Total Orders', 
      value: stats.orders, 
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>,
      colorClass: 'icon-purple'
    }
  ];

  return (
    <div>
      <div className="admin-stats-grid">
        {statCards.map((card, index) => (
          <div key={index} className="admin-stat-card">
            <div className="admin-stat-info">
              <h3>{card.label}</h3>
              <div className="admin-stat-value">
                {loading ? '...' : card.value}
              </div>
            </div>
            <div className={`admin-stat-icon ${card.colorClass}`}>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '40px', textAlign: 'center', background: '#fff', borderRadius: '12px', border: '1px solid var(--admin-border)' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 600, color: '#1e293b', marginBottom: '16px' }}>Welcome to Admin Dashboard</h2>
        <p style={{ color: '#64748b', fontSize: '16px' }}>Manage your products, categories, and track customer orders from one place.</p>
        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <button style={{ padding: '10px 20px', borderRadius: '8px', background: '#3b82f6', color: '#fff', border: 'none', fontWeight: 500, cursor: 'pointer' }}>Generate Report</button>
          <button style={{ padding: '10px 20px', borderRadius: '8px', background: 'transparent', color: '#1e293b', border: '1px solid #e2e8f0', fontWeight: 500, cursor: 'pointer' }}>View Analytics</button>
        </div>
      </div>
      <div style={{ marginTop: '32px' }}>
        <SendNotification />
      </div>
    </div>
  );
}
