"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/data/products';
import { useAuth } from './AuthContext';
import { useLocation } from './LocationContext';
import { getDisplayPrice, calculateComboDiscount } from '@/utils/pricingEngine';

export interface CartItem {
  product: Product;
  weight: string;
  price: number; // For historical compatibility
  lockedPrice: number; // The smart bundled price
  quantity: number;
  internalProfit?: number;
  cost: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, weight: string, price: number) => void;
  removeFromCart: (productId: string | number, weight: string) => void;
  updateQuantity: (productId: string | number, weight: string, quantity: number) => void;
  clearCart: () => void;
  itemsTotal: number;
  comboDiscount: number;
  cartTotal: number;
  totalQuantity: number;
  isMinimumOrderMet: boolean;
  isTargetMet: boolean;
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toastMessage: string | null;
  showToast: (msg: string) => void;
  shippingCharge: number;
  minOrderValue: number;
  freeDeliveryThreshold: number;
  deliveryEta: string;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { location, shippingRule } = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const stored = localStorage.getItem('cart');
    if (stored) {
      try { setCartItems(JSON.parse(stored)); } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product: Product, weight: string, price: number) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.weight === weight);
      if (existing) {
        return prev.map(item => (item.product.id === product.id && item.weight === weight) 
          ? { ...item, quantity: item.quantity + 1, lockedPrice: price } : item);
      }
      return [...prev, { product, weight, price: 0, lockedPrice: price, quantity: 1, cost: 0 }];
    });
    showToast(`Added ${product.name} (${weight}) to cart`);
  };

  const removeFromCart = (id: string | number, weight: string) => {
    setCartItems(prev => prev.filter(item => !(item.product.id === id && item.weight === weight)));
  };

  const updateQuantity = (id: string | number, weight: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(id, weight);
      return;
    }
    setCartItems(prev => prev.map(item => (item.product.id === id && item.weight === weight) 
      ? { ...item, quantity: qty } : item));
  };

  const clearCart = () => setCartItems([]);

  const totalQuantity = cartItems.reduce((total, item) => total + item.quantity, 0);

  const processedCartItems: CartItem[] = cartItems.map(item => {
    const variant = item.product.variants.find(v => v.weight === item.weight) || item.product.variants[0];
    const itemCost = variant.cost || (variant.costPrice + (variant.packagingCost || 0));
    return { ...item, cost: itemCost };
  });

  // 🚚 Dynamic Shipping Engine Integration
  const currentRule = shippingRule || {
    shipping: 99,
    minOrder: 199,
    freeDelivery: 499,
    eta: "3-5 Days"
  };

  const itemsTotal = processedCartItems.reduce((total, item) => {
    const itemPrice = Number(item.lockedPrice) || 0;
    return total + (itemPrice * item.quantity);
  }, 0);

  const comboDiscount = calculateComboDiscount(totalQuantity);
  
  // Free delivery check
  const finalShippingCharge = itemsTotal >= currentRule.freeDelivery ? 0 : currentRule.shipping;
  
  // Grand Total calculation
  const cartTotal = itemsTotal - comboDiscount + finalShippingCharge;
  
  const isMinimumOrderMet = itemsTotal >= currentRule.minOrder;
  const isTargetMet = itemsTotal >= currentRule.freeDelivery;

  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 1500);
  };

  // Memoize the context value to prevent double renders in consumers like StickyCartBar
  const contextValue = React.useMemo(() => ({
    cartItems: processedCartItems, 
    addToCart, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    itemsTotal,
    comboDiscount,
    cartTotal, 
    totalQuantity,
    isMinimumOrderMet,
    isTargetMet,
    isCartOpen, 
    openCart, 
    closeCart, 
    toastMessage, 
    showToast,
    shippingCharge: finalShippingCharge,
    minOrderValue: currentRule.minOrder,
    freeDeliveryThreshold: currentRule.freeDelivery,
    deliveryEta: currentRule.eta
  }), [
    processedCartItems,
    itemsTotal,
    comboDiscount,
    cartTotal,
    totalQuantity,
    isMinimumOrderMet,
    isTargetMet,
    isCartOpen,
    toastMessage,
    finalShippingCharge,
    currentRule
  ]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}


export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
