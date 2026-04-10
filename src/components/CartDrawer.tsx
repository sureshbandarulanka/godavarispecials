"use client";
import React, { useEffect, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import styles from './CartDrawer.module.css';
import { useLocation } from '@/context/LocationContext';
import { parseWeight } from '@/utils/parseWeight';
import { useAuth } from '@/context/AuthContext';
import { getStoreSettings } from '@/services/productService';
import { AlertCircle, Truck, ShoppingBag, ArrowRight, X, Trash2, Gift, ChevronRight, Sparkles } from 'lucide-react';

export default function CartDrawer() {
  const { 
    isCartOpen, 
    closeCart, 
    cartItems, 
    updateQuantity, 
    removeFromCart, 
    itemsTotal,
    comboDiscount,
    cartTotal, 
    totalQuantity,
    isMinimumOrderMet, 
    isTargetMet,
    clearCart,
    shippingCharge,
    minOrderValue,
    freeDeliveryThreshold,
    deliveryEta
  } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const { location } = useLocation();

  // Gift Settings State
  const [giftSettings, setGiftSettings] = useState<any>(null);

  useEffect(() => {
    const fetchGifts = async () => {
      const settings = await getStoreSettings();
      setGiftSettings(settings);
    };
    if (isCartOpen) fetchGifts();
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  // Calculate total weight
  const totalWeightKg = cartItems.reduce((acc, item) => acc + (parseWeight(item.weight) * item.quantity), 0);
  
  const isServiceable = location.isServiceable;
  const isAdmin = user?.role === 'admin';

  return (
    <>
      <div className={styles.overlay} onClick={closeCart}></div>
      <div className={styles.drawer}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>
            <div className={styles.titleRow}>
              <ShoppingBag size={20} className={styles.titleIcon} />
              <h2>My Cart</h2>
              {cartItems.length > 0 && (
                <button className={styles.clearCartBtn} onClick={clearCart}>
                  <Trash2 size={14} /> Clear
                </button>
              )}
            </div>
            <span className={styles.itemCount}>{totalQuantity} items</span>
          </div>
          <button className={styles.closeBtn} onClick={closeCart}><X size={20} /></button>
        </div>

        <div className={styles.content}>
          {/* Serviceability Warning */}
          {!location.isServiceable && (
            <div className={styles.unserviceableBanner}>
              <AlertCircle size={20} />
              <div className={styles.bannerText}>
                <strong>❌ Delivery not available for this location</strong>
                <span>Currently we deliver only within India.</span>
              </div>
            </div>
          )}

          {/* Threshold Warnings */}
          {cartItems.length > 0 && (
            <div className={styles.thresholdsContainer}>
              {!isMinimumOrderMet ? (
                <div className={styles.movWarning}>
                  <AlertCircle size={18} />
                  <span>Add <strong>₹{Math.ceil(minOrderValue - itemsTotal)}</strong> more to reach <strong>Minimum Order of ₹{minOrderValue}</strong></span>
                </div>
              ) : !isTargetMet ? (
                <div className={styles.targetWarning}>
                  <Truck size={18} />
                  <span>🚚 <strong>Standard Shipping Active!</strong> Add ₹{Math.ceil(freeDeliveryThreshold - itemsTotal)} more for <strong>Free Delivery!</strong></span>
                </div>
              ) : (
                <div className={styles.successWarning}>
                  <Truck size={18} />
                  <span>💥 <strong>Free Delivery Active!</strong> Max savings applied!</span>
                </div>
              )}
              {deliveryEta && (
                <div className={styles.deliveryEtaCard}>
                  <div className={styles.etaIcon}>⏱️</div>
                  <div className={styles.etaText}>
                    <strong>Estimated Delivery: {deliveryEta}</strong>
                    <span>Direct from Rajahmundry</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {cartItems.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🛒</div>
              <h3>Your cart is empty</h3>
              <p>Start shopping to add items</p>
              <button className={styles.emptyBtn} onClick={closeCart}>Start Shopping</button>
            </div>
          ) : (
            <div className={styles.itemsList}>
              <div className={styles.cartItemsContainer}>
                {cartItems.map((item, idx) => (
                  <div key={`${item.product.id}-${item.weight}-${idx}`} className={styles.itemWrapper}>
                    <div className={styles.cartItem}>
                      <div className={styles.itemImageContainer}>
                        <img src={item.product.image || 'https://placehold.co/100x100?text=Product'} alt={item.product.name} />
                      </div>
                      <div className={styles.itemDetails}>
                        <h4 className={styles.itemName}>{item.product.name}</h4>
                        <span className={styles.itemWeight}>{item.weight}</span>
                        <div className={styles.itemPrice}>₹{item.lockedPrice}</div>
                      </div>
                      
                      <div className={styles.itemActions}>
                        <div className={styles.stepper}>
                          <button onClick={() => updateQuantity(item.product.id, item.weight, item.quantity - 1)}>-</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product.id, item.weight, item.quantity + 1)}>+</button>
                        </div>
                      </div>
                    </div>

                  </div>
                ))}
              </div>

              {/* Multi-Tier Gift Progress Bar */}
              {giftSettings?.isFreeGiftEnabled && giftSettings?.offers?.length > 0 && (
                <div className={styles.giftProgressSection}>
                  {(() => {
                    const productValue = itemsTotal - comboDiscount;
                    const offers = [...giftSettings.offers].sort((a,b) => a.threshold - b.threshold);
                    const unlockedOffers = offers.filter(o => productValue >= o.threshold);
                    const currentGift = unlockedOffers[unlockedOffers.length - 1];
                    const nextTier = offers.find(o => productValue < o.threshold);
                    
                    if (!nextTier && !currentGift) return null;

                    const progressPercent = nextTier 
                      ? (productValue / nextTier.threshold) * 100 
                      : 100;

                    return (
                      <div className={`${styles.giftNudgeCard} ${currentGift ? styles.giftUnlocked : ''}`}>
                        <div className={styles.giftNudgeHeader}>
                          <div className={styles.giftBadgeIcon}>
                            {currentGift ? <Sparkles size={16} /> : <Gift size={16} />}
                          </div>
                          <div className={styles.giftNudgeText}>
                            {nextTier ? (
                              <>
                                <strong>Add ₹{Math.ceil(nextTier.threshold - productValue)} more</strong>
                                <span>to get a FREE {nextTier.giftName}!</span>
                              </>
                            ) : (
                              <>
                                <strong>🎉 Max Reward Unlocked!</strong>
                                <span>You earned a FREE {currentGift.giftName}</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {nextTier && (
                          <div className={styles.progressBarWrapper}>
                            <div className={styles.progressBarBg}>
                              <div 
                                className={styles.progressBarFill} 
                                style={{ width: `${Math.min(progressPercent, 100)}%` }}
                              ></div>
                            </div>
                            <div className={styles.progressMarkers}>
                              <span>₹0</span>
                              <span>₹{nextTier.threshold}</span>
                            </div>
                          </div>
                        )}

                        {currentGift && !nextTier && (
                          <div className={styles.unlockedLabel}>
                             🎁 {currentGift.giftName} Included!
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Combo Savings Banner */}
              {comboDiscount > 0 && (
                <div className={styles.comboBanner}>
                  <div className={styles.comboIcon}>🎉</div>
                  <div className={styles.comboText}>
                    <strong>💥 Savings Applied</strong>
                    <span>You saved ₹{Math.round(comboDiscount)} on this order 🎉</span>
                  </div>
                </div>
              )}
              
              <div className={styles.billSummary}>
                <h4>Bill Summary</h4>
                <div className={styles.billRow}>
                  <span>Item Total</span>
                  <span>₹{Math.round(itemsTotal)}</span>
                </div>
                {comboDiscount > 0 && (
                  <div className={styles.billRow}>
                    <span>Combo Discount</span>
                    <span className={styles.discountValue}>-₹{comboDiscount}</span>
                  </div>
                )}
                <div className={styles.billRow}>
                  <div className={styles.labelWithIcon}>
                    <Truck size={14} /> Delivery Charges
                  </div>
                  {shippingCharge === 0 ? (
                    <span className={styles.freeText}>FREE</span>
                  ) : (
                    <span>₹{shippingCharge}</span>
                  )}
                </div>
                {shippingCharge > 0 && (
                  <div className={styles.shippingNote}>
                    Free delivery above ₹{freeDeliveryThreshold}
                  </div>
                )}
                <div className={`${styles.billRow} ${styles.billTotal}`}>
                  <span>Grand Total</span>
                  <span>₹{cartTotal}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {cartItems.length > 0 && (
          <div className={styles.footer}>
            <div 
              className={`${styles.checkoutBar} ${(!isServiceable || !isMinimumOrderMet) ? styles.disabled : ''}`}
              onClick={() => {
                if (!isServiceable || !isMinimumOrderMet) return;
                closeCart();
                router.push('/checkout');
              }}
              role="button"
            >
              <div className={styles.priceColumn}>
                <div className={styles.finalPrice}>₹{isServiceable ? cartTotal : '---'}</div>
                <div className={styles.viewDetailedBill}>
                  {isMinimumOrderMet ? 'EST. DELIVERY IN ' + deliveryEta : 'MIN ORDER NOT MET'}
                </div>
              </div>
              <div className={styles.proceedBtn}>
                {!isServiceable ? 'Location Not Serviceable' : !isMinimumOrderMet ? `Min Order ₹${minOrderValue}` : 'Proceed to Checkout'}
                <ArrowRight size={18} className={styles.btnArrow} />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
