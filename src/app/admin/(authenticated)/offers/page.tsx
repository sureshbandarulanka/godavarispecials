'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { getOffers, deleteOffer, Offer } from '@/services/offerService';

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    setLoading(true);
    try {
      const data = await getOffers();
      setOffers(data);
    } catch (error) {
      console.error('Error loading offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    console.log('Final Delete initiated for ID:', id);
    try {
      setLoading(true); // Show loading during delete
      await deleteOffer(id);
      console.log('Delete successful in UI handler');
      setDeletingId(null);
      await loadOffers();
    } catch (error) {
      console.error('Delete error in UI:', error);
      alert('Failed to delete offer. Check console.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      {/* Simple Confirmation Modal */}
      {deletingId && (
        <div className="admin-modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div className="admin-modal" style={{
            backgroundColor: 'white', padding: '24px', borderRadius: '12px',
            maxWidth: '400px', width: '90%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ marginBottom: '12px' }}>Confirm Delete</h3>
            <p style={{ marginBottom: '24px', color: '#64748b' }}>
              Are you sure you want to delete this offer? This action cannot be undone.
            </p>
            <div className="admin-modal-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button 
                className="btn-secondary" 
                onClick={() => setDeletingId(null)}
                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid #e2e8f0' }}
              >
                Cancel
              </button>
              <button 
                className="btn-danger" 
                onClick={() => handleDelete(deletingId)}
                style={{ padding: '8px 16px', borderRadius: '6px', backgroundColor: '#ef4444', color: 'white', border: 'none' }}
              >
                Delete Now
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Manage Offers</h2>
          <Link href="/admin/offers/add" className="btn-primary">
            + Add New Offer
          </Link>
        </div>

        <div className="admin-content">
          {loading && !deletingId ? (
            <div style={{ padding: '40px', textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto' }}></div>
              <p style={{ marginTop: '16px', color: '#64748b' }}>Loading offers...</p>
            </div>
          ) : offers.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
              <p>No offers found. Create your first offer to get started!</p>
            </div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Offer Title</th>
                    <th>Product ID</th>
                    <th>Discount</th>
                    <th>Price</th>
                    <th>Period</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((offer) => (
                    <tr key={offer.id}>
                      <td style={{ fontWeight: 600 }}>{offer.title}</td>
                      <td style={{ fontSize: '12px', color: '#64748b' }}>{offer.productId}</td>
                      <td>
                        <span style={{ color: '#ef4444', fontWeight: 700 }}>{offer.discountPercent}% OFF</span>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', textDecoration: 'line-through', color: '#94a3b8' }}>₹{offer.originalPrice}</div>
                        <div style={{ fontWeight: 700, color: '#10b981' }}>₹{offer.offerPrice}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Start: {offer.startDate?.toDate()?.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          End: {offer.endDate?.toDate()?.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${offer.isActive ? 'badge-success' : 'badge-danger'}`}>
                          {offer.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="admin-table-actions">
                          <button 
                            className="btn-icon delete" 
                            onClick={() => offer.id && setDeletingId(offer.id)}
                            title="Delete Offer"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                          </button>
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
