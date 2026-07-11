'use client';

import React, { useState, useEffect, use, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { updateProduct, getProductByIdAsync, fetchFirebaseData, uploadProductImage, updateCategory } from '@/services/productService';
import { useCategories } from '@/context/CategoryContext';
import { useSections } from '@/context/SectionContext';
import Link from 'next/link';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableImageItem from '@/components/admin/SortableImageItem';
import SortableVariantItem from '@/components/admin/SortableVariantItem';

interface Variant {
  id: string;
  weight: string;
  price: number;
}

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { categories } = useCategories();
  const { sections } = useSections();
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [newProductType, setNewProductType] = useState('');
  const [addingType, setAddingType] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    type: 'veg' as string,
    isOutOfStock: false,
    isTopSelling: false,
  });

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);

  const [variants, setVariants] = useState<Variant[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const combinedImages: { id: string; url: string; isExisting: boolean; file?: File }[] = [
    ...existingImages.map(url => ({ id: url, url, isExisting: true })),
    ...previewUrls.map((url, idx) => ({ id: url, url, isExisting: false, file: selectedFiles[idx] }))
  ];

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = combinedImages.findIndex(img => img.id === active.id);
      const newIndex = combinedImages.findIndex(img => img.id === over.id);
      
      const newCombined = arrayMove(combinedImages, oldIndex, newIndex);
      
      const newExisting: string[] = [];
      const newPreviews: string[] = [];
      const newFiles: File[] = [];
      
      newCombined.forEach(img => {
        if (img.isExisting) {
          newExisting.push(img.url);
        } else {
          newPreviews.push(img.url);
          if (img.file) newFiles.push(img.file);
        }
      });
      
      setExistingImages(newExisting);
      setPreviewUrls(newPreviews);
      setSelectedFiles(newFiles);
    }
  };

  const handleRemoveImage = (index: number) => {
    const item = combinedImages[index];
    if (item.isExisting) {
      setExistingImages(prev => prev.filter(url => url !== item.url));
    } else {
      const newIndex = previewUrls.indexOf(item.url);
      setSelectedFiles(prev => prev.filter((_, i) => i !== newIndex));
      setPreviewUrls(prev => {
        URL.revokeObjectURL(prev[newIndex]);
        return prev.filter((_, i) => i !== newIndex);
      });
    }
  };

  const handleVariantDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setVariants((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

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
            isOutOfStock: product.isOutOfStock || false,
            isTopSelling: product.isTopSelling || false,
          });
          
          // Load images array if exists, otherwise fallback to single image
          const images = product.images || (product.image ? [product.image] : []);
          setExistingImages(images);
          setSelectedSections((product as any).sections || (product.isTopSelling ? ['top-selling-specials'] : []));
          setVariants((product.variants || []).map((v: any) => ({ ...v, id: Math.random().toString(36).substr(2, 9) })));
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
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddNewProductType = async () => {
    if (!newProductType.trim()) return;
    if (!formData.category) {
      alert('Please select a category first.');
      return;
    }

    setAddingType(true);
    try {
      const selectedCatObj = categories.find(c => c.name === formData.category);
      if (!selectedCatObj) {
        alert('Selected category not found.');
        return;
      }

      const currentTypes = selectedCatObj.types || [];
      const trimmedType = newProductType.trim();
      
      if (currentTypes.includes(trimmedType)) {
        alert('This type already exists under this category.');
        setNewProductType('');
        return;
      }

      const updatedTypes = [...currentTypes, trimmedType];
      const { id: catId, ...payload } = selectedCatObj;

      await updateCategory(selectedCatObj.id, {
        ...payload,
        types: updatedTypes
      });

      setFormData(prev => ({ ...prev, type: trimmedType }));
      setNewProductType('');
      setToast('New product type added to category!');
      setTimeout(() => setToast(null), 2000);
    } catch (err) {
      console.error("Failed to add new type:", err);
      alert("Failed to add new product type to category.");
    } finally {
      setAddingType(false);
    }
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

  const handleVariantChange = (id: string, field: keyof Variant, value: string | number) => {
    setVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const addVariant = () => {
    setVariants([...variants, { id: Math.random().toString(36).substr(2, 9), weight: '', price: 0 }]);
  };

  const removeVariant = (id: string) => {
    setVariants(variants.filter((v) => v.id !== id));
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
        variants: variants.map(({ id, ...rest }) => rest),
        sections: selectedSections,
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <select 
                    name="type" 
                    className="form-select" 
                    value={formData.type}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Type</option>
                    {/* Show category specific types if available */}
                    {categories.find(c => c.name === formData.category)?.types?.map(t => (
                      <option key={t} value={t}>{t}</option>
                    )) || (
                      <>
                        <option value="veg">Veg</option>
                        <option value="non-veg">Non-Veg</option>
                        <option value="sweet">Sweet</option>
                        <option value="pindi-vantalu">Pindi Vantalu</option>
                        <option value="hot-snacks">Hot Snacks</option>
                        <option value="ghee">Ghee</option>
                        <option value="oil">Oil</option>
                      </>
                    )}
                  </select>
                  
                  {formData.category && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        type="text" 
                        placeholder="Add custom product type..." 
                        className="form-input" 
                        style={{ fontSize: '13px', padding: '8px 12px', flex: 1 }}
                        value={newProductType}
                        onChange={(e) => setNewProductType(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddNewProductType();
                          }
                        }}
                      />
                      <button 
                        type="button" 
                        className="btn-primary" 
                        style={{ fontSize: '12px', padding: '8px 16px', height: '38px', background: '#f97316', borderColor: '#f97316' }}
                        onClick={handleAddNewProductType}
                        disabled={addingType}
                      >
                        {addingType ? 'Adding...' : '+ Add'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Availability</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', height: '44px' }}>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      name="isOutOfStock"
                      checked={formData.isOutOfStock}
                      onChange={(e) => setFormData({ ...formData, isOutOfStock: e.target.checked })}
                    />
                    <span className="slider round"></span>
                  </label>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: formData.isOutOfStock ? '#ef4444' : '#10b981' }}>
                    {formData.isOutOfStock ? 'Out of Stock' : 'In Stock'}
                  </span>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Highlight as Top Selling</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', height: '44px' }}>
                  <label className="switch">
                    <input 
                      type="checkbox" 
                      name="isTopSelling"
                      checked={formData.isTopSelling}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setFormData({ ...formData, isTopSelling: checked });
                        if (checked) {
                          if (!selectedSections.includes('top-selling-specials')) {
                            setSelectedSections([...selectedSections, 'top-selling-specials']);
                          }
                        } else {
                          setSelectedSections(selectedSections.filter(s => s !== 'top-selling-specials'));
                        }
                      }}
                    />
                    <span className="slider round"></span>
                  </label>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: formData.isTopSelling ? '#f59e0b' : '#64748b' }}>
                    {formData.isTopSelling ? '🔥 Yes, Top Selling Highlighted' : 'Regular Product'}
                  </span>
                </div>
              </div>
              <div className="form-group">
                {/* Kept empty for two-column symmetry */}
              </div>
            </div>

            {formData.category && (
              <div className="form-row">
                <div className="form-group" style={{ width: '100%' }}>
                  <label className="form-label">Select Homepage Sections</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px', background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', marginTop: '8px' }}>
                    {sections.map((sec) => (
                      <label key={sec.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#334155' }}>
                        <input
                          type="checkbox"
                          value={sec.slug}
                          checked={selectedSections.includes(sec.slug)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSections([...selectedSections, sec.slug]);
                              if (sec.slug === 'top-selling-specials') {
                                setFormData(prev => ({ ...prev, isTopSelling: true }));
                              }
                            } else {
                              setSelectedSections(selectedSections.filter(s => s !== sec.slug));
                              if (sec.slug === 'top-selling-specials') {
                                setFormData(prev => ({ ...prev, isTopSelling: false }));
                              }
                            }
                          }}
                          style={{ width: '16px', height: '16px', accentColor: '#f97316' }}
                        />
                        <span>{sec.name}</span>
                      </label>
                    ))}
                  </div>
                  <p style={{ color: '#64748b', fontSize: '11px', margin: '6px 0 0 0' }}>
                    Choose which homepage rows this product should be displayed in. Standard categories will fall back automatically.
                  </p>
                </div>
              </div>
            )}

            <div className="form-row">
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
                    <DndContext 
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext 
                        items={combinedImages.map(img => img.id)}
                        strategy={rectSortingStrategy}
                      >
                        {combinedImages.map((img, idx) => (
                          <SortableImageItem 
                            key={img.id} 
                            id={img.id} 
                            url={img.url} 
                            index={idx} 
                            onRemove={handleRemoveImage}
                            isMain={idx === 0}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
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
                <DndContext 
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleVariantDragEnd}
                >
                  <SortableContext 
                    items={variants.map(v => v.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {variants.map((v, index) => (
                      <SortableVariantItem
                        key={v.id}
                        variant={v}
                        index={index}
                        onVariantChange={handleVariantChange}
                        onRemove={removeVariant}
                        disableRemove={variants.length === 1}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
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
