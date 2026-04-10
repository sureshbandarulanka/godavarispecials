'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addCategory, uploadCategoryIcon } from '@/services/productService';
import { useCategories } from '@/context/CategoryContext';
import Link from 'next/link';

export default function AddCategoryPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { categories: existingCategories } = useCategories();

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    
    // Auto-generate slug: lowercase + hyphen format
    const newSlug = newName
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // remove non-word chars
      .replace(/[\s_-]+/g, '-') // replace space/underscore with hyphen
      .replace(/^-+|-+$/g, ''); // remove leading/trailing hyphens
    
    setSlug(newSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Duplicate Check
    const isDuplicateName = existingCategories.some(c => c.name.toLowerCase() === name.toLowerCase().trim());
    const isDuplicateSlug = existingCategories.some(c => c.slug === slug);

    if (isDuplicateName) {
      alert('A category with this name already exists.');
      return;
    }

    if (isDuplicateSlug) {
      alert('A category with this slug already exists.');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        try {
          imageUrl = await uploadCategoryIcon(slug, imageFile);
        } catch (uploadError) {
          console.error("Image upload failed:", uploadError);
          alert("Image upload failed (Firebase Storage issue). Proceeding to create category without image.");
          // keep imageUrl empty but continue
        }
      }

      await addCategory({ 
        name: name.trim(), 
        slug, 
        imageUrl 
      });
      setToast('Category added successfully!');
      setTimeout(() => {
        router.push('/admin/categories');
      }, 2000);
    } catch (error) {
      alert('Failed to add category: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-card" style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="admin-card-header">
          <h2 className="admin-card-title">Add New Category</h2>
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
                onChange={handleNameChange}
                placeholder="e.g. Traditional Pickles"
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category Icon (Optional)</label>
              <input 
                type="file" 
                className="form-input" 
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0];
                    if (file.size > 10 * 1024 * 1024) {
                      alert('Image size must be less than 10MB');
                      e.target.value = '';
                      return;
                    }
                    setImageFile(file);
                  }
                }}
              />
              <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                Max size: 10MB. (Auto-compressed for fast loading).
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Slug (Auto-generated)</label>
              <input 
                type="text" 
                className="form-input" 
                value={slug}
                readOnly
                disabled
                style={{ background: '#f8fafc', color: '#64748b', cursor: 'not-allowed' }}
              />
              <span style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                Slugs are locked for SEO stability once created.
              </span>
            </div>

            <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button 
                type="submit" 
                className="btn-primary" 
                style={{ minWidth: '150px' }}
                disabled={loading || !name.trim()}
              >
                {loading ? 'Creating...' : 'Create Category'}
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
