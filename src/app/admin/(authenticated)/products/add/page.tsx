'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { addProduct, fetchFirebaseData, uploadProductImage, updateProduct } from '@/services/productService';
import { useCategories } from '@/context/CategoryContext';
import Link from 'next/link';

interface Variant {
  weight: string;
  price: number;
}

export default function AddProductPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { categories } = useCategories();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    type: 'veg' as 'veg' | 'non-veg' | 'sweet' | 'pindi-vantalu' | 'hot-snacks' | 'ghee' | 'oil',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [variants, setVariants] = useState<Variant[]>([
    { weight: '250g', price: 0 }
  ]);

  // Remove old getCategories useEffect

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please select a valid image file (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
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
    if (!selectedFile) {
      alert('Please select a product image');
      return;
    }
    setLoading(true);

    try {
      // Find the corresponding slug
      const selectedCat = categories.find(c => c.name === formData.category);

      // 1. Create product (without image)
      const productData = {
        ...formData,
        categorySlug: selectedCat?.slug || '',
        variants,
        image: '', // Placeholder
        createdAt: new Date().toISOString()
      };

      const productId = await addProduct(productData);

      // 2. Upload image
      setUploading(true);
      const imageUrl = await uploadProductImage(productId, selectedFile);
      setUploading(false);

      // 3. Update product with real URL
      await updateProduct(productId, { image: imageUrl });

      setToast('Product added successfully!');
      setTimeout(() => {
        router.push('/admin/products');
      }, 2000);
    } catch (error) {
      alert('Failed to add product');
    } finally {
      setLoading(false);
      setUploading(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-card">
        <div className="admin-card-header">
          <h2 className="admin-card-title">Add New Product</h2>
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
                  placeholder="e.g. Mango Avakaya"
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
                <label className="form-label">Product Image</label>
                <div 
                  className={`upload-field ${previewUrl ? 'has-file' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <div className="upload-preview-container">
                      <img src={previewUrl} alt="Preview" className="upload-preview" />
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                      <span>Choose Product Image</span>
                      <span className="upload-meta">JPG, PNG, WebP (Max 2MB)</span>
                    </div>
                  )}
                  {uploading && (
                    <div className="upload-progress-overlay">
                      <div className="spinner"></div>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: '#3b82f6' }}>Uploading...</span>
                    </div>
                  )}
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: 'none' }} 
                  accept="image/jpeg,image/png,image/webp"
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
                placeholder="Brief description of the product..."
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
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
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
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Save Product'}
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
