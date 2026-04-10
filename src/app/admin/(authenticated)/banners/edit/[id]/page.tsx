'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { getBannerById, updateBanner, uploadBannerImage, Banner } from '@/services/bannerService';
import { getCategoriesAsync, getProductsAsync } from '@/services/productService';

export default function EditBannerPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<Banner>>({
    type: 'custom',
    referenceId: '',
    redirectUrl: '',
    tagline: '',
    isActive: true,
    priority: 1
  });
  
  const [oldImageUrl, setOldImageUrl] = useState<string>('');
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
        setDataLoading(true);
        const [cats, prods, bannerData] = await Promise.all([
          getCategoriesAsync(),
          getProductsAsync(),
          getBannerById(id)
        ]);
        
        setCategories(cats);
        setProducts(prods);
        
        if (bannerData) {
          setFormData(bannerData);
          setOldImageUrl(bannerData.imageUrl);
          setImagePreview(bannerData.imageUrl);
        } else {
          setError('Banner not found');
        }
      } catch (err) {
        console.error('Error fetching dynamic data:', err);
        setError('Failed to load data');
      } finally {
        setDataLoading(false);
      }
    };
    fetchData();
  }, [id]);

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
      referenceId: '',
      redirectUrl: ''
    });
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // ✅ VALIDATION
    if (!imagePreview && !imageFile) {
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

    try {
      setLoading(true);
      
      let finalImageUrl = oldImageUrl;

      // 1. Upload New Image if selected
      if (imageFile) {
        finalImageUrl = await uploadBannerImage(imageFile);
      }

      // 2. Update Banner Document
      await updateBanner(id, {
        ...formData,
        imageUrl: finalImageUrl,
        priority: Number(formData.priority)
      }, oldImageUrl);

      router.push('/admin/banners');
    } catch (err: any) {
      console.error('Error updating banner:', err);
      setError(err.message || 'Failed to update banner. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading) {
    return (
      <div className="admin-page">
        <div className="admin-card" style={{ padding: '40px', textAlign: 'center' }}>
          <div className="admin-loading-spinner" />
          <p style={{ marginTop: '12px', color: '#64748b' }}>Loading banner details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h2 className="admin-card-title">Edit Banner</h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Update banner information and redirection</p>
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
                <label className="form-label">Banner Image</label>
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
                    placeholder="/offers"
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
                <button type="submit" className="btn-primary" disabled={loading} style={{ minWidth: '120px' }}>
                  {loading ? 'Updating...' : 'Save Changes'}
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
