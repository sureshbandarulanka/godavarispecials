'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCoupons, deleteCoupon, updateCoupon } from '@/services/couponService';
import { Coupon } from '@/utils/couponEngine';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    const data = await getCoupons();
    setCoupons(data);
    setLoading(false);
  };

  const handleDelete = async (id: string | undefined) => {
    if (!id || !confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await deleteCoupon(id);
      fetchCoupons();
    } catch (e) {
      alert('Failed to delete coupon');
    }
  };

  const toggleStatus = async (coupon: Coupon) => {
    if (!coupon.id) return;
    try {
      await updateCoupon(coupon.id, { isActive: !coupon.isActive });
      fetchCoupons();
    } catch (e) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Manage Coupons</h2>
          <Link href="/admin/coupons/add" className="btn-primary">Add New Coupon</Link>
        </div>

        <div className="admin-content">
          {loading ? (
            <p>Loading coupons...</p>
          ) : coupons.length === 0 ? (
            <p className="empty-state">No coupons found. Create your first one!</p>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Min. Order</th>
                    <th>Target</th>
                    <th>Auto</th>
                    <th>Stats (Used/Limit)</th>
                    <th>Expiry</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => (
                    <tr key={coupon.id}>
                      <td style={{ fontWeight: 800 }}>{coupon.code}</td>
                      <td>{coupon.discountType}</td>
                      <td>{coupon.discountType === 'flat' ? `₹${coupon.discountValue}` : `${coupon.discountValue}%`}</td>
                      <td>₹{coupon.minOrderValue}</td>
                      <td>
                        <span className="badge-secondary" style={{ fontSize: '10px', textTransform: 'capitalize' }}>
                          {coupon.userType || 'all'}
                        </span>
                      </td>
                      <td>{coupon.autoApply ? '✅' : '❌'}</td>
                      <td>
                        <span style={{ 
                          color: coupon.usedCount >= coupon.usageLimit ? '#ef4444' : '#10b981',
                          fontWeight: 700 
                        }}>
                          {coupon.usedCount}
                        </span> / {coupon.usageLimit}
                      </td>
                      <td>
                        {(() => {
                          const expiry = coupon.expiryDate?.toDate ? coupon.expiryDate.toDate() : new Date(coupon.expiryDate);
                          const isExpired = new Date() > expiry;
                          return (
                            <span style={{ color: isExpired ? '#ef4444' : '#64748b' }}>
                              {expiry.toLocaleDateString()} {isExpired && '(Expired)'}
                            </span>
                          );
                        })()}
                      </td>
                      <td>
                        <button 
                          onClick={() => toggleStatus(coupon)}
                          className={coupon.isActive ? 'badge-success' : 'badge-danger'}
                          style={{ border: 'none', cursor: 'pointer', borderRadius: '4px', padding: '2px 8px' }}
                        >
                          {coupon.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button onClick={() => handleDelete(coupon.id)} className="btn-icon delete" title="Delete">🗑️</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
