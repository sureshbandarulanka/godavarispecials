'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { getProducts, fetchFirebaseData, deleteProduct, deleteProductsBulk, restoreProductAsync, emptyBinAsync, getCategoriesAsync, updateProductsOrder } from '@/services/productService';
import { Archive, RotateCcw, Trash2, GripVertical } from 'lucide-react';
import { Product } from '@/data/products';
import {
  DndContext,
  closestCenter,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  TouchSensor,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Bulk Selection State
  const [selectedIds, setSelectedIds] = useState<(string | number)[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [isBulkConfirmOpen, setIsBulkConfirmOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    await fetchFirebaseData();
    const cats = await getCategoriesAsync();
    setCategories(cats);
    setProducts(getProducts());
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor)
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    console.log('Drag End:', { activeId: active.id, overId: over?.id });

    if (over && active.id !== over.id) {
      const oldIndex = products.findIndex((p) => p.id.toString() === active.id.toString());
      const newIndex = products.findIndex((p) => p.id.toString() === over.id.toString());

      if (oldIndex !== -1 && newIndex !== -1) {
        console.log('Moving from', oldIndex, 'to', newIndex);
        const newOrder = arrayMove(products, oldIndex, newIndex);
        setProducts(newOrder);

        try {
          const activeProducts = newOrder.filter(p => !p.isDeleted);
          await updateProductsOrder(activeProducts.map(p => p.id.toString()));
          setToast('Order updated successfully!');
          setTimeout(() => setToast(null), 2000);
        } catch (err) {
          console.error('Failed to update order:', err);
          setToast('Failed to save order');
          loadData();
        }
      }
    }
  };

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

  const handleRestore = async (id: string | number) => {
    try {
      await restoreProductAsync(id.toString());
      setToast('Product restored successfully!');
      await loadData();
    } catch (err) {
      alert('Failed to restore product');
    }
  };

  const handleEmptyBin = async () => {
    if (!window.confirm("Are you sure you want to PERMANENTLY delete all products in the Recycle Bin?")) return;
    try {
      await emptyBinAsync("products");
      setToast("Recycle Bin emptied");
      await loadData();
    } catch (err) {
      alert("Failed to empty bin");
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesTab = activeTab === 'active' ? !p.isDeleted : p.isDeleted;
    const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchesTab && matchesCategory;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map(p => p.id));
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
        <div className="admin-card-header" style={{ borderBottom: 'none' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <button
              className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
              onClick={() => setActiveTab('active')}
            >
              Active Products ({products.filter(p => !p.isDeleted).length})
            </button>
            <button
              className={`tab-btn ${activeTab === 'deleted' ? 'active' : ''}`}
              onClick={() => setActiveTab('deleted')}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Archive size={16} /> Recycle Bin ({products.filter(p => p.isDeleted).length})
            </button>
            <div style={{ marginLeft: '12px', borderLeft: '1px solid #e2e8f0', paddingLeft: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Filter:</span>
              <select
                className="admin-select"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', background: 'white' }}
              >
                <option value="All">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
            </div>
            {activeTab === 'active' && selectedCategory !== 'All' && (
              <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 600, background: '#eff6ff', padding: '4px 10px', borderRadius: '20px' }}>
                Drag products to reorder
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            {activeTab === 'deleted' && products.some(p => p.isDeleted) && (
              <button
                className="btn-secondary"
                onClick={handleEmptyBin}
                style={{ background: '#fee2e2', color: '#ef4444', borderColor: '#fecaca' }}
              >
                Empty Bin
              </button>
            )}
            <Link href="/admin/products/bulk-upload" className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
              Bulk Upload
            </Link>
            <Link href="/admin/products/add" className="btn-primary">
              + Add Product
            </Link>
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragEnd={handleDragEnd}
        >
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
              <table className="admin-table" style={{ borderCollapse: 'separate', borderSpacing: '0 8px' }}>
                <thead>
                  <tr style={{ background: 'transparent' }}>
                    <th style={{ width: '40px', background: 'transparent', border: 'none' }}>
                      <input
                        type="checkbox"
                        className="admin-checkbox"
                        checked={products.length > 0 && selectedIds.length === products.length}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th style={{ background: 'transparent', border: 'none' }}>Product</th>
                    <th style={{ background: 'transparent', border: 'none' }}>Category</th>
                    <th style={{ background: 'transparent', border: 'none' }}>Price (from)</th>
                    <th style={{ background: 'transparent', border: 'none' }}>Actions</th>
                  </tr>
                </thead>
                <tbody style={{ borderCollapse: 'separate' }}>
                  <SortableContext
                    items={filteredProducts.map(p => p.id.toString())}
                    strategy={verticalListSortingStrategy}
                  >
                    {filteredProducts.map((product) => (
                      <SortableProductRow
                        key={product.id}
                        product={product}
                        selectedIds={selectedIds}
                        toggleSelect={toggleSelect}
                        setDeleteId={setDeleteId}
                        handleRestore={handleRestore}
                        activeTab={activeTab}
                        selectedCategory={selectedCategory}
                      />
                    ))}
                  </SortableContext>
                </tbody>
              </table>
            )}
          </div>
        </DndContext>
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
        /* Fix for table row dragging */
        :global(.admin-table) {
          border-collapse: separate !important;
          border-spacing: 0 4px !important;
        }

        :global(.admin-table tr) {
          position: relative;
        }

        .drag-handle {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .drag-handle:hover:not([style*="not-allowed"]) {
          background: #eff6ff;
          color: #3b82f6 !important;
        }

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

        .tab-btn {
          padding: 8px 16px;
          border: none;
          background: none;
          color: #64748b;
          font-weight: 600;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }
        .tab-btn.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
          background: #eff6ff;
          border-radius: 8px 8px 0 0;
        }
      `}</style>
    </div>
  );
}

// Sortable Row Component moved OUTSIDE to prevent re-renders breaking focus
const SortableProductRow = ({
  product,
  selectedIds,
  toggleSelect,
  setDeleteId,
  handleRestore,
  activeTab,
  selectedCategory
}: any) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: product.id.toString() });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.6 : 1,
    background: isDragging ? '#f8fafc' : 'transparent',
  };

  const getMinPrice = (product: Product) => {
    if (!product.variants || product.variants.length === 0) return 'N/A';
    const prices = product.variants.map(v => v.price);
    return `₹${Math.min(...prices)}`;
  };

  return (
    <tr
      ref={setNodeRef}
      className={`${selectedIds.includes(product.id) ? 'row-selected' : ''} ${isDragging ? 'dragging-row' : ''}`}
      style={{
        ...style,
        opacity: product.isDeleted ? 0.7 : (isDragging ? 0.8 : 1),
        boxShadow: isDragging ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' : 'none',
        background: isDragging ? '#ffffff' : (selectedIds.includes(product.id) ? '#f1f5f9' : 'transparent'),
        outline: isDragging ? '2px solid #3b82f6' : 'none',
        borderRadius: '8px'
      }}
    >
      <td style={{ borderTopLeftRadius: '8px', borderBottomLeftRadius: '8px', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', borderLeft: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {activeTab === 'active' && (
            <div
              {...(selectedCategory !== 'All' ? { ...attributes, ...listeners } : {})}
              className="drag-handle"
              style={{
                cursor: selectedCategory !== 'All' ? 'grab' : 'not-allowed',
                color: selectedCategory !== 'All' ? '#3b82f6' : '#cbd5e1',
                opacity: selectedCategory !== 'All' ? 1 : 0.4
              }}
              title={selectedCategory !== 'All' ? "Drag to reorder" : "Select a category to enable reordering"}
            >
              <GripVertical size={18} />
            </div>
          )}
          <input
            type="checkbox"
            className="admin-checkbox"
            checked={selectedIds.includes(product.id)}
            onChange={() => toggleSelect(product.id)}
          />
        </div>
      </td>
      <td style={{ borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <div className="product-cell">
          <img
            src={product.image || product.imageUrl || 'https://via.placeholder.com/100?text=No+Image'}
            alt={product.name}
            className="product-img"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/100?text=No+Image';
            }}
          />
          <div>
            <div style={{ fontWeight: 600 }}>{product.name}</div>
            <div style={{ fontSize: '12px', color: '#64748b' }}>ID: {product.id}</div>
            {product.isOutOfStock && (
              <span style={{
                fontSize: '10px',
                background: '#fef2f2',
                color: '#ef4444',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 700,
                border: '1px solid #fee2e2',
                display: 'inline-block',
                marginTop: '4px'
              }}>
                OUT OF STOCK
              </span>
            )}
          </div>
        </div>
      </td>
      <td style={{ borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
        <span className="badge badge-info">{product.category}</span>
      </td>
      <td style={{ borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>{getMinPrice(product)}</td>
      <td style={{ borderTopRightRadius: '8px', borderBottomRightRadius: '8px', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0' }}>
        <div className="actions-cell">
          {!product.isDeleted ? (
            <>
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
            </>
          ) : (
            <button
              className="btn-icon"
              title="Restore"
              onClick={() => handleRestore(product.id)}
              style={{ color: '#10b981' }}
            >
              <RotateCcw size={18} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};
