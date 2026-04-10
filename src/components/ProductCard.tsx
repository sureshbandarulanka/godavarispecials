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

    const button = e.currentTarget;
    const card = button.closest(`.${styles.productCard}`) as HTMLElement;
    const cartIcon = document.getElementById('cart-icon');

    if (card && cartIcon) {
      const cardRect = card.getBoundingClientRect();
      const cartRect = cartIcon.getBoundingClientRect();

      const clone = card.cloneNode(true) as HTMLElement;
      clone.classList.add('fly-image');
      clone.style.width = `${cardRect.width}px`;
      clone.style.height = `${cardRect.height}px`;
      clone.style.left = `${cardRect.left}px`;
      clone.style.top = `${cardRect.top}px`;
      clone.style.margin = '0';
      document.body.appendChild(clone);

      requestAnimationFrame(() => {
        clone.style.transform = `translate(${cartRect.left - cardRect.left}px, ${cartRect.top - cardRect.top}px) scale(0.2)`;
        clone.style.opacity = '0.5';
      });

      setTimeout(() => {
        clone.remove();
        cartIcon.classList.add('cart-bounce');
        setTimeout(() => cartIcon.classList.remove('cart-bounce'), 400);
      }, 600);
    }
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
      className={`${styles.productCard} ${quantity > 0 ? 'added-to-cart' : ''} animate-slide-up hover-lift`}
      onClick={handleNav}
    >
      <div className={styles.imageContainer}>
        {activeOffer && (
          <div className={styles.offerBadge}>
            {activeOffer.discountPercent}% OFF
          </div>
        )}

        {product.image ? (
          <Image 
            src={product.image} 
            alt={product.name} 
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
