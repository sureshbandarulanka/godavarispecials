'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Link from 'next/link';
import { useCategories } from '@/context/CategoryContext';
import { compressImage } from '@/utils/compressImage';

interface ExcelRow {
  name?: string;
  description?: string;
  price?: string | number;
  category?: string;
  stock?: string | number;
  imageName?: string;
  isActive?: string | boolean;
  startDate?: string | number;
  endDate?: string | number;
}

interface ValidationError {
  row: number;
  message: string;
  type: 'error' | 'warning';
}

export default function BulkUploadPage() {
  const { categories } = useCategories();
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [data, setData] = useState<ExcelRow[]>([]);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  const [isSuccess, setIsSuccess] = useState(false);
  const [existingProductNames, setExistingProductNames] = useState<Set<string>>(new Set());
  
  const excelInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Load existing products for duplicate detection
  useEffect(() => {
    const fetchExistingProducts = async () => {
      try {
        const q = query(collection(db, "products"));
        const snapshot = await getDocs(q);
        const names = new Set(snapshot.docs.map(doc => doc.data().name?.toLowerCase().trim()));
        setExistingProductNames(names);
      } catch (error) {
        console.error("Error fetching existing products:", error);
      }
    };
    fetchExistingProducts();
  }, []);

  const handleExcelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processExcel(selectedFile);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImageFiles(files);
  };

  const processExcel = (file: File) => {
    setExcelFile(file);
    setIsSuccess(false);
    setErrors([]);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const dataBuffer = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(dataBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelRow[];
        
        if (jsonData.length === 0) {
          setErrors([{ row: 0, message: "The file appears to be empty.", type: 'error' }]);
          return;
        }

        setData(jsonData);
      } catch (err) {
        setErrors([{ row: 0, message: "Failed to parse Excel file.", type: 'error' }]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Automated Validation on state change
  useEffect(() => {
    if (data.length > 0) {
      validateData(data, imageFiles);
    }
  }, [data, imageFiles, categories]);

  // Helper to safely parse dates from Excel (handles strings, numbers, and Excel serial dates)
  const safeGetDate = (val: any): Date | null => {
    if (!val) return null;
    if (val instanceof Date) return isNaN(val.getTime()) ? null : val;
    if (typeof val === 'number') {
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      return isNaN(date.getTime()) ? null : date;
    }
    const date = new Date(val);
    return isNaN(date.getTime()) ? null : date;
  };

  const normalize = (val: any) => {
    if (!val) return "";
    // 1. Get filename only (remove paths)
    const fileName = String(val).split('/').pop()?.split('\\').pop() || String(val);
    // 2. Remove extension and special chars
    return fileName
      .toLowerCase()
      .split('.')[0] 
      .replace(/[^a-z0-9]/g, ""); 
  };

  const handleReset = () => {
    if (confirm("Are you sure you want to cancel upload?")) {
      setExcelFile(null);
      setImageFiles([]);
      setData([]);
      setErrors([]);
      setUploadProgress({ current: 0, total: 0 });
      setIsProcessing(false);
      setStatus('');
      if (excelInputRef.current) excelInputRef.current.value = '';
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const validateData = (rows: ExcelRow[], images: File[]) => {
    const newErrors: ValidationError[] = [];
    const categorySlugs = new Set(categories.map(c => c.slug.toLowerCase().trim()));
    
    // Create map of alphanumeric search keys to original files
    const imageMap = new Set(images.map(f => normalize(f.name)));

    rows.forEach((row, index) => {
      const rowNum = index + 2;

      // 1. Basic Validation
      if (!row.name || row.name.toString().trim() === "") {
        newErrors.push({ row: rowNum, message: "Product Name is required.", type: 'error' });
      }
      if (row.price === undefined || isNaN(Number(row.price))) {
        newErrors.push({ row: rowNum, message: "Valid Price is required.", type: 'error' });
      }

      // 2. Category Check
      if (!row.category) {
        newErrors.push({ row: rowNum, message: "Category is required.", type: 'error' });
      } else {
        const normalizedCat = row.category.toString().toLowerCase().trim();
        if (!categorySlugs.has(normalizedCat)) {
          newErrors.push({ row: rowNum, message: `Category slug "${normalizedCat}" not found.`, type: 'error' });
        }
      }

      // 3. Robust Alphanumeric Image Mapping (Supports multiple comma-separated images)
      if (row.imageName) {
        const imageNames = row.imageName.toString().split(',').map(s => s.trim()).filter(Boolean);
        
        imageNames.forEach(name => {
          const searchKey = normalize(name);
          if (!imageMap.has(searchKey)) {
            newErrors.push({ 
              row: rowNum, 
              message: `Image "${name}" not found. (Search Key: ${searchKey})`, 
              type: 'error' 
            });
          }
        });
      }

      // 4. Date Validation
      const start = safeGetDate(row.startDate);
      const end = safeGetDate(row.endDate);
      if (row.startDate && !start) newErrors.push({ row: rowNum, message: "Invalid Start Date.", type: 'error' });
      if (row.endDate && !end) newErrors.push({ row: rowNum, message: "Invalid End Date.", type: 'error' });
      if (start && end && start >= end) {
        newErrors.push({ row: rowNum, message: "Start Date must be before End Date.", type: 'error' });
      }
    });

    setErrors(newErrors);
  };

  const handleUpload = async () => {
    if (!imageFiles || imageFiles.length === 0) {
      alert("No images selected!");
      return;
    }

    const hasErrors = errors.some(e => e.type === 'error');
    if (hasErrors) {
      alert("Please fix all validation errors before uploading.");
      return;
    }

    setIsProcessing(true);
    setUploadProgress({ current: 0, total: data.length });
    
    // 🔥 Build imageMap HERE (NOT outside)
    const imageMap: Record<string, File> = {};

    imageFiles.forEach((file) => {
      imageMap[normalize(file.name)] = file;
    });

    console.log("imageFiles count:", imageFiles.length);
    console.log("imageMap keys:", Object.keys(imageMap));

    // Final Fail-safe Check: Ensure zero mismatches before starting any uploads
    const internalErrors: string[] = [];
    data.forEach((item, idx) => {
      if (item.imageName) {
        const imageNames = item.imageName.toString().split(',').map(s => s.trim()).filter(Boolean);
        imageNames.forEach(name => {
          const searchKey = normalize(name);
          if (!imageMap[searchKey]) {
            internalErrors.push(`Row ${idx + 2}: Image "${name}" mapping key "${searchKey}" not found.`);
          }
        });
      }
    });

    if (internalErrors.length > 0) {
      alert(`Upload blocked: ${internalErrors.length} mismatch(es) detected. Ensure filenames match Excel.`);
      setIsProcessing(false);
      return;
    }

    const chunkSize = 5;
    const chunks = [];
    for (let i = 0; i < data.length; i += chunkSize) {
      chunks.push(data.slice(i, i + chunkSize));
    }

    try {
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        setStatus(`Processing batch ${i + 1} of ${chunks.length}...`);
        
        await Promise.all(chunk.map(async (item, index) => {
          let imageUrl = "";
          let imageUrls: string[] = [];
          
          // 1. Handle Images if present (Internal lookup)
          if (item.imageName) {
            const requestedNames = item.imageName.toString().split(',').map(s => s.trim()).filter(Boolean);
            
            for (const name of requestedNames) {
              const searchKey = normalize(name);
              const imageFile = imageMap[searchKey];

              if (!imageFile) {
                console.error("Mismatch:", name);
                continue;
              }

              // Compress
              setStatus(`Compressing ${imageFile.name}...`);
              const compressedFile = await compressImage(imageFile);
              
              // Upload to Storage
              setStatus(`Uploading ${imageFile.name}...`);
              const storagePath = `products/${Date.now()}_${compressedFile.name}`;
              const storageRef = ref(storage, storagePath);
              const snapshot = await uploadBytes(storageRef, compressedFile);
              const url = await getDownloadURL(snapshot.ref);
              imageUrls.push(url);
            }
          }

          if (imageUrls.length > 0) {
            imageUrl = imageUrls[0];
          }

          // 2. Prepare Firestore Data
          const start = safeGetDate(item.startDate);
          const end = safeGetDate(item.endDate);

          const productData = {
            name: item.name?.toString().trim(),
            description: item.description?.toString() || "",
            // 🔥 CRITICAL: Homepage uses categorySlug for filtering
            categorySlug: item.category?.toString().toLowerCase().trim(),
            category: item.category?.toString().toLowerCase().trim(), // Keep both for safety
            type: "veg", // Default type for compatibility
            image: imageUrl,
            imageUrl: imageUrl, 
            images: imageUrls, // Store all uploaded images
            variants: [
              { weight: "500g", price: Number(item.price), stock: Number(item.stock) || 0 }
            ],
            isActive: String(item.isActive).toLowerCase() === "true",
            startDate: start ? start : null,
            endDate: end ? end : null,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };

          await addDoc(collection(db, "products"), productData);
        }));
        
        setUploadProgress(prev => ({ 
          ...prev, 
          current: Math.min(prev.current + chunk.length, data.length) 
        }));
      }

      setIsSuccess(true);
      setData([]);
      setExcelFile(null);
      setImageFiles([]);
      setErrors([]);
      setStatus('Upload Completed!');
    } catch (error) {
      console.error("Upload failed:", error);
      alert("An error occurred during upload. Please check console.");
      setStatus('Upload failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadSample = () => {
    const sampleData = [
      {
        name: "Premium Mango Pickles",
        description: "Traditional spicy mango pickle.",
        price: 250,
        category: "pickles",
        stock: 50,
        imageName: "mango1.jpg, mango2.jpg",
        isActive: "TRUE",
        startDate: "2024-01-01 00:00",
        endDate: "2025-12-31 23:59"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
    XLSX.writeFile(workbook, "Godavari_Specials_Bulk_Upload_Sample.xlsx");
  };

  const hasCriticalErrors = errors.some(e => e.type === 'error');

  return (
    <div className="admin-page">
      <div className="admin-card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div className="admin-card-header">
          <div>
            <h2 className="admin-card-title">Enhanced Bulk Product Upload</h2>
            <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
              Upload Excel + Images. Images will be auto-compressed and mapped. (Multiple images supported via comma-separated names)
            </p>
          </div>
          <button onClick={downloadSample} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Download Sample
          </button>
        </div>

        <div className="admin-content" style={{ padding: '32px' }}>
          {!isSuccess ? (
            <div className="upload-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {/* Step 1: Excel */}
              <div 
                className={`upload-field ${excelFile ? 'has-file' : ''}`}
                onClick={() => !isProcessing && excelInputRef.current?.click()}
                style={{ opacity: isProcessing ? 0.6 : 1, cursor: isProcessing ? 'not-allowed' : 'pointer' }}
              >
                <input type="file" ref={excelInputRef} onChange={handleExcelChange} accept=".xlsx" style={{ display: 'none' }} disabled={isProcessing} />
                <div className="upload-placeholder">
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>📁</div>
                  <div style={{ fontWeight: 600 }}>{excelFile ? excelFile.name : 'Click to Upload Excel'}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Products metadata (.xlsx)</div>
                </div>
              </div>

              {/* Step 2: Images */}
              <div 
                className={`upload-field ${imageFiles.length > 0 ? 'has-file' : ''}`}
                onClick={() => !isProcessing && imageInputRef.current?.click()}
                style={{ 
                  borderColor: imageFiles.length > 0 ? '#10b981' : '',
                  opacity: isProcessing ? 0.6 : 1, 
                  cursor: isProcessing ? 'not-allowed' : 'pointer' 
                }}
              >
                <input type="file" ref={imageInputRef} onChange={handleImageChange} multiple accept="image/*" style={{ display: 'none' }} disabled={isProcessing} />
                <div className="upload-placeholder">
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🖼️</div>
                  <div style={{ fontWeight: 600 }}>
                    {imageFiles.length > 0 ? `${imageFiles.length} Images Selected` : 'Click to Upload Images'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Required names must match Excel</div>
                </div>
              </div>

              {/* Status & Action */}
              <div style={{ gridColumn: 'span 2', marginTop: '12px' }}>
                {data.length > 0 && (
                  <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, fontWeight: 700 }}>Ready to Process</h4>
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                          {data.length} products found • {imageFiles.length} images uploaded
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: '12px' }}>
                        {!isProcessing && (
                          <button 
                            onClick={handleReset}
                            className="btn-secondary"
                            style={{ padding: '12px 24px', borderRadius: '12px' }}
                          >
                            Cancel Upload
                          </button>
                        )}
                        <button 
                          onClick={handleUpload} 
                          disabled={isProcessing || hasCriticalErrors || data.length === 0} 
                          className="btn-primary"
                          style={{ padding: '12px 32px', borderRadius: '12px' }}
                        >
                          {isProcessing ? 'Processing...' : 'Start Optimized Upload'}
                        </button>
                      </div>
                    </div>

                    {isProcessing && (
                      <div style={{ marginTop: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px' }}>
                          <span style={{ fontWeight: 600, color: '#3b82f6' }}>{status}</span>
                          <span style={{ fontWeight: 800 }}>{uploadProgress.current} / {uploadProgress.total}</span>
                        </div>
                        <div style={{ height: '10px', background: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                          <div style={{ 
                            width: `${(uploadProgress.current / uploadProgress.total) * 100}%`, 
                            height: '100%', 
                            background: '#3b82f6', 
                            transition: 'width 0.3s ease' 
                          }}></div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {errors.length > 0 && (
                  <div style={{ marginTop: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#ef4444', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                        Validation Errors Found
                      </h3>
                      <div style={{ fontSize: '11px', color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: '20px' }}>
                        System normalized {imageFiles.length} images
                      </div>
                    </div>

                    <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #fee2e2', borderRadius: '12px' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <tbody>
                          {errors.map((error, idx) => (
                            <tr key={idx} style={{ background: error.type === 'error' ? '#fffafa' : '#fffdfa', borderBottom: '1px solid #fef2f2' }}>
                              <td style={{ padding: '10px 16px', fontWeight: 700, width: '80px' }}>Row {error.row}</td>
                              <td style={{ padding: '10px 16px', color: error.type === 'error' ? '#b91c1c' : '#9a3412' }}>{error.message}</td>
                              <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                                <span style={{ 
                                  padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800,
                                  background: error.type === 'error' ? '#fee2e2' : '#ffedd5',
                                  color: error.type === 'error' ? '#ef4444' : '#f97316'
                                }}>{error.type.toUpperCase()}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Debug Section for Admin to see what files are recognized */}
                    <div style={{ marginTop: '16px', padding: '16px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                      <h4 style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>🔍 Debug: Recognized Image Keys</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {imageFiles.length > 0 ? (
                          imageFiles.slice(0, 20).map((f, i) => (
                            <span key={i} style={{ fontSize: '10px', background: '#fff', padding: '4px 8px', border: '1px solid #cbd5e1', borderRadius: '4px' }}>
                              {normalize(f.name)}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '11px', color: '#94a3b8 italic' }}>No images uploaded yet</span>
                        )}
                        {imageFiles.length > 20 && <span style={{ fontSize: '10px', color: '#64748b' }}>+ {imageFiles.length - 20} more</span>}
                      </div>
                      <p style={{ fontSize: '10px', color: '#94a3b8', marginTop: '8px' }}>
                        Tip: If these keys don't match the names in your Excel column exactly, the upload will fail.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ fontSize: '80px', marginBottom: '24px' }}>✨</div>
              <h2 style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>Upload Successfully!</h2>
              <p style={{ color: '#64748b', marginBottom: '40px', fontSize: '16px' }}>
                {uploadProgress.total} products with compressed images are now live.
              </p>
              <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
                <Link href="/admin/products" className="btn-primary" style={{ padding: '12px 32px' }}>View Catalog</Link>
                <button onClick={() => { setIsSuccess(false); setExcelFile(null); setImageFiles([]); setData([]); }} className="btn-secondary">Upload More</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .upload-field {
          border: 2px dashed #e2e8f0;
          border-radius: 20px;
          padding: 32px;
          text-align: center;
          cursor: pointer;
          background: #f8fafc;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border-color: #cbd5e1;
        }
        .upload-field:hover {
          border-color: #3b82f6;
          background: #f1f5f9;
          transform: translateY(-2px);
        }
        .upload-field.has-file {
          border-style: solid;
          border-color: #3b82f6;
          background: #eff6ff;
        }
      `}</style>
    </div>
  );
}
