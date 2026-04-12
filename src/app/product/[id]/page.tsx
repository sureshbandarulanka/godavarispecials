"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { useCart } from '@/context/CartContext';
import { getProductById, getProductsByCategory, getProducts, fetchFirebaseData } from '@/services/productService';
import { getDisplayPrice, getBasePrice } from '@/utils/pricingEngine';
import { useLocation } from '@/context/LocationContext';
import { useOffers } from '@/context/OfferContext';
import { useCountdown } from '@/hooks/useCountdown';
import { Product } from '@/data/products';
import JsonLd, { getProductSchema } from '@/components/JsonLd';
import styles from './ProductDetail.module.css';

function ActiveOfferDisplay({ offer }: { offer: any }) {
  const { timeLeft, isUrgent, isExpired } = useCountdown(offer.endDate);
  
  if (isExpired) return null;

  return (
    <div className={styles.activeOfferSection}>
      <h3 className={styles.offerTitle}>{offer.title}</h3>
      <div className={styles.offerSavings}>
        🔥 Save {offer.discountPercent}% today! 
        <span style={{ textDecoration: 'line-through', opacity: 0.6, marginLeft: '8px' }}>₹{offer.originalPrice}</span>
        <span style={{ fontWeight: 800, marginLeft: '4px' }}>₹{offer.offerPrice}</span>
      </div>
      <div className={`${styles.offerTimer} ${isUrgent ? 'animate-pulse' : ''}`}>
        ⏳ Ends in: {timeLeft}
      </div>
    </div>
  );
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { cartItems, addToCart, removeFromCart, updateQuantity } = useCart();
  const { location, shippingRule } = useLocation();
  const { getOfferForProduct } = useOffers();
  
  const activeOffer = useMemo(() => {
    return id ? getOfferForProduct(Array.isArray(id) ? id[0] : id) : undefined;
  }, [id, getOfferForProduct]);
  
  const [product, setProduct] = useState<Product | null>(null);
  const [mainImage, setMainImage] = useState<string>('');
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [peopleAlsoBought, setPeopleAlsoBought] = useState<Product[]>([]);
  const [isNotFound, setIsNotFound] = useState(false);
  const [isClient, setIsClient] = useState(false);
  
  const [isDescOpen, setIsDescOpen] = useState(true);
  const [isShelfOpen, setIsShelfOpen] = useState(false);
  
  const [selectedVariant, setSelectedVariant] = useState<any>(null);

  // Centralized source of truth for display price
  const currentPrice = useMemo(() => {
    return getDisplayPrice(selectedVariant, activeOffer);
  }, [product?.id, selectedVariant?.id, selectedVariant?.price, selectedVariant?.cost, activeOffer]);

  const originalPrice = useMemo(() => {
    return getBasePrice(selectedVariant);
  }, [product?.id, selectedVariant?.id, selectedVariant?.price, selectedVariant?.cost]);

  useEffect(() => {
    setIsClient(true);
    window.scrollTo(0, 0);

    const loadProductData = async () => {
      await fetchFirebaseData();
      const prodId = typeof id === 'string' ? id : id?.[0];
      if (prodId) {
        const foundProduct = getProductById(prodId);
        if (foundProduct) {
          setProduct(foundProduct);
          setMainImage(foundProduct.image || 'https://placehold.co/400x400?text=No+Image');
          setSelectedVariant(foundProduct.variants[0]);
          
          // Fetch similar products (same category, different id)
          const similar = getProductsByCategory(foundProduct.category).filter(p => p.id.toString() !== prodId.toString());
          setSimilarProducts(similar.slice(0, 5));
          
          // Mock people also bought (other categories)
          const others = getProducts().filter(p => p.category !== foundProduct.category).slice(0, 5);
          setPeopleAlsoBought(others);
          setIsNotFound(false);
        } else {
          setIsNotFound(true);
        }
      }
    };
    loadProductData();
  }, [id]);


  if (isNotFound) {
    return (
      <div className="pb-mobile-nav">
        <Header />
        <main className={styles.container} style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', justifyContent: 'flex-start', paddingTop: '40px', gap: '16px' }}>
          <h2 className="h2 text-bold">Product Not Found</h2>
          <p className="text-secondary">Sorry, we couldn't find the product you're looking for.</p>
          <button className="btn-primary" onClick={() => router.push('/')}>Return to Home</button>
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pb-mobile-nav">
        <Header />
        <main className={styles.container}>
          <div className={styles.breadcrumb}>
            <div className="skeleton" style={{ width: '200px', height: '16px' }}></div>
          </div>
          <div className={styles.productLayout}>
            <div className={styles.imageSection}>
              <div className="skeleton" style={{ width: '100%', aspectRatio: '1', borderRadius: '16px' }}></div>
            </div>
            <div className={styles.infoSection}>
              <div className="skeleton" style={{ width: '80%', height: '32px', marginBottom: '16px' }}></div>
              <div className="skeleton" style={{ width: '40%', height: '24px', marginBottom: '24px' }}></div>
              <div className="skeleton" style={{ width: '60%', height: '40px', marginBottom: '32px' }}></div>
              <div className="skeleton" style={{ width: '100%', height: '100px', borderRadius: '16px' }}></div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const cartItem = selectedVariant 
    ? cartItems.find(item => item.product.id === product.id && item.weight === selectedVariant.weight)
    : null;
  const quantity = cartItem ? cartItem.quantity : 0;

  const mockThumbnails = [
    product.image || 'https://placehold.co/400x400?text=No+Image',
    'https://placehold.co/400x400?text=View+2',
    'https://placehold.co/400x400?text=View+3'
  ];

  const currentMrp = currentPrice ? Math.round(Number(selectedVariant?.mrp) || currentPrice * 1.2) : null;
  
  const getPricePerKg = () => {
    if (!selectedVariant || !currentPrice) return null;
    const weightStr = selectedVariant.weight.toLowerCase();
    if (weightStr.includes('kg')) {
      const kg = parseFloat(weightStr) || 1;
      return Math.round(currentPrice / kg);
    } else if (weightStr.includes('g')) {
      const g = parseFloat(weightStr) || 1;
      return Math.round((currentPrice / g) * 1000);
    }
    return null;
  };
  const pricePerKg = getPricePerKg();

  return (
    <div className="pb-mobile-nav main-content">
      <JsonLd data={getProductSchema(product, activeOffer)} />
      <Header />
      <main className={styles.container}>
        <div className={styles.breadcrumb}>
          <Link href="/">Home</Link> &gt; <Link href="/">{product.category}</Link> &gt; {product.name}
        </div>

        <div className={styles.productLayout}>
          {/* LEFT: Image Gallery */}
          <div className={styles.imageSection}>
            <div className={styles.mainImageContainer}>
              {product.image ? (
                <Image 
                  src={mainImage} 
                  alt={product.name} 
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className={styles.mainImage} 
                />
              ) : (
                <div className={styles.noImageLarge}>
                  <span>No Image Available</span>
                </div>
              )}
            </div>
            <div className={styles.thumbnails}>
              {mockThumbnails.map((img, idx) => (
                <div 
                  key={idx} 
                  className={`${styles.thumbnail} ${mainImage === img ? styles.thumbnailActive : ''}`}
                  onClick={() => setMainImage(img)}
                  style={{ position: 'relative' }}
                >
                  <Image 
                    src={img} 
                    alt={`${product.name} view ${idx+1}`} 
                    fill
                    sizes="80px"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Product Info */}
          <div className={styles.infoSection}>
            <h1 className={styles.title}>{product.name}</h1>
            
            <div className={styles.deliveryBadge}>
              🚚 <span>Free Delivery above ₹{shippingRule?.freeDelivery || 499}</span>
            </div>

            {activeOffer && <ActiveOfferDisplay offer={activeOffer} />}

              <div className={styles.priceSection}>
                <div className={styles.mainPriceRow}>
                  <span className={styles.price}>
                    {currentPrice === null ? "₹--" : `₹${currentPrice}`}
                  </span>
                  {activeOffer && originalPrice && (
                    <span className={styles.mrp} style={{ marginLeft: '12px', fontSize: '18px', color: '#94a3b8' }}>
                      ₹{Math.round(originalPrice)}
                    </span>
                  )}
                  {!activeOffer && currentMrp && <span className={styles.mrp}>₹{currentMrp}</span>}
                </div>
                {pricePerKg && (
                  <div className={styles.pricePerKgDetail}>₹{pricePerKg}/kg</div>
                )}
              </div>

            <div className={styles.weightSelector}>
              {product.variants.map((v: any, idx: number) => (
                <div 
                  key={idx}
                  className={`${styles.weightOption} ${selectedVariant?.weight === v.weight ? styles.weightOptionActive : ''}`}
                  onClick={() => setSelectedVariant(v)}
                >
                  {v.weight}
                </div>
              ))}
            </div>

            <div className={styles.actionSection}>
              <div className={styles.actionButtons}>
                {quantity === 0 ? (
                  <button 
                    className={styles.btnAdd} 
                    onClick={() => currentPrice !== null && addToCart(product, selectedVariant!.weight, currentPrice)}
                    disabled={currentPrice === null}
                  >
                    ADD TO CART
                  </button>
                ) : (
                  <div className={styles.quantityControl}>
                    <button className={styles.qtyBtn} onClick={() => updateQuantity(product.id, selectedVariant!.weight, quantity - 1)}>-</button>
                    <span className={styles.qtyText}>{quantity}</span>
                    <button className={styles.qtyBtn} onClick={() => updateQuantity(product.id, selectedVariant!.weight, quantity + 1)}>+</button>
                  </div>
                )}
                <button 
                  className={styles.btnBuyNow} 
                  onClick={() => {
                    if (currentPrice === null) return;
                    if (quantity === 0) {
                      addToCart(product, selectedVariant!.weight, currentPrice);
                    }
                    router.push('/checkout');
                  }}
                  disabled={currentPrice === null}
                >
                  BUY NOW
                </button>
              </div>
            </div>

            <div className={styles.whyChooseUs}>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>🌿</div>
                <div className={styles.featureText}>Fresh &<br/>Homemade</div>
              </div>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>⚡</div>
                <div className={styles.featureText}>Superfast<br/>Delivery</div>
              </div>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>🏅</div>
                <div className={styles.featureText}>Best<br/>Quality</div>
              </div>
            </div>

            <div className={styles.accordionSection}>
              <div className={styles.accordionItem}>
                <div className={styles.accordionHeader} onClick={() => setIsDescOpen(!isDescOpen)}>
                  <span className={styles.accordionTitle}>Product Description</span>
                  <span className={`${styles.accordionIcon} ${isDescOpen ? styles.accordionIconActive : ''}`}>▼</span>
                </div>
                {isDescOpen && (
                  <div className={styles.accordionContent}>
                    {product.name} is authentically prepared with premium quality ingredients following traditional recipes from Godavari districts. Perfect for your daily meals or special occasions.
                  </div>
                )}
              </div>
              

              <div className={styles.accordionItem}>
                <div className={styles.accordionHeader} onClick={() => setIsShelfOpen(!isShelfOpen)}>
                  <span className={styles.accordionTitle}>Shelf Life</span>
                  <span className={`${styles.accordionIcon} ${isShelfOpen ? styles.accordionIconActive : ''}`}>▼</span>
                </div>
                {isShelfOpen && (
                  <div className={styles.accordionContent}>
                    Best before 3 months from the date of manufacturing. Store in a cool, dry place. Always use a dry spoon.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* MOBILE ONLY: Fixed Bottom Action Bar */}
        <div className={styles.mobileActionContainer}>
          {quantity === 0 ? (
            <button
              className={styles.mobileAddToCart}
              onClick={() => currentPrice !== null && addToCart(product, selectedVariant!.weight, currentPrice)}
              disabled={currentPrice === null}
            >
              Add to Cart
            </button>
          ) : (
            <div className={styles.mobileQtyControl}>
              <button onClick={() => updateQuantity(product.id, selectedVariant!.weight, quantity - 1)}>−</button>
              <span>{quantity}</span>
              <button onClick={() => updateQuantity(product.id, selectedVariant!.weight, quantity + 1)}>+</button>
            </div>
          )}
          <button
            className={styles.mobileBuyNow}
            onClick={() => {
              if (currentPrice === null) return;
              if (quantity === 0) addToCart(product, selectedVariant!.weight, currentPrice);
              router.push('/checkout');
            }}
            disabled={currentPrice === null}
          >
            Buy Now
          </button>
        </div>

        {similarProducts.length > 0 && (
          <div className={styles.recommendations}>
            <h2 className={styles.sectionTitle}>Similar Products</h2>
            <div className={styles.scrollContainer}>
              {similarProducts.map(p => (
                <div style={{minWidth: '180px', maxWidth: '180px'}} key={p.id}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        )}

        {peopleAlsoBought.length > 0 && (
          <div className={`${styles.recommendations} ${styles.peopleBought}`} style={{marginTop: '20px'}}>
            <h2 className={styles.sectionTitle}>People also bought</h2>
            <div className={styles.scrollContainer}>
              {peopleAlsoBought.map(p => (
                <div style={{minWidth: '180px', maxWidth: '180px'}} key={p.id}>
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}
