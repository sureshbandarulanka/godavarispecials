'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { deleteCategory, isCategoryInUse, updateCategoryOrder, restoreCategoryAsync, emptyBinAsync } from '@/services/productService';
import { useCategories } from '@/context/CategoryContext';
import { Archive, RotateCcw, Trash2 } from 'lucide-react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Sortable Row Component
function SortableRow({ cat, onInitiateDelete }: { cat: any, onInitiateDelete: (id: string, name: string) => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: cat.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    position: 'relative' as const,
    background: isDragging ? '#f8fafc' : undefined,
    boxShadow: isDragging ? '0 5px 15px rgba(0,0,0,0.1)' : undefined,
    opacity: cat.isDeleted ? 0.7 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style}>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div 
            {...attributes} 
            {...listeners} 
            style={{ 
              cursor: 'grab', 
              color: '#94a3b8', 
              display: 'flex', 
              alignItems: 'center',
              padding: '4px'
            }}
            title="Drag to reorder"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="9" cy="5" r="1"></circle><circle cx="9" cy="19" r="1"></circle><circle cx="15" cy="12" r="1"></circle><circle cx="15" cy="5" r="1"></circle><circle cx="15" cy="19" r="1"></circle></svg>
          </div>
          <div style={{ fontWeight: 600 }}>{cat.name}</div>
        </div>
      </td>
      <td>
        <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{cat.slug}</code>
      </td>
      <td>
        <div className="actions-cell">
          {!cat.isDeleted ? (
            <>
              <Link 
                href={`/admin/categories/edit/${cat.id}`}
                className="btn-icon"
                title="Edit"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
              </Link>
              <button 
                className="btn-icon delete" 
                title="Delete"
                onClick={() => onInitiateDelete(cat.id, cat.name)}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
              </button>
            </>
          ) : (
             <button 
                className="btn-icon" 
                title="Restore"
                onClick={() => (window as any).handleCategoryRestore(cat.id)}
                style={{ color: '#10b981' }}
              >
                <RotateCcw size={16} />
              </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export default function AdminCategoriesPage() {
  const { categories: contextCategories, loading } = useCategories();
  const [categories, setCategories] = useState<any[]>([]);
  const [deleteData, setDeleteData] = useState<{ id: string, name: string, inUse: boolean } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');

  useEffect(() => {
    if (contextCategories.length > 0) {
      setCategories(contextCategories);
    }
  }, [contextCategories]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCategories((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        const newItems = arrayMove(items, oldIndex, newIndex);
        setHasChanges(true);
        return newItems;
      });
    }
  };

  const saveOrder = async () => {
    setSavingOrder(true);
    try {
      await updateCategoryOrder(categories.map(c => c.id));
      setToast('Order saved successfully!');
      setHasChanges(false);
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      alert('Failed to save order');
    } finally {
      setSavingOrder(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteData) return;
    setDeleting(true);
    try {
      await deleteCategory(deleteData.id);
      setToast('Category deleted successfully!');
      setDeleteData(null);
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      alert('Failed to delete category');
    } finally {
      setDeleting(false);
    }
  };

  const initiateDelete = (id: string, name: string) => {
    const inUse = isCategoryInUse(name);
    setDeleteData({ id, name, inUse });
  };

  const handleRestore = async (id: string) => {
    try {
      await restoreCategoryAsync(id);
      setToast('Category restored!');
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      alert('Failed to restore category');
    }
  };

  const handleEmptyBin = async () => {
    if (!window.confirm("Are you sure you want to PERMANENTLY delete all categories in the Recycle Bin?")) return;
    try {
      await emptyBinAsync("categories");
      setToast("Recycle Bin emptied");
    } catch (err) {
      alert("Failed to empty bin");
    }
  };

  // Expose restore to global window for SortableRow to access (simple hack for this context)
  useEffect(() => {
    (window as any).handleCategoryRestore = handleRestore;
  }, []);

  const filteredCategories = categories.filter(c => activeTab === 'active' ? !c.isDeleted : c.isDeleted);

  return (
    <div className="admin-page">
      <div className="admin-card">
        <div className="admin-card-header" style={{ borderBottom: 'none' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button 
              className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
              onClick={() => setActiveTab('active')}
            >
              Active Categories ({categories.filter(c => !c.isDeleted).length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'deleted' ? 'active' : ''}`}
              onClick={() => setActiveTab('deleted')}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Archive size={16} /> Recycle Bin ({categories.filter(c => c.isDeleted).length})
            </button>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
             {activeTab === 'deleted' && categories.some(c => c.isDeleted) && (
              <button 
                className="btn-secondary" 
                onClick={handleEmptyBin}
                style={{ background: '#fee2e2', color: '#ef4444', borderColor: '#fecaca' }}
              >
                Empty Bin
              </button>
            )}
            <Link href="/admin/categories/add" className="btn-primary">
              + Add Category
            </Link>
          </div>
        </div>

        <div className="admin-table-container">
          {loading && categories.length === 0 ? (
            <div className="admin-empty">
              <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
              <p style={{ marginTop: '16px', color: '#64748b' }}>Loading categories...</p>
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
          ) : categories.length === 0 ? (
            <div className="admin-empty">
              <div className="admin-empty-icon">📁</div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>No categories found</h3>
              <p style={{ color: '#64748b', marginBottom: '24px' }}>Organize your products by adding categories.</p>
              <Link href="/admin/categories/add" className="btn-primary">Add Category</Link>
            </div>
          ) : (
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Slug</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <SortableContext 
                    items={filteredCategories.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {filteredCategories.map((cat) => (
                      <SortableRow 
                        key={cat.id} 
                        cat={cat} 
                        onInitiateDelete={initiateDelete} 
                      />
                    ))}
                  </SortableContext>
                </tbody>
              </table>
            </DndContext>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteData && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">Delete Category?</h2>
            
            {deleteData.inUse ? (
              <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', padding: '16px', borderRadius: '12px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <svg style={{ color: '#f97316', flexShrink: 0 }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
                  <div>
                    <h4 style={{ color: '#9a3412', fontSize: '14px', margin: '0 0 4px 0' }}>Warning: In Use</h4>
                    <p style={{ color: '#c2410c', fontSize: '13px', margin: 0 }}>This category is currently being used by products. Deleting it may cause issues with filtering.</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="modal-text">Are you sure you want to delete the category <strong>"{deleteData.name}"</strong>? This action cannot be undone.</p>
            )}
            
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDeleteData(null)}>Cancel</button>
              <button 
                className="btn-danger" 
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Delete Category'}
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
