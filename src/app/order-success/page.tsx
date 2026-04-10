"use client";
import React, { useEffect, useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import styles from './OrderSuccess.module.css';

import { generateOrderPDF } from '@/utils/pdfGenerator';
import { getOrderByIdAsync } from '@/services/productService';
import { useSearchParams } from 'next/navigation';

interface OrderItem {
  id: string | number;
  name: string;
  image?: string;
  weight?: string;
  price: number;
  quantity: number;
  product?: { id: string | number; name: string }; // Keep for backward compatibility if any
}

interface OrderData {
  orderId: string;
  date?: string;
  createdAt?: string;
  items: OrderItem[];
  total: number;
  pricing?: {
    itemTotal: number;
    deliveryCharge: number;
    packagingCharge: number;
    gst: number;
    discount?: number;
    totalAmount: number;
  };
  deliveryFee: number;
  paymentMethod: string;
  address: { pincode: string; address: string; name: string; mobile: string; landmark?: string; address1?: string; address2?: string; city?: string; phone?: string; email?: string };
  status?: string;
  hasFreeGift?: boolean;
  giftName?: string;
}

function OrderSuccessContent() {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [orderStatus, setOrderStatus] = useState<string>('Placed');
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('id');

  const handleDownloadInvoice = async () => {
    if (!order) return;
    try {
      const { blob, filename } = await generateOrderPDF(order, 'INVOICE');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Invoice download failed:", error);
      alert("Failed to generate invoice");
    }
  };

  useEffect(() => {
    setIsClient(true);
    window.scrollTo(0, 0);
    
    if (!orderId) {
      setLoading(false);
      const timer = setTimeout(() => router.push('/'), 3000);
      return () => clearTimeout(timer);
    }

    const fetchOrder = async () => {
      setLoading(true);
      try {
        const data = await getOrderByIdAsync(orderId) as any;
        if (data) {
          setOrder(data);
          if (data.status) setOrderStatus(data.status);
        }
      } catch (error) {
        console.error("Failed to fetch order success data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, router]);

  if (!isClient) return null;

  if (loading) {
    return (
      <div className="pb-mobile-nav">
        <Header />
        <main className="container section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '16px', color: '#64748b' }}>Confirming your order...</p>
        </main>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="pb-mobile-nav">
        <Header />
        <main className="container section" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 className="h2 text-bold" style={{ marginBottom: '16px' }}>Order Not Found</h2>
            <p className="text-secondary" style={{ marginBottom: '24px' }}>Redirecting you to the home page...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Address logic
  const addressLine = order.address.address1 || order.address.address;
  const isRajahmundry = 
    (order.address.city && order.address.city.toLowerCase().includes('rajahmundry')) ||
    (addressLine && addressLine.toLowerCase().includes('rajahmundry')) || 
    (order.address.pincode && /53310[1-6]/.test(order.address.pincode));
  
  const deliveryTime = isRajahmundry ? "60–90 minutes" : "24–48 hours";

  const handleSendWhatsapp = () => {
    const adminNumber = "919491559901";
    
    // Format Items list
    const itemsList = order.items.map(item => 
      `- ${item.quantity} x ${item.name || item.product?.name || 'Product'} (₹${Number(item.price) * Number(item.quantity)})`
    ).join('\n');

    // Format Full Address
    const fullAddress = [
      order.address.name,
      order.address.address1 || order.address.address,
      order.address.landmark ? `Landmark: ${order.address.landmark}` : null,
      order.address.city,
      order.address.pincode
    ].filter(Boolean).join(', ');

    // Generate Message
    const message = `*New Order Received!* 🚀\n` +
      `*Order ID:* ${order.orderId}\n` +
      `------------------\n` +
      `*Customer:* ${order.address.name}\n` +
      `*Phone:* ${order.address.phone || order.address.mobile}\n` +
      `*Address:* ${fullAddress}\n` +
      `------------------\n` +
      `*Items Ordered:*\n${itemsList}\n` +
      `------------------\n` +
      `*Payment Method:* ${order.paymentMethod.toUpperCase()}\n` +
      `*Total Amount:* ₹${order.pricing?.totalAmount || order.total}\n` +
      (order.hasFreeGift ? `*🎁 FREE GIFT:* ${order.giftName || 'Premium Pack'}\n` : '') +
      `------------------\n` +
      `Please confirm the order. Thank you!`;

    const url = `https://wa.me/${adminNumber}?text=${encodeURIComponent(message)}`;
    
    try {
      window.open(url, '_blank');
      alert("Opening WhatsApp for order confirmation...");
    } catch (err) {
      console.error("Failed to open WhatsApp", err);
      alert("Could not open WhatsApp automatically. Please contact us manually at +91 94915 59901");
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true
      });
    } catch {
      return "Just now";
    }
  };

  return (
    <div className="pb-mobile-nav">
      <Header />
      <main className={styles.container}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.successIcon}>
              <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h1 className={styles.title}>Order Placed Successfully 🎉</h1>
            <p className={styles.subtitle}>Thank you for your order. We are preparing it now.</p>
            
            {order.hasFreeGift && (
              <div className={styles.giftBadge}>
                <div className={styles.giftPulse}></div>
                <div className={styles.giftContent}>
                  <span className={styles.giftEmoji}>🎁</span>
                  <div className={styles.giftInfo}>
                    <div className={styles.giftLabel}>CONGRATULATIONS!</div>
                    <div className={styles.giftDetail}>You've unlocked a {order.giftName || 'Free Gift Pack'}!</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className={styles.section}>
            <div className={styles.detailsGrid}>
              <div>
                <div className={styles.detailItemLabel}>Order ID</div>
                <div className={styles.detailItemValue}>{order.orderId}</div>
              </div>
              <div>
                <div className={styles.detailItemLabel}>Date & Time</div>
                <div className={styles.detailItemValue}>{formatDate(order.createdAt || order.date || "")}</div>
              </div>
              <div>
                <div className={styles.detailItemLabel}>Payment Method</div>
                <div className={styles.detailItemValue} style={{ textTransform: 'uppercase' }}>
                  {order.paymentMethod}
                </div>
              </div>
              <div>
                <div className={styles.detailItemLabel}>To Pay</div>
                <div className={styles.detailItemValue}>₹{order.pricing?.totalAmount || order.total}</div>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Order Tracking</h2>
            <div className={styles.trackingContainer}>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill} 
                  style={{ 
                    width: orderStatus === 'Placed' ? '25%' : 
                           orderStatus === 'Preparing' ? '50%' : 
                           orderStatus === 'Out for Delivery' ? '75%' : '100%' 
                  }}
                ></div>
              </div>
              <div className={styles.statusNodes}>
                <div className={`${styles.statusNode} ${['Placed', 'Preparing', 'Out for Delivery', 'Delivered'].includes(orderStatus) ? styles.statusActive : ''}`}>
                  <div className={styles.nodeCircle}>✓</div>
                  <span>Placed</span>
                </div>
                <div className={`${styles.statusNode} ${['Preparing', 'Out for Delivery', 'Delivered'].includes(orderStatus) ? styles.statusActive : ''}`}>
                  <div className={styles.nodeCircle}>{['Preparing', 'Out for Delivery', 'Delivered'].includes(orderStatus) ? '✓' : ''}</div>
                  <span>Preparing</span>
                </div>
                <div className={`${styles.statusNode} ${['Out for Delivery', 'Delivered'].includes(orderStatus) ? styles.statusActive : ''}`}>
                  <div className={styles.nodeCircle}>{['Out for Delivery', 'Delivered'].includes(orderStatus) ? '✓' : ''}</div>
                  <span>Out for Delivery</span>
                </div>
                <div className={`${styles.statusNode} ${orderStatus === 'Delivered' ? styles.statusActive : ''}`}>
                  <div className={styles.nodeCircle}>{orderStatus === 'Delivered' ? '✓' : ''}</div>
                  <span style={{textAlign: 'right'}}>Delivered</span>
                </div>
              </div>
            </div>
            
            <div className={styles.deliveryCard} style={{ marginTop: '20px' }}>
              <div className={styles.deliveryIcon}>🚚</div>
              <div>
                <div className={styles.deliveryTitle}>Delivery {isRajahmundry ? "in" : "within"} {deliveryTime}</div>
                <div className={styles.deliverySub}>We will call you on {order.address.phone || order.address.mobile} before delivery</div>
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Bill Details</h2>
            <div className={styles.productsList}>
              {order.items.map((item, idx) => (
                <div key={idx} className={styles.productItem}>
                  <div className={styles.productNameWrapper}>
                    <span className={styles.productQty}>{item.quantity}x</span>
                    <span className={styles.productName}>{item.name || item.product?.name || 'Product'}</span>
                  </div>
                  <div className={styles.productPrice}>₹{Number(item.price) * Number(item.quantity)}</div>
                </div>
              ))}
            </div>
            
            <div className={styles.detailedBill}>
              {order.pricing ? (
                <>
                  <div className={styles.billRow}>
                    <span>Item Total</span>
                    <span>₹{order.pricing.itemTotal}</span>
                  </div>
                  <div className={styles.billRow}>
                    <span>Delivery Fee</span>
                    <span>{order.pricing.deliveryCharge === 0 ? 'FREE' : `₹${order.pricing.deliveryCharge}`}</span>
                  </div>
                  <div className={styles.billRow}>
                    <span>Packaging Charge</span>
                    <span>₹{order.pricing.packagingCharge}</span>
                  </div>
                  <div className={styles.billRow}>
                    <span>GST (5%)</span>
                    <span>₹{order.pricing.gst}</span>
                  </div>
                </>
              ) : (
                <div className={styles.billRow}>
                  <span>Item Total</span>
                  <span>₹{order.total - (order.deliveryFee || 0)}</span>
                </div>
              )}
            </div>

            <div className={styles.totalRow}>
              <span className={styles.totalLabel}>Total Amount Paid</span>
              <span className={styles.totalValue}>₹{order.pricing?.totalAmount || order.total}</span>
            </div>
          </div>

          <div className={styles.actions}>
            <div className={styles.whatsappWrapper}>
              <button className={styles.btnWhatsapp} onClick={handleSendWhatsapp}>
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                Send Order via WhatsApp
              </button>
              <p className={styles.whatsappSubtitle}>Highly Recommended for Instant Confirmation</p>
            </div>

            <button className={styles.btnPrimary} onClick={() => router.push(`/track-order/${(order as any).id}`)}>
              Track Live Status
            </button>
            <button className={styles.btnSecondary} onClick={handleDownloadInvoice} style={{ border: '2px solid #3472ba', color: '#3472ba', background: '#f0f7fd' }}>
              Download Digital Invoice 📄
            </button>
            <button className={styles.btnSecondary} onClick={() => router.push('/')}>
              Continue Shopping
            </button>
          </div>

          <div className={styles.trustElements}>
            <div className={styles.trustItem}>
              <div className={styles.trustIcon}>🌿</div>
              <div className={styles.trustText}>100% Fresh &<br/>Homemade</div>
            </div>
            <div className={styles.trustItem}>
              <div className={styles.trustIcon}>📦</div>
              <div className={styles.trustText}>Safe & Hygienic<br/>Packaging</div>
            </div>
            <div className={styles.trustItem}>
              <div className={styles.trustIcon}>⚡</div>
              <div className={styles.trustText}>Fast<br/>Delivery</div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="pb-mobile-nav">
        <Header />
        <main className="container section" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div className="spinner"></div>
          <p style={{ marginTop: '16px', color: '#64748b' }}>Confirming your order...</p>
        </main>
        <Footer />
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}
