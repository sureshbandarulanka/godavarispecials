'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { getCategoryByIdAsync, updateCategory, uploadCategoryIcon } from '@/services/productService';
import Link from 'next/link';

export default function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [types, setTypes] = useState<string[]>([]);
  const [newType, setNewType] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    const loadCategory = async () => {
      try {
        const cat = await getCategoryByIdAsync(id);
        if (cat) {
          setName(cat.name);
          setSlug(cat.slug);
          setTypes(cat.types || []);
          setImageUrl(cat.imageUrl || '');
        } else {
          alert('Category not found');
          router.push('/admin/categories');
        }
      } catch (error) {
        console.error('Error loading category:', error);
      } finally {
        setLoading(false);
      }
    };
    loadCategory();
  }, [id, router]);

  const addType = () => {
    if (newType.trim() && !types.includes(newType.trim())) {
      setTypes([...types, newType.trim()]);
      setNewType('');
    }
  };

  const removeType = (index: number) => {
    setTypes(types.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    try {
      let finalImageUrl = imageUrl;
      if (imageFile) {
        finalImageUrl = await uploadCategoryIcon(slug, imageFile);
      }

      await updateCategory(id, { 
        name: name.trim(), 
        types,
        imageUrl: finalImageUrl 
      });
      setToast('Category updated successfully!');
      setTimeout(() => {
        router.push('/admin/categories');
      }, 2000);
    } catch (error) {
      alert('Failed to update category: ' + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-card">
          <div className="admin-empty">
            <div className="spinner"></div>
            <p>Loading category details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="admin-card-header">
          <h2 className="admin-card-title">Edit Category</h2>
          <Link href="/admin/categories" className="btn-secondary">Cancel</Link>
        </div>

        <div className="admin-content" style={{ padding: '32px' }}>
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Category Name</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Product Types / Filters</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <input 
                  type="text" 
                  className="form-input" 
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  placeholder="e.g. Veg Pickles"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addType())}
                />
                <button type="button" className="btn-primary" onClick={addType}>Add</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {types.map((type, idx) => (
                  <div key={idx} style={{ 
                    background: '#eff6ff', 
                    color: '#3b82f6', 
                    padding: '4px 12px', 
                    borderRadius: '99px', 
                    fontSize: '13px', 
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    {type}
                    <button 
                      type="button" 
                      onClick={() => removeType(idx)}
                      style={{ border: 'none', background: 'none', color: '#3b82f6', cursor: 'pointer', fontSize: '16px', display: 'flex' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>
                These types will appear as filters on the category page and as options when adding products.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Category Icon</label>
              {imageUrl && !imageFile && (
                <div style={{ marginBottom: '12px' }}>
                  <img src={imageUrl} alt="Current Icon" style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #eee' }} />
                </div>
              )}
              <input 
                type="file" 
                className="form-input" 
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setImageFile(e.target.files[0]);
                  }
                }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Slug (Locked)</label>
              <input 
                type="text" 
                className="form-input" 
                value={slug}
                readOnly
                disabled
                style={{ background: '#f8fafc', color: '#64748b' }}
              />
            </div>

            <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button 
                type="submit" 
                className="btn-primary" 
                style={{ minWidth: '150px' }}
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Update Category'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {toast && (
        <div className="toast">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          {toast}
        </div>
      )}
    </div>
  );
}
