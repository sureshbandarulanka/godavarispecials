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

  // Trigger pop animation on item count change
  useEffect(() => {
    if (itemCount > 0) {
      setIsPopping(true);
      const timer = setTimeout(() => setIsPopping(false), 400);
      return () => clearTimeout(timer);
    }
  }, [itemCount]);

  if (cartItems.length === 0 || isCartOpen || pathname === '/checkout') return null;

  return (
    <div 
      className={`${styles.stickyBar} ${isPopping ? styles.popUpdate : ''}`}
      onClick={openCart}
      role="button"
    >
      <div className={styles.container}>
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
