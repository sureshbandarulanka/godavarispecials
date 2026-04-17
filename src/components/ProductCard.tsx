"use client";
import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import styles from './ProductCard.module.css';
import { Product } from '@/data/products';
import { useCart } from '@/context/CartContext';
import { getDisplayPrice, getBasePrice } from '@/utils/pricingEngine';
import { useLocation } from '@/context/LocationContext';
import { useOffers } from '@/context/OfferContext';
import { Truck } from 'lucide-react';
import Image from 'next/image';

export default function ProductCard({ product }: { product: Product }) {
  const { cartItems, addToCart, updateQuantity } = useCart();
  const { location } = useLocation();
  const { getOfferForProduct } = useOffers();
  
  const activeOffer = useMemo(() => getOfferForProduct(product.id.toString()), [product.id, getOfferForProduct]);
  const router = useRouter();
  
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
        {quantity === 0 ? (
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
      </div>
    </div>
  );
}
