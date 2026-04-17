'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  getAdminBanners, 
  deleteBanner, 
  toggleBannerStatus, 
  updateBannersOrder,
  Banner 
} from '@/services/bannerService';
import {
  DndContext, 
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  TouchSensor
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Skeleton Loader Component
const BannerSkeleton = () => (
  <div className="admin-skeleton-grid">
    {[1, 2, 3].map((i) => (
      <div key={i} className="skeleton-card"></div>
    ))}
  </div>
);

// Preview Modal Component
const PreviewModal = ({ banner, onClose }: { banner: Banner, onClose: () => void }) => (
  <div className="modal-overlay" onClick={onClose}>
    <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 className="modal-title">Banner Preview</h3>
        <button onClick={onClose} className="btn-icon">✕</button>
      </div>
      <div style={{ position: 'relative', width: '100%', aspectRatio: '21/9', borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
        <Image src={banner.imageUrl} alt="Banner" fill style={{ objectFit: 'cover' }} />
      </div>
      <div className="admin-form">
        <div className="form-group">
          <label className="form-label">Redirect Target</label>
          <div className="form-input" style={{ background: '#f8fafc' }}>
            {banner.type === 'product' ? `Product: ${banner.referenceId}` : 
             banner.type === 'category' ? `Category: ${banner.referenceId}` : 
             banner.redirectUrl || '/'}
          </div>
        </div>
        {banner.tagline && (
          <div className="form-group">
            <label className="form-label">Tagline</label>
            <div className="form-input" style={{ background: '#f8fafc' }}>{banner.tagline}</div>
          </div>
        )}
      </div>
      <div className="modal-actions" style={{ marginTop: '24px' }}>
        <button className="btn-secondary" onClick={onClose}>Close Preview</button>
        <Link href={`/admin/banners/edit/${banner.id}`} className="btn-primary">Edit This Banner</Link>
      </div>
    </div>
  </div>
);

// Sortable Item Component
const SortableBannerItem = ({ 
  banner, 
  actionLoading, 
  onToggleStatus, 
  onDelete, 
  onPreview 
}: { 
  banner: Banner, 
  actionLoading: string | null,
  onToggleStatus: any,
  onDelete: any,
  onPreview: any
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: banner.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 100 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className="admin-item-card"
      onClick={() => onPreview(banner)}
    >
      {/* Drag Handle */}
      <div className="drag-handle" {...attributes} {...listeners} onClick={e => e.stopPropagation()}>
         <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
           <circle cx="9" cy="5" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="19" r="1"/>
           <circle cx="15" cy="5" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="19" r="1"/>
         </svg>
      </div>

      <div className="admin-item-actions">
        <Link 
          href={`/admin/banners/edit/${banner.id}`}
          className="btn-icon"
          onClick={(e) => e.stopPropagation()}
          title="Edit Banner"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
        </Link>
        <button 
          className="btn-icon" 
          onClick={(e) => onToggleStatus(e, banner.id, banner.isActive)}
          disabled={actionLoading === banner.id}
          title={banner.isActive ? 'Deactivate' : 'Activate'}
        >
          {banner.isActive ? '🚫' : '✅'}
        </button>
        <button 
          className="btn-icon delete"
          onClick={(e) => onDelete(e, banner.id, banner.imageUrl)}
          disabled={actionLoading === banner.id}
          title="Delete"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </div>

      <div style={{ position: 'relative', width: '100%', aspectRatio: '21/9' }}>
        <Image 
          src={banner.imageUrl || "/placeholder.png"} 
          alt="Banner" 
          width={400} 
          height={171} 
          className="admin-item-image"
        />
      </div>

      <div className="admin-item-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <span className={`status-badge ${banner.isActive ? 'active' : 'inactive'}`}>
            {banner.isActive ? 'Active' : 'Inactive'}
          </span>
          <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>ORDER: {banner.priority + 1}</span>
        </div>

        <h3 className="admin-item-title">{banner.type?.toUpperCase() || 'GENERAL'} BANNER</h3>
        <p className="admin-item-subtitle">{banner.tagline || 'No tagline set'}</p>
      </div>
    </div>
  );
};

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [previewBanner, setPreviewBanner] = useState<Banner | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor)
  );

  useEffect(() => {
    loadBanners();
  }, []);

  const loadBanners = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminBanners();
      setBanners(data);
    } catch (err) {
      console.error('Failed to load banners:', err);
      setError('Failed to load banners. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (e: React.MouseEvent, id: string, currentStatus: boolean) => {
    e.stopPropagation(); // Don't trigger card click (preview)
    try {
      setActionLoading(id);
      await toggleBannerStatus(id, !currentStatus);
      setBanners(banners.map((b: Banner) => b.id === id ? { ...b, isActive: !currentStatus } : b));
    } catch (err) {
      alert('Failed to update status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string, imageUrl: string) => {
    e.stopPropagation(); // Don't trigger card click (preview)
    if (!confirm('Are you sure you want to delete this banner? This action cannot be undone.')) return;

    try {
      setActionLoading(id);
      await deleteBanner(id, imageUrl);
      setBanners(banners.filter((b: Banner) => b.id !== id));
    } catch (err) {
      alert('Failed to delete banner');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = banners.findIndex((b: Banner) => b.id === active.id);
      const newIndex = banners.findIndex((b: Banner) => b.id === over.id);

      const newOrder = arrayMove(banners, oldIndex, newIndex);
      setBanners(newOrder);

      try {
        await updateBannersOrder(newOrder);
      } catch (err) {
        alert('Failed to save new order. Reverting changes.');
        loadBanners();
      }
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2 className="admin-card-title">Banner Management</h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
              Manage homepage sliders and promotional banners
            </p>
          </div>
          <Link href="/admin/banners/add" className="btn-primary">
            + Add Banner
          </Link>
        </div>

        <div className="admin-content" style={{ padding: '24px' }}>
          {error && (
            <div className="admin-error" style={{ textAlign: 'center', padding: '40px', background: '#fef2f2', borderRadius: '12px', color: '#dc2626' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>⚠️</div>
              <p>{error}</p>
              <button onClick={loadBanners} className="btn-secondary" style={{ marginTop: '16px' }}>Try Again</button>
            </div>
          )}

          {!error && loading && <BannerSkeleton />}

          {!error && !loading && banners.length === 0 && (
            <div className="admin-empty">
              <div className="admin-empty-icon">🖼️</div>
              <h3>No Banners Added Yet</h3>
              <p>Start promoting your products with beautiful banners.</p>
            </div>
          )}

          {!error && !loading && banners.length > 0 && (
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={banners.map((b: Banner) => b.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="admin-grid">
                  {banners.map((banner: Banner) => (
                    <SortableBannerItem 
                      key={banner.id}
                      banner={banner}
                      actionLoading={actionLoading}
                      onToggleStatus={handleToggleStatus}
                      onDelete={handleDelete}
                      onPreview={setPreviewBanner}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {previewBanner && (
        <PreviewModal 
          banner={previewBanner} 
          onClose={() => setPreviewBanner(null)} 
        />
      )}
    </div>
  );
}
