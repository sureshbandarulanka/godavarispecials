'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { addOffer, uploadOfferImage } from '@/services/offerService';
import { getProducts, fetchFirebaseData } from '@/services/productService';
import { Product } from '@/data/products';
import { Timestamp } from 'firebase/firestore';
import Link from 'next/link';

export default function AddOfferPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingProducts, setFetchingProducts] = useState(true);
  
  // Form State
  const [title, setTitle] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [discountPercent, setDiscountPercent] = useState(0);
  const [originalPrice, setOriginalPrice] = useState(0);
  const [offerPrice, setOfferPrice] = useState(0);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [productImage, setProductImage] = useState('');
  
  // Initialize with current time for Start, and 7 days from now (11:59 PM) for End
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    return new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [endDate, setEndDate] = useState(() => {
    const weekOut = new Date();
    weekOut.setDate(weekOut.getDate() + 7);
    weekOut.setHours(23, 59, 0, 0);
    return new Date(weekOut.getTime() - weekOut.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });
  const [isActive, setIsActive] = useState(true);

  // Load products to populate dropdown
  useEffect(() => {
    const loadProducts = async () => {
      setFetchingProducts(true);
      await fetchFirebaseData();
      const data = getProducts();
      setProducts(data);
      setFetchingProducts(false);
    };
    loadProducts();
  }, []);

  // Update original price and title when product changes
  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = e.target.value;
    setSelectedProductId(productId);
    
    const product = products.find(p => p.id.toString() === productId);
    if (product) {
      setTitle(`Special Offer: ${product.name}`);
      // Use the first variant price as original price
      if (product.variants && product.variants.length > 0) {
        setOriginalPrice(product.variants[0].price);
      }
      setProductImage(product.image || '');
    }
  };

  // Calculate offer price when discount or original price changes
  useEffect(() => {
    const calculated = Math.round(originalPrice - (originalPrice * discountPercent) / 100);
    setOfferPrice(calculated);
  }, [originalPrice, discountPercent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !title || !startDate || !endDate) {
      alert('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        try {
          imageUrl = await uploadOfferImage(imageFile);
        } catch (uploadError) {
          console.error("Offer image upload failed:", uploadError);
          alert("Image upload failed. Creating offer without banner.");
        }
      }

      const offerData = {
        title,
        productId: selectedProductId,
        discountPercent,
        originalPrice,
        offerPrice,
        imageUrl,
        productImage,
        isActive,
        startDate: Timestamp.fromDate(new Date(startDate)),
        endDate: Timestamp.fromDate(new Date(endDate))
      };

      await addOffer(offerData);
      router.push('/admin/offers');
    } catch (error) {
      console.error("Error creating offer:", error);
      alert("Failed to create offer: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-card" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div className="admin-card-header">
          <h2 className="admin-card-title">Add New Offer</h2>
          <Link href="/admin/offers" className="btn-secondary">Cancel</Link>
        </div>

        <div className="admin-content" style={{ padding: '32px' }}>
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Select Product</label>
              <select 
                className="form-select" 
                required 
                value={selectedProductId}
                onChange={handleProductChange}
                disabled={fetchingProducts}
              >
                <option value="">-- Select a Product --</option>
                {products.map(product => (
                  <option key={product.id} value={product.id.toString()}>
                    {product.name}
                  </option>
                ))}
              </select>
              {fetchingProducts && <p style={{ fontSize: '10px', color: '#64748b' }}>Fetching products...</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Offer Title</label>
              <input 
                type="text" 
                className="form-input" 
                required 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Special Mango Pickle Offer"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Original Price (₹)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  required 
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(Number(e.target.value))}
                />
              </div>
              <div className="form-group">
                <label className="form-group">Discount (%)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  required 
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  min="1"
                  max="100"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Final Offer Price (Auto-calculated: ₹{offerPrice})</label>
              <input 
                type="number" 
                className="form-input" 
                value={offerPrice}
                readOnly
                disabled
                style={{ backgroundColor: '#f1f5f9' }}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Upload Offer Image (Optional)</label>
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

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Start Date & Time</label>
                <input 
                  type="datetime-local" 
                  className="form-input" 
                  required 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">End Date & Time</label>
                <input 
                  type="datetime-local" 
                  className="form-input" 
                  required 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                id="active-toggle" 
                checked={isActive} 
                onChange={(e) => setIsActive(e.target.checked)} 
              />
              <label htmlFor="active-toggle" style={{ fontWeight: 600 }}>Active status</label>
            </div>

            <div className="form-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button 
                type="submit" 
                className="btn-primary" 
                style={{ minWidth: '200px' }}
                disabled={loading}
              >
                {loading ? 'Creating Offer...' : 'Save Best Offer'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
