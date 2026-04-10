'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { addBanner, uploadBannerImage } from '@/services/bannerService';
import { getCategoriesAsync, getProductsAsync } from '@/services/productService';

export default function AddBannerPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    type: 'custom' as 'product' | 'category' | 'custom',
    referenceId: '',
    redirectUrl: '',
    tagline: '',
    isActive: true,
    priority: 1
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data for dropdowns
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string; category: string }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cats, prods] = await Promise.all([
          getCategoriesAsync(),
          getProductsAsync()
        ]);
        setCategories(cats);
        setProducts(prods);
      } catch (err) {
        console.error('Error fetching dropdown data:', err);
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size must be less than 10MB');
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleTypeChange = (newType: 'product' | 'category' | 'custom') => {
    setFormData({
      ...formData,
      type: newType,
      referenceId: '', // Reset reference
      redirectUrl: ''  // Reset redirect
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // ✅ VALIDATION
    if (!imageFile) {
        setError('Banner image is required');
        return;
    }

    if (formData.type === 'product' && !formData.referenceId) {
        setError('Please select a product');
        return;
    }

    if (formData.type === 'category' && !formData.referenceId) {
        setError('Please select a category');
        return;
    }

    if (formData.type === 'custom' && !formData.redirectUrl) {
        setError('Redirect URL is required for custom type');
        return;
    }

    if (formData.redirectUrl && !formData.redirectUrl.startsWith('/') && !formData.redirectUrl.startsWith('http')) {
        setError('Redirect URL must be a relative path (starting with /) or a full URL');
        return;
    }

    try {
      setLoading(true);
      
      // 1. Upload Image
      const imageUrl = await uploadBannerImage(imageFile);

      // 2. Add Banner Document
      await addBanner({
        ...formData,
        imageUrl,
        priority: Number(formData.priority)
      });

      router.push('/admin/banners');
    } catch (err: any) {
      console.error('Error adding banner:', err);
      setError(err.message || 'Failed to add banner. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2 className="admin-card-title">Add New Banner</h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Create a new promotional banner for the homepage</p>
          </div>
          <button onClick={() => router.back()} className="btn-secondary">
            ← Back to List
          </button>
        </div>

        <div className="admin-content" style={{ padding: '24px' }}>
          <form onSubmit={handleSubmit} className="admin-form">
            <div style={{ maxWidth: '600px' }}>
              {/* Banner Image */}
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">Banner Image (Required)</label>
                <div 
                  className={`admin-file-dropzone ${imagePreview ? 'has-preview' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  style={{ height: '200px', cursor: 'pointer' }}
                >
                  {imagePreview ? (
                    <div className="admin-preview-container" style={{ position: 'relative', width: '100%', height: '100%' }}>
                      <Image src={imagePreview} alt="Preview" fill style={{ objectFit: 'cover', borderRadius: '8px' }} />
                      <div className="admin-preview-overlay"><span>Change Image</span></div>
                    </div>
                  ) : (
                    <div className="admin-dropzone-placeholder">
                      <span className="admin-placeholder-icon">🖼️</span>
                      <span>Click to Upload Banner Image</span>
                      <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '8px' }}>Max 10MB (Auto-optimized)</p>
                    </div>
                  )}
                </div>
                <input 
                  type="file" ref={fileInputRef} onChange={handleFileChange} 
                  accept="image/*" style={{ display: 'none' }} 
                />
              </div>

              {/* Navigation Type */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Navigation Type</label>
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                  {(['product', 'category', 'custom'] as const).map((type) => (
                    <label key={type} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input 
                        type="radio" name="bannerType" value={type}
                        checked={formData.type === type}
                        onChange={() => handleTypeChange(type)}
                      />
                      <span style={{ fontSize: '14px', textTransform: 'capitalize' }}>{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Dynamic Fields */}
              {formData.type === 'product' && (
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Select Product</label>
                  <select 
                    className="form-input"
                    value={formData.referenceId}
                    onChange={(e) => setFormData({ ...formData, referenceId: e.target.value })}
                    disabled={dataLoading}
                  >
                    <option value="">-- Choose a Product --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.type === 'category' && (
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Select Category</label>
                  <select 
                    className="form-input"
                    value={formData.referenceId}
                    onChange={(e) => setFormData({ ...formData, referenceId: e.target.value })}
                    disabled={dataLoading}
                  >
                    <option value="">-- Choose a Category --</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.slug}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.type === 'custom' && (
                <div className="form-group" style={{ marginBottom: '20px' }}>
                  <label className="form-label">Redirect URL</label>
                  <input 
                    type="text" className="form-input" 
                    placeholder="e.g. /offers or https://..."
                    value={formData.redirectUrl}
                    onChange={(e) => setFormData({ ...formData, redirectUrl: e.target.value })}
                  />
                </div>
              )}

              {/* Tagline */}
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label className="form-label">Tagline (Optional)</label>
                <input 
                  type="text" className="form-input" 
                  placeholder="Catchy promotional text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                />
              </div>

              {/* Priority & Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <input 
                    type="number" className="form-input" min="1"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 1 })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', height: '42px' }}>
                    <input 
                      type="checkbox" checked={formData.isActive}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      style={{ width: '20px', height: '20px' }}
                    />
                    <span style={{ fontSize: '14px' }}>{formData.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
              </div>

              {error && <div style={{ color: '#dc2626', backgroundColor: '#fef2f2', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px' }}>{error}</div>}

              <div style={{ display: 'flex', gap: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
                <button type="submit" className="btn-primary" disabled={loading || dataLoading} style={{ minWidth: '120px' }}>
                  {loading ? 'Processing...' : 'Save Banner'}
                </button>
                <button type="button" onClick={() => router.back()} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
