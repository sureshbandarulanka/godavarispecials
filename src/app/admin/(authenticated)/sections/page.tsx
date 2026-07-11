'use client';

import React, { useEffect, useState } from 'react';
import { useSections } from '@/context/SectionContext';
import { useCategories } from '@/context/CategoryContext';
import { 
  addSection, 
  updateSection, 
  deleteSection, 
  updateSectionsOrder, 
  Section 
} from '@/services/sectionService';
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
function SortableSectionRow({ 
  sec, 
  onInitiateEdit, 
  onInitiateDelete 
}: { 
  sec: Section, 
  onInitiateEdit: (sec: Section) => void,
  onInitiateDelete: (id: string, name: string) => void 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: sec.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    position: 'relative' as const,
    background: isDragging ? '#f8fafc' : undefined,
    boxShadow: isDragging ? '0 5px 15px rgba(0,0,0,0.08)' : undefined,
    opacity: sec.isDeleted ? 0.6 : 1,
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
          <div style={{ fontWeight: 600 }}>{sec.name}</div>
        </div>
      </td>
      <td>
        <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>{sec.slug}</code>
      </td>
      <td>
        {sec.type === 'dynamic' ? (
          <span className="badge-dynamic" style={{ background: '#eff6ff', color: '#1d4ed8', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
            🔥 Dynamic Section
          </span>
        ) : (
          <span className="badge-custom" style={{ background: '#fef3c7', color: '#b45309', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600 }}>
            🌟 Custom Section
          </span>
        )}
      </td>
      <td>
        <div className="actions-cell" style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn-icon"
            title="Edit"
            onClick={() => onInitiateEdit(sec)}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#475569' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button 
            className="btn-icon delete" 
            title="Delete"
            onClick={() => onInitiateDelete(sec.id, sec.name)}
            style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
      </td>
    </tr>
  );
}

export default function AdminSectionsPage() {
  const { sections: contextSections, loading, refreshSections } = useSections();
  const { categories } = useCategories();
  const [sections, setSections] = useState<Section[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [editSectionId, setEditSectionId] = useState<string | null>(null);
  
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formType, setFormType] = useState<'dynamic' | 'custom'>('custom');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  
  const [deleteData, setDeleteData] = useState<{ id: string, name: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (contextSections.length > 0) {
      setSections(contextSections);
    }
  }, [contextSections]);

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
      setSections((items) => {
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
      await updateSectionsOrder(sections.map(s => s.id));
      setToast('Sections order saved successfully!');
      setHasChanges(false);
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error(error);
      alert('Failed to save sections order');
    } finally {
      setSavingOrder(false);
    }
  };

  const handleOpenAddModal = () => {
    setModalType('add');
    setEditSectionId(null);
    setFormName('');
    setFormSlug('');
    setFormType('custom');
    setSelectedCategoryId('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (sec: Section) => {
    setModalType('edit');
    setEditSectionId(sec.id);
    setFormName(sec.name);
    setFormSlug(sec.slug);
    setFormType(sec.type);
    const matchingCat = categories.find(c => c.slug === sec.slug);
    setSelectedCategoryId(matchingCat ? matchingCat.id : '');
    setModalOpen(true);
  };

  const handleCategorySelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const catId = e.target.value;
    setSelectedCategoryId(catId);
    if (catId) {
      const cat = categories.find(c => c.id === catId);
      if (cat) {
        setFormName(cat.name);
        setFormSlug(cat.slug);
      }
    }
  };

  const generateSlug = (val: string) => {
    return val
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setFormName(name);
    if (modalType === 'add') {
      setFormSlug(generateSlug(name));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formSlug.trim()) {
      alert('Please fill out Name and Slug fields');
      return;
    }

    setSaving(true);
    try {
      if (modalType === 'add') {
        // Add new section
        await addSection({
          name: formName,
          slug: formSlug,
          type: formType,
          isActive: true
        });
        setToast('Section created successfully!');
      } else if (modalType === 'edit' && editSectionId) {
        // Update existing section
        await updateSection(editSectionId, {
          name: formName,
          slug: formSlug,
          type: formType
        });
        setToast('Section updated successfully!');
      }
      setModalOpen(false);
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error(error);
      alert('Failed to save section');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteData) return;
    setSaving(true);
    try {
      await deleteSection(deleteData.id);
      setToast('Section deleted successfully!');
      setDeleteData(null);
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error(error);
      alert('Failed to delete section');
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreDefaults = async () => {
    if (!window.confirm("Are you sure you want to restore default sections? This will re-add dynamic categories and top-selling sections.")) return;
    setSaving(true);
    try {
      await refreshSections();
      setToast("Default sections seeded!");
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      alert("Failed to restore default sections");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-card">
        <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 className="admin-card-title" style={{ fontSize: '20px', fontWeight: 700 }}>Homepage Sections Manager</h2>
            <p style={{ color: '#64748b', fontSize: '13px', margin: '4px 0 0 0' }}>
              Drag and drop rows to re-order frontend sections. Setup custom or dynamic sections below.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              className="btn-secondary" 
              onClick={handleRestoreDefaults}
              style={{ color: '#3b82f6', borderColor: '#bfdbfe' }}
              disabled={saving}
            >
              🔄 Seed Default Sections
            </button>
            <button className="btn-primary" onClick={handleOpenAddModal}>
              + Add Custom Section
            </button>
          </div>
        </div>

        {hasChanges && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fff7ed', border: '1px solid #fed7aa', padding: '12px 24px', margin: '16px 32px 0 32px', borderRadius: '12px' }}>
            <div style={{ color: '#c2410c', fontSize: '14px', fontWeight: 600 }}>
              ⚠️ You have unsaved ordering changes!
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn-secondary" 
                onClick={() => {
                  setSections(contextSections);
                  setHasChanges(false);
                }}
                disabled={savingOrder}
              >
                Reset
              </button>
              <button 
                className="btn-primary" 
                onClick={saveOrder}
                disabled={savingOrder}
                style={{ background: '#f97316', borderColor: '#f97316' }}
              >
                {savingOrder ? 'Saving...' : 'Save Re-ordering'}
              </button>
            </div>
          </div>
        )}

        <div className="admin-table-container" style={{ padding: '24px 32px' }}>
          {loading && sections.length === 0 ? (
            <div className="admin-empty">
              <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
              <p style={{ marginTop: '16px', color: '#64748b' }}>Loading homepage sections...</p>
              <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
          ) : sections.length === 0 ? (
            <div className="admin-empty">
              <div className="admin-empty-icon">📂</div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', marginBottom: '8px' }}>No sections active</h3>
              <p style={{ color: '#64748b', marginBottom: '24px' }}>Click below to seed default sections and get started.</p>
              <button className="btn-primary" onClick={handleRestoreDefaults}>Seed Default Sections</button>
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
                    <th>Section Name</th>
                    <th>Slug Identifier</th>
                    <th>Type</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <SortableContext 
                    items={sections.map(s => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {sections.map((sec) => (
                      <SortableSectionRow 
                        key={sec.id} 
                        sec={sec} 
                        onInitiateEdit={handleOpenEditModal}
                        onInitiateDelete={(id, name) => setDeleteData({ id, name })} 
                      />
                    ))}
                  </SortableContext>
                </tbody>
              </table>
            </DndContext>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 1000 }}>
          <div className="modal-content" style={{ background: '#ffffff', padding: '32px', borderRadius: '16px', maxWidth: '480px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h2 className="modal-title" style={{ fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>
              {modalType === 'add' ? 'Add Custom Section' : 'Edit Section Details'}
            </h2>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '13px' }}>Select Existing Category (Optional)</label>
                <select 
                  className="form-select" 
                  value={selectedCategoryId}
                  onChange={handleCategorySelectChange}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}
                >
                  <option value="">-- Or type manually --</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.slug})</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '13px' }}>Section Name</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formName} 
                  onChange={handleNameChange}
                  placeholder="e.g. Summer Special Mangoes"
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '13px' }}>Slug Identifier</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={formSlug} 
                  onChange={(e) => setFormSlug(generateSlug(e.target.value))}
                  placeholder="e.g. summer-special-mangoes"
                  required
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
              </div>

              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label className="form-label" style={{ fontWeight: 600, fontSize: '13px' }}>Section Type</label>
                <select 
                  className="form-select" 
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as 'dynamic' | 'custom')}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#fff' }}
                >
                  <option value="custom">🌟 Custom Section (Explicit Product Assignment)</option>
                  <option value="dynamic">🔥 Dynamic Section (Category or Rules Fallback)</option>
                </select>
                <p style={{ color: '#64748b', fontSize: '11px', margin: '4px 0 0 0' }}>
                  Custom sections display only products you explicitly assign to them. Dynamic sections match category slug fallback logic automatically.
                </p>
              </div>

              <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
                <button 
                  type="submit" 
                  className="btn-primary" 
                  disabled={saving}
                >
                  {saving ? 'Saving...' : modalType === 'add' ? 'Create Section' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteData && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 1000 }}>
          <div className="modal-content" style={{ background: '#ffffff', padding: '32px', borderRadius: '16px', maxWidth: '440px', width: '100%', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            <h2 className="modal-title" style={{ fontSize: '20px', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>Delete Homepage Section?</h2>
            <p className="modal-text" style={{ color: '#475569', fontSize: '14px', lineHeight: 1.5, marginBottom: '24px' }}>
              Are you sure you want to remove the section <strong>"{deleteData.name}"</strong>? It will no longer show up on the frontend homepage. Product data will remain untouched.
            </p>
            
            <div className="modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn-secondary" onClick={() => setDeleteData(null)}>Cancel</button>
              <button 
                className="btn-danger" 
                onClick={handleDelete}
                disabled={saving}
                style={{ background: '#ef4444', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600 }}
              >
                {saving ? 'Deleting...' : 'Delete Section'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {toast && (
        <div className="toast" style={{ position: 'fixed', bottom: '24px', right: '24px', background: '#0f172a', color: '#ffffff', padding: '12px 24px', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 1100, animation: 'slideUp 0.3s ease-out' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          <span style={{ fontSize: '14px', fontWeight: 600 }}>{toast}</span>
          <style>{`@keyframes slideUp { 0% { transform: translateY(20px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }`}</style>
        </div>
      )}
    </div>
  );
}
