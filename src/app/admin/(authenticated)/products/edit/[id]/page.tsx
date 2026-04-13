'use client';

import React, { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { updateProduct, getProductByIdAsync, fetchFirebaseData, uploadProductImage } from '@/services/productService';
import { useCategories } from '@/context/CategoryContext';
import Link from 'next/link';

interface Variant {
  weight: string;
  price: number;
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { categories } = useCategories();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    type: 'veg' as 'veg' | 'non-veg' | 'sweet' | 'pindi-vantalu' | 'hot-snacks' | 'ghee' | 'oil',
  });

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const [variants, setVariants] = useState<Variant[]>([]);

  useEffect(() => {
    const loadProductData = async () => {
      setLoading(true);
      try {
        await fetchFirebaseData();
        
        const product = await getProductByIdAsync(id);
        if (product) {
          setFormData({
            name: product.name || '',
            category: product.category || '',
            description: product.description || '',
            type: product.type || 'veg',
          });
          
          // Load images array if exists, otherwise fallback to single image
          const images = product.images || (product.image ? [product.image] : []);
          setExistingImages(images);
          setVariants(product.variants || []);
        } else {
          alert('Product not found');
          router.push('/admin/products');
        }
      } catch (error) {
        console.error('Error loading product:', error);
      } finally {
        setLoading(false);
      }
    };
    loadProductData();
  }, [id, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    files.forEach(file => {
      if (!validTypes.includes(file.type)) {
        alert(`${file.name} is not a valid image (JPG, PNG, WebP)`);
        return;
      }
      if (file.size > 2 * 1024 * 1024) {
        alert(`${file.name} is too large (Max 2MB)`);
        return;
      }
      newFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    });

    setSelectedFiles(prev => [...prev, ...newFiles]);
    setPreviewUrls(prev => [...prev, ...newPreviews]);
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleVariantChange = (index: number, field: keyof Variant, value: string | number) => {
    const updatedVariants = [...variants];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    setVariants(updatedVariants);
  };

  const addVariant = () => {
    setVariants([...variants, { weight: '', price: 0 }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (existingImages.length === 0 && selectedFiles.length === 0) {
      alert('Please have at least one product image');
      return;
    }
    setSaving(true);

    try {
      // 1. Upload new files if any
      let newImageUrls: string[] = [];
      if (selectedFiles.length > 0) {
        setUploading(true);
        for (const file of selectedFiles) {
          const url = await uploadProductImage(id, file);
          newImageUrls.push(url);
        }
        setUploading(false);
      }

      // 2. Combine remaining existing images with new ones
      const finalImages = [...existingImages, ...newImageUrls];

      const selectedCat = categories.find(c => c.name === formData.category);

      const productData = {
        ...formData,
        categorySlug: selectedCat?.slug || '',
        image: finalImages[0] || '', // Primary image
        images: finalImages,
        variants,
        updatedAt: new Date().toISOString()
      };

      await updateProduct(id, productData);
      setToast('Product updated successfully!');
      setTimeout(() => {
        router.push('/admin/products');
      }, 2000);
    } catch (error) {
      console.error('Update Error:', error);
      alert('Failed to update product');
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-card">
          <div className="admin-empty">
            <div style={{ width: '40px', height: '40px', border: '3px solid #f3f3f3', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
            <p style={{ marginTop: '16px', color: '#64748b' }}>Loading product details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Edit Product</h2>
          <Link href="/admin/products" className="btn-secondary">Cancel</Link>
        </div>

        <div className="admin-content" style={{ padding: '32px' }}>
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input 
                  type="text" 
                  name="name" 
                  className="form-input" 
                  required 
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select 
                  name="category" 
                  className="form-select" 
                  required
                  value={formData.category}
                  onChange={handleInputChange}
                >
                  <option value="">Select Category</option>
                  {categories.map(cat => (
                    <option key={cat.id || cat.slug} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Product Type</label>
                <select 
                  name="type" 
                  className="form-select" 
                  value={formData.type}
                  onChange={handleInputChange}
                >
                  <option value="veg">Veg</option>
                  <option value="non-veg">Non-Veg</option>
                  <option value="sweet">Sweet</option>
                  <option value="pindi-vantalu">Pindi Vantalu</option>
                  <option value="hot-snacks">Hot Snacks</option>
                  <option value="ghee">Ghee</option>
                  <option value="oil">Oil</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Product Images (Multiple)</label>
                <div className="multi-upload-container">
                  <div 
                    className="upload-trigger-box"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                    <span>Click to Add More Images</span>
                    <span className="upload-meta">JPG, PNG, WebP (Max 2MB each)</span>
                  </div>

                  <div className="upload-previews-grid">
                    {/* Existing Images */}
                    {existingImages.map((url, idx) => (
                      <div key={`existing-${idx}`} className="preview-item">
                        <img src={url} alt={`Existing ${idx + 1}`} />
                        <button 
                          type="button" 
                          className="remove-preview" 
                          onClick={() => removeExistingImage(idx)}
                        >
                          ×
                        </button>
                        {idx === 0 && <span className="primary-badge">Main</span>}
                      </div>
                    ))}

                    {/* New Previews */}
                    {previewUrls.map((url, idx) => (
                      <div key={`new-${idx}`} className="preview-item">
                        <img src={url} alt={`New Preview ${idx + 1}`} />
                        <button 
                          type="button" 
                          className="remove-preview" 
                          onClick={() => removeNewFile(idx)}
                        >
                          ×
                        </button>
                        {existingImages.length === 0 && idx === 0 && <span className="primary-badge">Main</span>}
                      </div>
                    ))}
                  </div>

                  {uploading && (
                    <div className="upload-progress-overlay">
                      <div className="spinner"></div>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#3b82f6' }}>Uploading {selectedFiles.length} new images...</span>
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={handleFileChange}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea 
                name="description" 
                className="form-textarea" 
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
              ></textarea>
            </div>

            <div className="form-group">
              <label className="form-label">Variants (Weights & Prices)</label>
              <div className="variants-list">
                {variants.map((v, index) => (
                  <div key={index} className="variant-item">
                    <input 
                      type="text" 
                      placeholder="Weight (e.g. 500g)" 
                      className="form-input" 
                      value={v.weight}
                      onChange={(e) => handleVariantChange(index, 'weight', e.target.value)}
                      required
                    />
                    <input 
                      type="number" 
                      placeholder="Price (₹)" 
                      className="form-input" 
                      value={v.price === 0 ? '' : v.price}
                      onChange={(e) => handleVariantChange(index, 'price', Number(e.target.value))}
                      required
                    />
                    <button 
                      type="button" 
                      className="btn-icon delete" 
                      onClick={() => removeVariant(index)}
                      disabled={variants.length === 1}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" ry="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  </div>
                ))}
                <button type="button" className="btn-secondary" style={{ alignSelf: 'flex-start', borderStyle: 'dashed' }} onClick={addVariant}>
                  + Add Variant
                </button>
              </div>
            </div>

            <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <button 
                type="submit" 
                className="btn-primary" 
                style={{ minWidth: '150px' }}
                disabled={saving}
              >
                {saving ? 'Processing...' : 'Update Product'}
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
