"use client";
import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './ProductCard.module.css';
import { Product } from '@/data/products';
import { useCart } from '@/context/CartContext';
import { getDisplayPrice, getBasePrice } from '@/utils/pricingEngine';
import { useLocation } from '@/context/LocationContext';
import { useOffers } from '@/context/OfferContext';
import { Truck, Bell } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';

function Toast({ message, onClose }: { message: string, onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed',
      bottom: '100px',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#0f172a',
      color: 'white',
      padding: '12px 24px',
      borderRadius: '50px',
      fontSize: '14px',
      fontWeight: 600,
      boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
      zIndex: 3000,
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      animation: 'slideUp 0.3s ease-out'
    }}>
      {message}
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
}

export default function ProductCard({ product }: { product: Product }) {
  const { cartItems, addToCart, updateQuantity } = useCart();
  const { location } = useLocation();
  const { getOfferForProduct } = useOffers();
  const { user, openLoginModal } = useAuth();
  
  const activeOffer = useMemo(() => getOfferForProduct(product.id.toString()), [product.id, getOfferForProduct]);
  const router = useRouter();
  const [isNotified, setIsNotified] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleNotify = async () => {
    if (!user) {
      openLoginModal();
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/notify-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: user.email, 
          productName: product.name, 
          productId: product.id.toString() 
        })
      });
      if (res.ok) {
        setIsNotified(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const [selectedVariant, setSelectedVariant] = React.useState(
    product.variants && product.variants.length > 0 
      ? product.variants[0] 
      : { weight: 'Default', price: 0 } as any
  );
  
  const cartItem = cartItems.find(item => item.product.id === product.id && item.weight === selectedVariant.weight);
  const quantity = cartItem ? cartItem.quantity : 0;

  // Centralized source of truth for display price
  const baseSellingPrice = useMemo(() => {
    return getDisplayPrice(selectedVariant, activeOffer);
  }, [selectedVariant?.id, selectedVariant?.price, selectedVariant?.cost, activeOffer]);

  const originalPrice = useMemo(() => {
    return getBasePrice(selectedVariant);
  }, [selectedVariant?.id, selectedVariant?.price, selectedVariant?.cost]);

  const handleNav = (e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).closest('button')) {
      router.push(`/product/${product.id}`);
    }
  };

  const handleAdd = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    
    if (baseSellingPrice === null) {
      console.warn("Price not ready or invalid");
      return;
    }

    addToCart(product, selectedVariant.weight, baseSellingPrice);

    // Animation handled by components listening to cart state
  };

  const handleIncrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateQuantity(product.id, selectedVariant.weight, quantity + 1);
  };

  const handleDecrease = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateQuantity(product.id, selectedVariant.weight, quantity - 1);
  };

  return (
    <div 
      className={`${styles.productCard} ${quantity > 0 ? styles.addedItem : ''} animate-slide-up`}
      onClick={handleNav}
    >
      <div className={styles.imageContainer}>
        {activeOffer && (
          <div className={styles.offerBadge}>
            {activeOffer.discountPercent}% OFF
          </div>
        )}

        {product.isOutOfStock && (
          <div className={styles.outOfStockBadge}>
            OUT OF STOCK
          </div>
        )}

        {product.image || (product.images && product.images.length > 0) ? (
          <Image 
            src={product.image || product.images![0]} 
            alt={product.name || 'Product Image'} 
            fill 
            sizes="(max-width: 768px) 50vw, 25vw"
            className={`${styles.productImage} transition-all`} 
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div className={styles.noImage}>
            <div className={styles.placeholderIcon}>📸</div>
          </div>
        )}
      </div>
      <div className={styles.content}>
        <div className={styles.productName}>{product.name}</div>
        <div className={styles.weightSelector}>
          {product.variants.map((v, idx) => (
            <button
              key={idx}
              className={`${styles.weightChip} ${selectedVariant.weight === v.weight ? styles.activeWeight : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedVariant(v);
              }}
            >
              {v.weight}
            </button>
          ))}
        </div>
      </div>
      
      <div className={styles.bottomRow}>
        <div className={styles.priceContainer}>
          {activeOffer && originalPrice && (
            <div className={styles.originalPrice}>₹{Math.round(originalPrice)}</div>
          )}
          <div className={styles.productPrice}>
            {baseSellingPrice === null ? (
              "₹--"
            ) : (
              `₹${baseSellingPrice}`
            )}
          </div>
        </div>
        {product.isOutOfStock ? (
          <button 
            className={`${styles.notifyBtn} ${isNotified ? styles.notified : ''}`}
            disabled={loading || isNotified}
            onClick={(e) => {
              e.stopPropagation();
              handleNotify();
            }}
          >
            {loading ? '...' : isNotified ? 'NOTIFIED' : 'NOTIFY ME'}
          </button>
        ) : quantity === 0 ? (
          <button 
            className={styles.addBtn} 
            onClick={handleAdd}
          >
            ADD
          </button>
        ) : (
          <div className={styles.stepper}>
            <button className={styles.stepperBtn} onClick={handleDecrease}>-</button>
            <span className={styles.stepperSpan}>{quantity}</span>
            <button className={styles.stepperBtn} onClick={handleIncrease}>+</button>
          </div>
        )}

        {isNotified && (
          <Toast 
            message="Notified Successfully!" 
            onClose={() => setIsNotified(false)} 
          />
        )}
      </div>
    </div>
  );
}
