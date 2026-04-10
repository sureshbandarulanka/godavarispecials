'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getProducts, fetchFirebaseData, deleteProduct, deleteProductsBulk } from '@/services/productService';
import { Product } from '@/data/products';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    await fetchFirebaseData();
    setProducts(getProducts());
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteId.toString());
      setToast('Product deleted successfully!');
      setDeleteId(null);
      await loadData();
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      alert('Failed to delete product');
    } finally {
      setDeleting(false);
    }
  };

  // Bulk Action Handlers
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    setIsBulkDeleting(true);
    try {
      await deleteProductsBulk(selectedIds.map(id => id.toString()));
      setToast(`${selectedIds.length} products deleted successfully!`);
      setSelectedIds([]);
      setIsBulkConfirmOpen(false);
      await loadData();
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      alert('Failed to delete some products');
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === products.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(products.map(p => p.id));
    }
  };

  const toggleSelect = (id: string | number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const getMinPrice = (product: Product) => {
    if (!product.variants || product.variants.length === 0) return 'N/A';
    const prices = product.variants.map(v => v.price);
    return `₹${Math.min(...prices)}`;
  };

  return (
    <div className="admin-page">
      {/* Bulk Global Action Bar */}
      {selectedIds.length > 0 && (
        <div className="bulk-action-bar active">
          <div className="bulk-info">
            <span className="selected-count">{selectedIds.length}</span> items selected
          </div>
          <div className="bulk-actions">
            <button 
              className="btn-bulk-delete" 
              onClick={() => setIsBulkConfirmOpen(true)}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              Delete Selected
            </button>
            <button className="btn-bulk-cancel" onClick={() => setSelectedIds([])}>Cancel</button>
          </div>
        </div>
      )}

      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Products ({products.length})</h2>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Link href="/admin/products/bulk-upload" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Bulk Upload
            </Link>
            <Link href="/admin/products/add" className="btn-primary">
              + Add Product
            </Link>
          </div>
        </div>

        <div className="admin-table-container">
          {loading ? (
            <div className="admin-empty">
              <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
              <p style={{ marginTop: '16px', color: '#64748b' }}>Loading products...</p>
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
          ) : products.length === 0 ? (
            <div className="admin-empty">
              <div className="admin-empty-icon">📦</div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>No products found</h3>
              <p style={{ color: '#64748b', marginBottom: '24px' }}>Start by adding your first product to the catalog.</p>
              <Link href="/admin/products/add" className="btn-primary">Add Product</Link>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input 
                      type="checkbox" 
                      className="admin-checkbox"
                      checked={products.length > 0 && selectedIds.length === products.length}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price (from)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className={selectedIds.includes(product.id) ? 'row-selected' : ''}>
                    <td>
                      <input 
                        type="checkbox" 
                        className="admin-checkbox"
                        checked={selectedIds.includes(product.id)}
                        onChange={() => toggleSelect(product.id)}
                      />
                    </td>
                    <td>
                      <div className="product-cell">
                        <img 
                          src={product.image || 'https://via.placeholder.com/100?text=No+Image'} 
                          alt={product.name} 
                          className="product-img"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=No+Image';
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 600 }}>{product.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>ID: {product.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-info">{product.category}</span>
                    </td>
                    <td>{getMinPrice(product)}</td>
                    <td>
                      <div className="actions-cell">
                        <Link href={`/admin/products/edit/${product.id}`} className="btn-icon" title="Edit">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                        </Link>
                        <button 
                          className="btn-icon delete" 
                          title="Delete"
                          onClick={() => setDeleteId(product.id)}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Bulk Delete Modal */}
      {isBulkConfirmOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">Delete {selectedIds.length} Products?</h2>
            <p className="modal-text">Are you sure you want to delete these products? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setIsBulkConfirmOpen(false)}>Cancel</button>
              <button 
                className="btn-danger" 
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
              >
                {isBulkDeleting ? 'Deleting...' : `Yes, Delete ${selectedIds.length} Products`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Single Delete Confirmation Modal */}
      {deleteId && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">Delete Product?</h2>
            <p className="modal-text">Are you sure you want to delete this product? This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDeleteId(null)}>Cancel</button>
              <button 
                className="btn-danger" 
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {toast && (
        <div className="toast">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          {toast}
        </div>
      )}

      <style jsx>{`
        .bulk-action-bar {
          position: fixed;
          top: -100px;
          left: 50%;
          transform: translateX(-50%);
          background: #1e293b;
          color: white;
          padding: 12px 24px;
          border-radius: 50px;
          display: flex;
          align-items: center;
          gap: 24px;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1000;
        }

        .bulk-action-bar.active {
          top: 24px;
        }

        .bulk-info {
          font-weight: 500;
          font-size: 14px;
        }

        .selected-count {
          background: #3b82f6;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: 700;
          margin-right: 4px;
        }

        .bulk-actions {
          display: flex;
          gap: 12px;
        }

        .btn-bulk-delete {
          background: #ef4444;
          color: white;
          border: none;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .btn-bulk-cancel {
          background: transparent;
          color: #94a3b8;
          border: 1px solid #334155;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
        }

        .admin-checkbox {
          width: 18px;
          height: 18px;
          cursor: pointer;
          accent-color: #3b82f6;
        }

        .row-selected {
          background-color: #f1f5f9;
        }
      `}</style>
    </div>
  );
}
