"use client";
import React, { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { usePathname } from 'next/navigation';
import styles from './StickyCartBar.module.css';

export default function StickyCartBar() {
  const { cartItems, cartTotal, openCart, isCartOpen } = useCart();
  const [isPopping, setIsPopping] = useState(false);
  const pathname = usePathname();
  
  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const prevCountRef = React.useRef(itemCount);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Trigger pop animation on item count increase, but skip initial load
  useEffect(() => {
    if (isMounted && itemCount > prevCountRef.current) {
      setIsPopping(true);
      // isPopping will be reset by onAnimationEnd
    }
    prevCountRef.current = itemCount;
  }, [itemCount, isMounted]);

  if (cartItems.length === 0 || isCartOpen || pathname === '/checkout') return null;

  const isProductPage = pathname?.startsWith('/product/');
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div 
      className={`${styles.stickyBar} ${isProductPage ? styles.productPageStickyBar : ''}`}
      onClick={openCart}
      role="button"
    >
      <div className={`${styles.container} ${isPopping ? styles.popUpdate : ''}`} onAnimationEnd={() => setIsPopping(false)}>
        <div className={styles.cartInfo}>
          <div className={styles.price}>₹{cartTotal.toFixed(2)}</div>
          <div className={styles.divider}></div>
          <div className={styles.countBadge}>
            {itemCount} {itemCount === 1 ? 'ITEM' : 'ITEMS'}
          </div>
        </div>
        
        <div className={styles.viewCartBtn}>
          <span className={styles.btnText}>
            Cart
            <span className={styles.chevron}>›</span>
          </span>
        </div>
      </div>
    </div>
  );
}
