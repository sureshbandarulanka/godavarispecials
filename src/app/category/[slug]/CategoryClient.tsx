"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CategoriesRow from '@/components/CategoriesRow';
import ProductCard from '@/components/ProductCard';
import { subscribeToProducts } from '@/services/productService';
import { useCategories } from '@/context/CategoryContext';
import { Product } from '@/data/products';
import styles from './Category.module.css';

export default function CategoryClient({ slug }: { slug: string }) {
  const router = useRouter();
  const { categories, loading: categoriesLoading } = useCategories();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  
  // Filters State
  const [priceFilter, setPriceFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortOption, setSortOption] = useState('relevant');
  const [showFilters, setShowFilters] = useState(false);
  
  const targetCategory = categories.find(c => c.slug === slug);
  const decodedCategory = targetCategory ? targetCategory.name : '';

  useEffect(() => {
    window.scrollTo(0, 0);

    if (!slug || slug === 'all' || slug === 'for-you') {
      router.push('/');
      return;
    }
  }, [slug, router]);

  useEffect(() => {
    if (categoriesLoading || !slug) return;

    const unsubscribe = subscribeToProducts(
      (allProducts) => {
        const filtered = allProducts.filter((p: any) => p.categorySlug === slug);
        setProducts(filtered);
      }
    );
    return () => unsubscribe();
  }, [slug, categoriesLoading]);

  useEffect(() => {
    let result = [...products];

    // Filter by Type
    if (typeFilter !== 'all') {
      result = result.filter(p => {
        if (p.type) return p.type === typeFilter;
        const isVeg = !p.name.toLowerCase().includes('chicken') && !p.name.toLowerCase().includes('mutton') && !p.name.toLowerCase().includes('fish') && !p.name.toLowerCase().includes('prawns');
        return typeFilter === 'veg' ? isVeg : !isVeg;
      });
    }

    // Filter by Price
    if (priceFilter !== 'all') {
      result = result.filter(p => {
        const price = p.variants[0]?.price || 0;
        if (priceFilter === 'under200') return price < 200;
        if (priceFilter === '200to500') return price >= 200 && price <= 500;
        if (priceFilter === 'above500') return price > 500;
        return true;
      });
    }

    // Sort
    if (sortOption === 'lowToHigh') {
      result.sort((a, b) => (a.variants[0]?.price || 0) - (b.variants[0]?.price || 0));
    } else if (sortOption === 'highToLow') {
      result.sort((a, b) => (b.variants[0]?.price || 0) - (a.variants[0]?.price || 0));
    }

    setFilteredProducts(result);
  }, [products, priceFilter, typeFilter, sortOption]);

  return (
    <div className="pb-mobile-nav main-content">
      <Header />
      <CategoriesRow />
      <main className={styles.container}>
        
        <aside className={styles.sidebar}>
          <h2 className={styles.sidebarTitle}>Categories</h2>
          <div className={styles.categoryList}>
            {categoriesLoading ? (
               <div className="flex flex-col gap-sm" style={{ padding: '12px' }}>
                 {Array(10).fill(0).map((_, i) => (
                   <div key={i} className="skeleton" style={{ height: '32px', borderRadius: '6px' }} />
                 ))}
               </div>
            ) : categories.map((cat, idx) => {
              const isActive = cat.slug === slug;
              return (
                <div 
                  key={cat.id || idx} 
                  className={`${styles.categoryItem} ${isActive ? styles.categoryActive : ''}`}
                  onClick={() => router.push(`/category/${cat.slug}`)}
                >
                  {cat.name}
                </div>
              );
            })}
          </div>
        </aside>

        <section className={styles.mainContent}>
          <div className={styles.header}>
            <div className={styles.headerTop}>
              <div className={styles.titleArea}>
                <h1 className={styles.pageTitle}>
                  {categoriesLoading ? (
                    <div className="skeleton" style={{ width: '150px', height: '28px', borderRadius: '6px' }} />
                  ) : (decodedCategory || "Category")}
                </h1>
                <span className={styles.productCount}>{filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}</span>
              </div>
              <button 
                className={`${styles.filterToggleButton} ${showFilters ? styles.active : ''}`}
                onClick={() => setShowFilters(!showFilters)}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
                <span>Filter</span>
              </button>
            </div>
          </div>

          {/* Sub-Category Buttons for Pickles */}
          {decodedCategory.toLowerCase() === 'pickles' && (
            <div className={styles.subCategoryContainer}>
              <button 
                className={`${styles.subCategoryBtn} ${typeFilter === 'all' ? styles.subCategoryBtnActive : ''}`}
                onClick={() => setTypeFilter('all')}
              >
                All Pickles
              </button>
              <button 
                className={`${styles.subCategoryBtn} ${typeFilter === 'veg' ? styles.subCategoryBtnActive : ''}`}
                onClick={() => setTypeFilter('veg')}
              >
                <span className={styles.subCategoryIcon}>🟢</span> Veg Pickles
              </button>
              <button 
                className={`${styles.subCategoryBtn} ${typeFilter === 'nonveg' ? styles.subCategoryBtnActive : ''}`}
                onClick={() => setTypeFilter('nonveg')}
              >
                <span className={styles.subCategoryIcon}>🔴</span> Non-Veg Pickles
              </button>
            </div>
          )}

          {/* Sub-Category Buttons for Sweets */}
          {decodedCategory.toLowerCase() === 'sweets' && (
            <div className={styles.subCategoryContainer}>
              <button 
                className={`${styles.subCategoryBtn} ${typeFilter === 'all' ? styles.subCategoryBtnActive : ''}`}
                onClick={() => setTypeFilter('all')}
              >
                All Items
              </button>
              <button 
                className={`${styles.subCategoryBtn} ${typeFilter === 'pindi-vantalu' ? styles.subCategoryBtnActive : ''}`}
                onClick={() => setTypeFilter('pindi-vantalu')}
              >
                Pindi Vantalu
              </button>
              <button 
                className={`${styles.subCategoryBtn} ${typeFilter === 'sweet' ? styles.subCategoryBtnActive : ''}`}
                onClick={() => setTypeFilter('sweet')}
              >
                Sweets
              </button>
              <button 
                className={`${styles.subCategoryBtn} ${typeFilter === 'hot-snacks' ? styles.subCategoryBtnActive : ''}`}
                onClick={() => setTypeFilter('hot-snacks')}
              >
                Hot Snacks
              </button>
            </div>
          )}

          {/* Sub-Category Buttons for Authentic Podis */}
          {decodedCategory.toLowerCase() === 'authentic podis' && (
            <div className={styles.subCategoryContainer}>
              <button 
                className={`${styles.subCategoryBtn} ${typeFilter === 'all' ? styles.subCategoryBtnActive : ''}`}
                onClick={() => setTypeFilter('all')}
              >
                All Podis
              </button>
              <button 
                className={`${styles.subCategoryBtn} ${typeFilter === 'veg' ? styles.subCategoryBtnActive : ''}`}
                onClick={() => setTypeFilter('veg')}
              >
                <span className={styles.subCategoryIcon}>🟢</span> Veg Podis
              </button>
              <button 
                className={`${styles.subCategoryBtn} ${typeFilter === 'nonveg' ? styles.subCategoryBtnActive : ''}`}
                onClick={() => setTypeFilter('nonveg')}
              >
                <span className={styles.subCategoryIcon}>🔴</span> Non-Veg Podis
              </button>
            </div>
          )}

          {/* Sub-Category Buttons for Ghee & Oils */}
          {(decodedCategory.toLowerCase() === 'ghee & oils' || decodedCategory.toLowerCase() === 'ghee' || decodedCategory.toLowerCase() === 'oils') && (
            <div className={styles.subCategoryContainer}>
              <button 
                className={`${styles.subCategoryBtn} ${typeFilter === 'all' ? styles.subCategoryBtnActive : ''}`}
                onClick={() => setTypeFilter('all')}
              >
                All Items
              </button>
              <button 
                className={`${styles.subCategoryBtn} ${typeFilter === 'ghee' ? styles.subCategoryBtnActive : ''}`}
                onClick={() => setTypeFilter('ghee')}
              >
                Pure Ghee
              </button>
              <button 
                className={`${styles.subCategoryBtn} ${typeFilter === 'oil' ? styles.subCategoryBtnActive : ''}`}
                onClick={() => setTypeFilter('oil')}
              >
                Cold Pressed Oils
              </button>
            </div>
          )}

          {showFilters && (
            <div className={styles.filterBar}>
            <div className={styles.filterGroup}>
              <label>Price:</label>
              <select value={priceFilter} onChange={(e) => setPriceFilter(e.target.value)}>
                <option value="all">All Prices</option>
                <option value="under200">Under ₹200</option>
                <option value="200to500">₹200–₹500</option>
                <option value="above500">Above ₹500</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Type:</label>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">All Types</option>
                {decodedCategory.toLowerCase() === 'pickles' ? (
                  <>
                    <option value="veg">Veg Pickles</option>
                    <option value="nonveg">Non-Veg Pickles</option>
                  </>
                ) : decodedCategory.toLowerCase() === 'sweets' ? (
                  <>
                    <option value="sweet">Sweets</option>
                    <option value="pindi-vantalu">Pindi Vantalu</option>
                    <option value="hot-snacks">Hot Snacks</option>
                  </>
                ) : decodedCategory.toLowerCase() === 'authentic podis' ? (
                  <>
                    <option value="veg">Veg Podis</option>
                    <option value="nonveg">Non-Veg Podis</option>
                  </>
                ) : decodedCategory.toLowerCase() === 'ghee & oils' ? (
                  <>
                    <option value="ghee">Pure Ghee</option>
                    <option value="oil">Cold Pressed Oils</option>
                  </>
                ) : (
                  <>
                    <option value="veg">Veg</option>
                    <option value="nonveg">Non-Veg</option>
                  </>
                )}
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Sort:</label>
              <select value={sortOption} onChange={(e) => setSortOption(e.target.value)}>
                <option value="relevant">Relevant</option>
                <option value="lowToHigh">Price: Low to High</option>
                <option value="highToLow">Price: High to Low</option>
              </select>
            </div>
          </div>
        )}
          
          {filteredProducts.length > 0 ? (
            <div className={styles.grid}>
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>🛍️</div>
              <h3 className={styles.emptyTitle}>No products available</h3>
              <p className={styles.emptySub}>We couldn't find any products in "{decodedCategory}".</p>
              <button 
                className="btn-primary" 
                style={{marginTop: '24px'}}
                onClick={() => router.push('/')}
              >
                Browse All Products
              </button>
            </div>
          )}
        </section>

      </main>
      <Footer />
    </div>
  );
}
