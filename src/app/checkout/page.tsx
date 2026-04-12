"use client";
import React, { useEffect, useState, useCallback } from 'react';
import styles from './Checkout.module.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { placeOrderAsync, logFailedPayment, getStoreSettings } from '@/services/productService';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useLocation } from '@/context/LocationContext';
import { parseWeight } from '@/utils/parseWeight';
import { Gift, ChevronRight } from 'lucide-react';


interface Address {
  id: string;
  name: string;
  phone: string;
  email: string;
  address1: string;
  address2: string;
  city: string;
  pincode: string;
}

const PAYMENT_ICONS = {
  COD: '/assets/Payments/cod.png',
  ONLINE: '/assets/Payments/online.png'
};

export default function CheckoutPage() {
  const { user } = useAuth();
  const { cartItems, itemsTotal, comboDiscount, cartTotal, shippingCharge, minOrderValue, isMinimumOrderMet, freeDeliveryThreshold, deliveryEta, clearCart, showToast } = useCart();
  const { location } = useLocation();
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  // Address Management State
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
  const [loading, setLoading] = useState(false);
  
  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [manualCouponApplied, setManualCouponApplied] = useState(false);
  const [suggestedCoupon, setSuggestedCoupon] = useState<any>(null);

  // Gift Settings
  const [giftSettings, setGiftSettings] = useState<any>(null);
  
  // Form State
  const [formData, setFormData] = useState<Omit<Address, 'id'>>({
    name: '',
    phone: '',
    email: '',
    address1: '',
    address2: '',
    city: '',
    pincode: ''
  });

  useEffect(() => {
    setIsClient(true);
    
    // Load Razorpay Script
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);

    const fetchInitialData = async () => {
      const storedAddresses = localStorage.getItem('userAddresses');
      if (storedAddresses) {
        try {
          const parsed = JSON.parse(storedAddresses);
          setAddresses(parsed);
          if (parsed.length > 0) {
            setSelectedAddressId(parsed[0].id);
          }
        } catch (e) {}
      } else {
        setIsFormOpen(true); // Open form if no addresses exist
      }

      // Fetch Gift Settings
      const gSettings = await getStoreSettings();
      setGiftSettings(gSettings);

      if (user) {
        setFormData(prev => ({ ...prev, name: user.name || '', phone: user.phone || '' }));
      }
    };

    fetchInitialData();

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [user]);

  // Handle Smart Auto-Apply Logic
  useEffect(() => {
    if (isClient && user && cartTotal > 0 && !manualCouponApplied) {
      const timer = setTimeout(() => {
        handleAutoApply();
      }, 1000); // Small delay for better UX
      return () => clearTimeout(timer);
    }
  }, [cartTotal, user, isClient, manualCouponApplied]);

  const handleAutoApply = async () => {
    if (!user || manualCouponApplied) return;

    try {
      const response = await fetch('/api/coupons/auto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cartTotal: cartTotal, 
          userId: user.uid 
        }),
      });

      const result = await response.json();

      if (result.success) {
        if (result.applied) {
          setAppliedCoupon(result.coupon);
          setCouponDiscount(result.discount);
          setSuggestedCoupon(null);
          setCouponError(null);
          // showToast("Best offer auto-applied! 🎉"); // Optional: might be too intrusive
        } else if (result.suggested) {
          setSuggestedCoupon({ ...result.coupon, savings: result.discount });
        } else {
          setSuggestedCoupon(null);
        }
      }
    } catch (e) {
      console.error("Auto apply failed", e);
    }
  };

  if (!isClient) return null;

  if (cartItems.length === 0) {
    return (
      <div className={styles.checkoutPage}>
        <Header />
        <main className="container main-content">
          <div className="premium-card">
            <div style={{ fontSize: '80px', marginBottom: '16px' }}>🛒</div>
            <h2 className="h2 text-bold" style={{ marginBottom: '16px' }}>Your cart is empty</h2>
            <p className="text-secondary" style={{ marginBottom: '24px' }}>Add some delicious items to your cart to proceed.</p>
            <button className="btn-shop" onClick={() => router.push('/')}>Start Shopping</button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Billing Calculations
  const totalWeightKg = cartItems.reduce((acc, item) => acc + (parseWeight(item.weight) * item.quantity), 0);
  const deliveryCharge = shippingCharge;
  const packagingCharge = 0;
  const gst = 0;
  const discount = comboDiscount + couponDiscount;
  const totalAmount = Math.max(cartTotal - couponDiscount, 0);

  // Multi-Tier Gift Logic
  const productValue = itemsTotal - comboDiscount - couponDiscount;
  const isEnabled = giftSettings?.isFreeGiftEnabled && giftSettings?.offers?.length > 0;
  
  const offers = isEnabled ? [...giftSettings.offers].sort((a, b) => a.threshold - b.threshold) : [];
  const eligibleOffers = offers.filter(o => productValue >= o.threshold);
  const currentGift = eligibleOffers[eligibleOffers.length - 1];
  const nextTier = offers.find(o => productValue < o.threshold);

  const isGiftEligible = !!currentGift;
  const amountNeededForGift = nextTier ? Math.ceil(nextTier.threshold - productValue) : 0;

  const handleSaveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.address1 || !formData.pincode) {
      alert("Please fill all required fields");
      return;
    }

    let updatedAddresses;
    if (editingAddressId) {
      updatedAddresses = addresses.map(addr => 
        addr.id === editingAddressId ? { ...formData, id: editingAddressId } : addr
      );
      showToast("Address updated successfully");
    } else {
      const newAddress = { ...formData, id: `ADDR-${Date.now()}` };
      updatedAddresses = [...addresses, newAddress];
      setSelectedAddressId(newAddress.id);
      showToast("Address saved successfully");
    }

    setAddresses(updatedAddresses);
    localStorage.setItem('userAddresses', JSON.stringify(updatedAddresses));
    setIsFormOpen(false);
    setEditingAddressId(null);
  };

  const handleDeleteAddress = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = addresses.filter(a => a.id !== id);
    setAddresses(updated);
    localStorage.setItem('userAddresses', JSON.stringify(updated));
    if (selectedAddressId === id) setSelectedAddressId(updated[0]?.id || null);
  };

  const handleEditAddress = (addr: Address, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData(addr);
    setEditingAddressId(addr.id);
    setIsFormOpen(true);
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    if (!user) {
      showToast("Please login to apply coupon");
      return;
    }

    setIsApplying(true);
    setCouponError(null);

    try {
      const response = await fetch('/api/coupons/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim().toUpperCase(),
          cartTotal: cartTotal,
          userId: user.uid
        }),
      });

      const result = await response.json();

      if (result.success) {
        setAppliedCoupon(result.coupon);
        setCouponDiscount(result.discount);
        setCouponError(null);
        setManualCouponApplied(true); // Lock it
        setSuggestedCoupon(null);
        showToast("Coupon applied! 🎉");
      } else {
        setCouponError(result.message);
        setAppliedCoupon(null);
        setCouponDiscount(0);
      }
    } catch (e) {
      setCouponError("Failed to apply coupon");
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
    setCouponError(null);
    setManualCouponApplied(false); // Unlock auto-apply
    setSuggestedCoupon(null);
  };

  const handleApplySuggested = (coupon: any) => {
    setAppliedCoupon(coupon);
    setCouponDiscount(coupon.savings);
    setCouponError(null);
    setManualCouponApplied(true); // Treat as manual once clicked
    setSuggestedCoupon(null);
    showToast(`${coupon.code} applied! 🎉`);
  };

  const handlePayment = async (selectedAddress: Address) => {
    try {
      const response = await fetch("/api/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: totalAmount }),
      });

      const order = await response.json();

      if (order.error) {
        throw new Error(order.error);
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "Godavari Specials",
        description: "Fresh Homemade Delicacies",
        order_id: order.id,
        handler: async function (response: any) {
          try {
            setLoading(true);
            const verifyRes = await fetch("/api/verify-payment", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const result = await verifyRes.json();

            if (result.success) {
              await completeOrder(selectedAddress, response.razorpay_payment_id);
            } else {
              await logFailedPayment({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                reason: result.message || "Invalid signature"
              });
              alert("Payment verification failed. If money was deducted, please contact support.");
              setLoading(false);
            }
          } catch (error) {
            console.error("Verification failed:", error);
            alert("Failed to verify payment. Please contact support.");
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            showToast("Payment cancelled");
          }
        },
        prefill: {
          name: selectedAddress.name,
          email: selectedAddress.email || user?.email || "",
          contact: selectedAddress.phone,
        },
        theme: {
          color: "#3472ba",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error("Payment initiation failed:", error);
      alert("Failed to initiate payment. " + (error.message || ""));
      setLoading(false);
    }
  };

  const completeOrder = async (selectedAddress: Address, paymentId: string | null = null) => {
    // Client-side ID for local tracking until success
    const tempOrderId = `ORD-${Date.now()}`;
    
    const pricing = {
      deliveryCharge,
      packagingCharge,
      gst,
      comboDiscount,
      couponDiscount,
      couponCode: appliedCoupon?.code || null,
      isAutoApplied: !!(!manualCouponApplied && appliedCoupon?.autoApply),
      totalAmount
    };

    const orderData = {
      orderId: tempOrderId,
      userId: user?.uid || null,
      items: cartItems.map(item => ({
        id: item.product.id,
        name: item.product.name,
        image: item.product.image || "",
        weight: item.weight,
        price: item.lockedPrice,
        quantity: item.quantity
      })),
      pricing,
      total: totalAmount,
      address: {
        ...selectedAddress,
        email: selectedAddress.email || "",
        address2: selectedAddress.address2 || ""
      },
      paymentMethod: paymentMethod,
      paymentId: paymentId || null,
      deliveryCharge,
      totalWeightKg,
      distanceKm: location?.distanceKm || 0,
      shippingDetails: {
        fees: deliveryCharge,
        moq: minOrderValue,
        freeAbove: freeDeliveryThreshold,
        eta: deliveryEta || "Standard Shipping"
      },
      deliveryTime: deliveryEta || "Standard Shipping",
      status: "Placed",
      hasFreeGift: isGiftEligible,
      giftName: currentGift?.giftName || null,
      createdAt: new Date().toISOString()
    };

    try {
      const fbOrderId = await placeOrderAsync(orderData);

      // Trigger Email Notification (Secure Server-Side Generation)
      try {
        fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: fbOrderId }),
        }).catch(err => console.error("Email API failed:", err));
      } catch (e) {
        console.error("Failed to trigger email notification:", e);
      }

      router.push(`/order-success?id=${fbOrderId}`);
      showToast("Order placed successfully!");
      
      setTimeout(() => {
        clearCart();
        localStorage.removeItem('cart');
        setLoading(false);
      }, 500);
    } catch (error) {
      alert("Failed to save order. Please contact support with Payment ID: " + paymentId);
      setLoading(false);
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAddressId) {
      alert("Please select or add a delivery address");
      setIsFormOpen(true);
      return;
    }

    const selectedAddress = addresses.find(a => a.id === selectedAddressId);
    if (!selectedAddress) return;

    if (!selectedAddress.phone || selectedAddress.phone.length < 10) {
      alert("Valid phone number is required for delivery");
      return;
    }

    setLoading(true);
    if (paymentMethod === 'COD') {
      await completeOrder(selectedAddress);
    } else {
      await handlePayment(selectedAddress);
    }
  };

  return (
    <ProtectedRoute>
      <div className={`${styles.checkoutPage} mobile-checkout-compact`}>
        <Header />
      <main className={styles.container}>
        <div className={styles.headerRow}>
          <h1 className={styles.pageTitle}>Checkout</h1>
        </div>

        <div className={styles.checkoutLayout}>
          <div className={styles.leftColumn}>
            {/* Address Section */}
            <section className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>📍</span>
                <h3>Select Delivery Address</h3>
                {!isFormOpen && (
                  <button className={styles.addBtn} onClick={() => {
                    setIsFormOpen(true);
                    setEditingAddressId(null);
                    setFormData({ 
                      name: user?.name || '', 
                      phone: user?.phone || '', 
                      email: user?.email || '', 
                      address1: '', 
                      address2: '', 
                      city: location?.city || 'Rajahmundry', 
                      pincode: location?.pincode || '' 
                    });
                  }}>+ Add New</button>
                )}
              </div>

              {isFormOpen ? (
                <form className={styles.addressForm} onSubmit={handleSaveAddress}>
                  <div className={styles.formGrid}>
                    <div className={styles.formGroup}>
                      <label>Full Name *</label>
                      <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required placeholder="Enter full name" />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Phone Number *</label>
                      <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required placeholder="10-digit mobile" maxLength={10} />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Email (Optional)</label>
                      <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@example.com" />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Pincode *</label>
                      <input type="text" value={formData.pincode} onChange={e => setFormData({...formData, pincode: e.target.value})} required placeholder="6-digit pincode" maxLength={6} />
                    </div>
                  </div>
                  <div className={styles.formGroup}>
                    <label>House / Flat / Street *</label>
                    <input type="text" value={formData.address1} onChange={e => setFormData({...formData, address1: e.target.value})} required placeholder="House No, Apartment, Street name" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Area / Landmark (Optional)</label>
                    <input type="text" value={formData.address2} onChange={e => setFormData({...formData, address2: e.target.value})} placeholder="e.g., Near Apollo Hospital" />
                  </div>
                  <div className={styles.formGroup}>
                    <label>City</label>
                    <input type="text" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} placeholder="City name" />
                  </div>
                  <div className={styles.formActions}>
                    <button type="submit" className={styles.saveBtn}>{editingAddressId ? 'Update Address' : 'Deliver to this address'}</button>
                    {addresses.length > 0 && (
                      <button type="button" className={styles.cancelBtn} onClick={() => setIsFormOpen(false)}>Cancel</button>
                    )}
                  </div>
                </form>
              ) : (
                <div className={styles.addressList}>
                  {addresses.map(addr => (
                    <div 
                      key={addr.id} 
                      className={`${styles.addressCard} ${selectedAddressId === addr.id ? styles.addressSelected : ''}`}
                      onClick={() => setSelectedAddressId(addr.id)}
                    >
                      <div className={styles.addrHeader}>
                        <span className={styles.addrName}>{addr.name}</span>
                        <div className={styles.addrActions}>
                          <button onClick={(e) => handleEditAddress(addr, e)}>Edit</button>
                          <button onClick={(e) => handleDeleteAddress(addr.id, e)} className={styles.deleteText}>Delete</button>
                        </div>
                      </div>
                      <p className={styles.addrText}>{addr.address1}, {addr.address2 && `${addr.address2}, `}{addr.city} - {addr.pincode}</p>
                      <p className={styles.addrPhone}>Phone: {addr.phone}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Payment Section */}
            <section className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>💳</span>
                <h3>Payment Method</h3>
                <div className={styles.secureBadge}>
                  <span className={styles.shieldIcon}>🛡️</span>
                  100% Secure
                </div>
              </div>
              <div className={styles.paymentList}>
                <div 
                  className={`${styles.paymentCard} ${paymentMethod === 'COD' ? styles.paymentCardActive : ''}`}
                  onClick={() => setPaymentMethod('COD')}
                >
                  <div className={styles.paymentCardIcon}>
                    <img src={PAYMENT_ICONS.COD} alt="COD" />
                  </div>
                  <div className={styles.paymentCardContent}>
                    <span className={styles.paymentCardTitle}>Cash on Delivery</span>
                    <span className={styles.paymentCardSub}>Pay when you receive your order</span>
                  </div>
                  <div className={styles.paymentCardPrice}>₹{totalAmount}</div>
                </div>

                <div 
                  className={`${styles.paymentCard} ${paymentMethod === 'ONLINE' ? styles.paymentCardActive : ''}`}
                  onClick={() => setPaymentMethod('ONLINE')}
                >
                  <div className={styles.paymentCardIcon}>
                    <img src={PAYMENT_ICONS.ONLINE} alt="Online" />
                  </div>
                  <div className={styles.paymentCardContent}>
                    <span className={styles.paymentCardTitle}>Pay Online</span>
                    <span className={styles.paymentCardSub}>Supports UPI, Cards & Netbanking</span>
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className={styles.rightColumn}>
            <div className={styles.summaryCard}>
              <h3 className={styles.sumTitle}>Order Summary</h3>
              <div className={styles.itemsList}>
                {cartItems.map((item, idx) => (
                  <div key={idx} className={styles.orderItem}>
                    <div>
                      <div className={styles.itemName}>{item.product.name}</div>
                      <div className={styles.itemMeta}>{item.weight} x {item.quantity}</div>
                    </div>
                    <div className={styles.itemPrice}>₹{item.lockedPrice * item.quantity}</div>
                  </div>
                ))}
              </div>

              {/* Coupon Section */}
              <div className={styles.couponSection}>
                <div className={styles.couponTitle}>
                  <span>🎟️</span> Apply Coupon
                </div>
                {!appliedCoupon ? (
                  <>
                    <div className={styles.couponInputRow}>
                      <input 
                        type="text" 
                        className={styles.couponInput} 
                        placeholder="Enter Code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        disabled={isApplying}
                      />
                      <button 
                        className={styles.applyBtn}
                        onClick={handleApplyCoupon}
                        disabled={isApplying || !couponCode.trim()}
                      >
                        {isApplying ? '...' : 'APPLY'}
                      </button>
                    </div>
                    {couponError && <p className={styles.couponError}>{couponError}</p>}
                    
                    {suggestedCoupon && (
                      <div className={styles.couponSuggestion}>
                        <div className={styles.suggestionText}>
                          👉 <strong>{suggestedCoupon.code}</strong> available! Save <strong>₹{suggestedCoupon.savings}</strong> more.
                        </div>
                        <button 
                          className={styles.suggestApplyBtn}
                          onClick={() => handleApplySuggested(suggestedCoupon)}
                        >
                          APPLY NOW
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className={styles.couponSuccess}>
                    <div>
                      <div className={styles.successText}>
                        {appliedCoupon.autoApply && !manualCouponApplied ? '🎉 Best offer applied!' : `🎟️ Code ${appliedCoupon.code} active`}
                      </div>
                      <div className={styles.savingsHighlight}>
                        Saved ₹{couponDiscount}!
                      </div>
                    </div>
                    <button className={styles.removeCouponBtn} onClick={handleRemoveCoupon}>Remove</button>
                  </div>
                )}
              </div>

              <div className={styles.billDetails}>
                <h4>Bill Details</h4>
                <div className={styles.billRow}>
                  <span>Item Total</span>
                  <span>₹{itemsTotal}</span>
                </div>
                {comboDiscount > 0 && (
                  <div className={styles.billRow}>
                    <span>Combo Discount</span>
                    <span className={styles.discountText}>-₹{comboDiscount}</span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className={styles.billRow}>
                    <span>Coupon Discount</span>
                    <span className={styles.discountText}>-₹{couponDiscount}</span>
                  </div>
                )}
                <div className={styles.billRow}>
                  <span>Delivery Charges</span>
                  {deliveryCharge === 0 ? (
                    <span className={styles.freeText}>FREE</span>
                  ) : (
                    <span>₹{deliveryCharge}</span>
                  )}
                </div>
                {deliveryCharge > 0 && (
                  <div className={styles.shippingNote} style={{ fontSize: '10px', color: '#64748b', marginTop: '-4px', marginBottom: '8px', lineHeight: '1.2' }}>
                    Free delivery on orders above ₹{freeDeliveryThreshold}
                  </div>
                )}
                <div className={styles.grandTotal}>
                  <span>To Pay</span>
                  <span>₹{totalAmount}</span>
                </div>

                {/* Multi-Tier Free Gift Promo/Badge */}
                {isEnabled && (
                  <div className={`${styles.giftBox} ${isGiftEligible ? styles.giftEligible : ''}`}>
                    <div className={styles.giftIcon}>
                      <Gift size={20} />
                    </div>
                    <div className={styles.giftText}>
                      {isGiftEligible ? (
                        <>
                          <strong>{currentGift.giftName} UNLOCKED!</strong>
                          <span>{nextTier ? `Add ₹${amountNeededForGift} more to upgrade to ${nextTier.giftName}!` : `🎉 Max reward earned!`}</span>
                        </>
                      ) : (
                        <>
                          <strong>Free Gift: ₹{amountNeededForGift} away</strong>
                          <span>Unlock "{nextTier?.giftName}" for FREE!</span>
                        </>
                      )}
                    </div>
                    {nextTier && (
                      <button onClick={() => router.push('/')} className={styles.giftGoBtn}>
                        <ChevronRight size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>

              <button 
                className={styles.mainPlaceOrderBtn} 
                onClick={handlePlaceOrder}
                disabled={loading || !isMinimumOrderMet}
              >
                  {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span className={styles.spinner}></span> Processing...
                    </div>
                  ) : !isMinimumOrderMet ? `Order Min. ₹${minOrderValue} Required` : paymentMethod === 'COD' ? `Confirm Order: ₹${totalAmount}` : `Pay Now: ₹${totalAmount}`}
                </button>
              </div>
              
              <div className={styles.trustBanner}>
                <div className={styles.trustItem}>🚚 Location-based shipping</div>
                <div className={styles.trustItem}>🎯 Min. order: ₹{minOrderValue}</div>
                <div className={styles.trustItem}>⏱ ETA: {deliveryEta || "Standard"}</div>
              </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
    </ProtectedRoute>
  );
}
