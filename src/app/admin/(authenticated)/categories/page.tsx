'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { deleteCategory, isCategoryInUse, updateCategoryOrder } from '@/services/productService';
import { useCategories } from '@/context/CategoryContext';
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
          <button 
            className="btn-icon delete" 
            title="Delete"
            onClick={() => onInitiateDelete(cat.id, cat.name)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
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

  return (
    <div className="admin-page">
      <div className="admin-card">
        <div className="admin-card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <h2 className="admin-card-title">Categories ({categories.length})</h2>
            {hasChanges && (
              <button 
                className="btn-primary" 
                onClick={saveOrder}
                disabled={savingOrder}
                style={{ padding: '6px 16px', fontSize: '14px', background: '#10b981' }}
              >
                {savingOrder ? 'Saving...' : 'Save New Order'}
              </button>
            )}
          </div>
          <Link href="/admin/categories/add" className="btn-primary">
            + Add Category
          </Link>
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
                    items={categories.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {categories.map((cat) => (
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
    </div>
  );
}
