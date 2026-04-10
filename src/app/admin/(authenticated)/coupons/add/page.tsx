'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { addCoupon } from '@/services/couponService';
import { Timestamp } from 'firebase/firestore';

export default function AddCouponPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'flat' | 'percentage'>('flat');
  const [discountValue, setDiscountValue] = useState(0);
  const [maxDiscount, setMaxDiscount] = useState<number | undefined>(undefined);
  const [minOrderValue, setMinOrderValue] = useState(249); // Default ₹249
  const [usageLimit, setUsageLimit] = useState(100);
  const [perUserLimit, setPerUserLimit] = useState(1);
  const [priority, setPriority] = useState(1);
  const [userType, setUserType] = useState<'all' | 'new' | 'repeat'>('all');
  const [autoApply, setAutoApply] = useState(false);
  const [expiryDate, setExpiryDate] = useState(() => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    return new Date(nextMonth.getTime() - nextMonth.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [isActive, setIsActive] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || discountValue <= 0) {
      alert('Please fill all required fields correctly');
      return;
    }

    setLoading(true);
    try {
      const couponData = {
        code: code.toUpperCase().trim(),
        discountType,
        discountValue,
        maxDiscount: maxDiscount || null,
        minOrderValue,
        usageLimit,
        usedCount: 0,
        perUserLimit,
        priority,
        userType,
        autoApply,
        isStackable: false, // Default to false for safety
        expiryDate: Timestamp.fromDate(new Date(expiryDate)),
        isActive
      };

      await addCoupon(couponData as any);
      router.push('/admin/coupons');
    } catch (error) {
      console.error("Error creating coupon:", error);
      alert("Failed to create coupon: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="admin-card-header">
          <h2 className="admin-card-title">Add New Coupon</h2>
          <Link href="/admin/coupons" className="btn-secondary">Cancel</Link>
        </div>

        <div className="admin-content" style={{ padding: '32px' }}>
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Coupon Code (e.g., SAVE50)</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="PROMO20"
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Discount Type</label>
                <select 
                  className="form-select" 
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as any)}
                >
                  <option value="flat">Flat ₹ Discount</option>
                  <option value="percentage">% Percentage</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Discount Value</label>
                <input 
                  type="number" 
                  className="form-input" 
                  required 
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  min="1"
                />
              </div>
            </div>

            {discountType === 'percentage' && (
              <div className="form-group">
                <label className="form-label">Max Discount (₹) (Optional)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={maxDiscount || ''}
                  onChange={(e) => setMaxDiscount(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="e.g. 50 (If ₹50 is max discount regardless of %)"
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Minimum Order Value (₹)</label>
              <input 
                type="number" 
                className="form-input" 
                required 
                value={minOrderValue}
                onChange={(e) => setMinOrderValue(Number(e.target.value))}
                min="0"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Total Usage Limit</label>
                <input 
                  type="number" 
                  className="form-input" 
                  required 
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(Number(e.target.value))}
                  min="1"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Per User Limit</label>
                <input 
                  type="number" 
                  className="form-input" 
                  required 
                  value={perUserLimit}
                  onChange={(e) => setPerUserLimit(Number(e.target.value))}
                  min="1"
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Admin Priority (1-100)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  required 
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  min="1"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Target User Group</label>
                <select 
                  className="form-select" 
                  value={userType}
                  onChange={(e) => setUserType(e.target.value as any)}
                >
                  <option value="all">All Users</option>
                  <option value="new">New Customers Only</option>
                  <option value="repeat">Repeat Customers Only</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Expiry Date & Time</label>
              <input 
                type="datetime-local" 
                className="form-input" 
                required 
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '24px', marginBottom: '24px' }}>
              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  id="auto-apply-toggle" 
                  checked={autoApply} 
                  onChange={(e) => setAutoApply(e.target.checked)} 
                />
                <label htmlFor="auto-apply-toggle" style={{ fontWeight: 600 }}>Enable Auto-Apply</label>
              </div>

              <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  id="active-toggle" 
                  checked={isActive} 
                  onChange={(e) => setIsActive(e.target.checked)} 
                />
                <label htmlFor="active-toggle" style={{ fontWeight: 600 }}>Active Status</label>
              </div>
            </div>

            <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button 
                type="submit" 
                className="btn-primary" 
                style={{ minWidth: '200px' }}
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Save Coupon'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
