"use client";
import React, { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import styles from './MyOrders.module.css';
import Link from 'next/link';
import { generateOrderPDF } from '@/utils/pdfGenerator';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getOrdersByUserAsync } from '@/services/productService';

interface OrderItem {
  product?: { id: string | number; name: string; price: number }; // Legacy support
  name?: string; // New structure
  price?: number; // New structure
  weight?: string;
  quantity: number;
}

interface OrderData {
  id?: string;
  orderId: string;
  date?: string; // Legacy
  createdAt?: string; // New
  items: OrderItem[];
  total: number;
  deliveryFee: number;
  paymentMethod: string;
  address: { pincode: string; address: string; name: string; mobile: string; landmark?: string; address1?: string; address2?: string; city?: string; phone?: string; email?: string };
  pricing?: any;
  status: string;
}

export default function MyOrdersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<string[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [loading, setLoading] = useState(true);

  const handleDownload = async (order: any, type: 'INVOICE' | 'BILL') => {
    try {
      const { blob, filename } = await generateOrderPDF(order, type);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to generate PDF");
    }
  };

  useEffect(() => {
    setIsClient(true);
    if (!user) return;

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const data = await getOrdersByUserAsync(user.uid);
        // Normalize the data for the UI
        const normalized = data.map(order => ({
          ...order,
          // Ensure dates are parsed correctly from Firestore Timestamps
          createdAt: order.createdAt?.toDate ? order.createdAt.toDate().toISOString() : order.createdAt
        }));
        setOrders(normalized);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user]);

  const toggleExpand = (orderId: string) => {
    setExpandedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId) 
        : [...prev, orderId]
    );
  };

  if (!isClient) return null;

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true
      });
    } catch {
      return isoString;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Delivered': return '#10b981';
      case 'Cancelled': return '#ef4444';
      case 'Out for Delivery': return '#14b8a6';
      case 'Dispatched': return '#a855f7';
      case 'Preparation': return '#b45309';
      case 'Confirmed': return '#3b82f6';
      case 'Placed': return '#f97316';
      default: return '#64748b';
    }
  };

  return (
    <ProtectedRoute>
      <div className="pb-mobile-nav">
        <Header />
      <main className={`container main-content ${styles.page}`}>
        <h1 className={styles.pageTitle}>My Orders</h1>
        
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 0' }}>
            <div className="spinner"></div>
            <p style={{ marginTop: '20px', color: '#64748b', fontWeight: 600 }}>Fetching your order history...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🛍️</div>
            <h2 className={styles.emptyTitle}>Your basket is empty</h2>
            <p className={styles.emptySubtitle}>It seems you haven't placed any orders yet. Explore our authentic homemade specials!</p>
            <Link href="/" className="btn-shop">Start Shopping</Link>
          </div>
        ) : (
          <div className={styles.ordersList}>
            {orders.map((order) => (
              <div key={order.orderId} className={styles.orderCard}>
                <div className={styles.cardHeader}>
                  <div className={styles.headerMain}>
                    <div className={styles.orderId}>Order #{order.orderId}</div>
                    <div className={styles.orderDate}>
                      <span style={{ verticalAlign: 'middle', marginRight: '4px' }}>📅</span>
                      {formatDate(order.createdAt || order.date || "")}
                    </div>
                  </div>
                  <div className={styles.statusBadge} style={{ backgroundColor: `${getStatusColor(order.status)}15`, color: getStatusColor(order.status) }}>
                    <span style={{ fontSize: '10px', marginRight: '4px' }}>●</span>
                    {order.status}
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.summaryItem}>
                    <span className={styles.label}>Total Amount</span>
                    <span className={styles.value}>₹{order.total}</span>
                  </div>
                  <div className={styles.summaryItem}>
                    <span className={styles.label}>Items</span>
                    <span className={styles.value}>{order.items.length} {order.items.length === 1 ? 'Product' : 'Products'}</span>
                  </div>
                </div>

                <div className={styles.cardActions}>
                  <button className={styles.btnDetails} onClick={() => toggleExpand(order.orderId)}>
                    {expandedOrders.includes(order.orderId) ? 'Hide Details' : 'View Details'}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ transform: expandedOrders.includes(order.orderId) ? 'rotate(180deg)' : 'none', transition: '0.3s' }}>
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </button>
                  
                  <div className={styles.actionGroup}>
                    <button 
                      className={styles.btnDetails}
                      onClick={() => handleDownload(order, 'INVOICE')}
                      style={{ border: '1px solid #bae6fd', color: '#0369a1' }}
                    >
                      Invoice 📄
                    </button>
                    {order.status === 'Delivered' && (
                      <button 
                        className={styles.btnDetails}
                        onClick={() => handleDownload(order, 'BILL')}
                        style={{ border: '1px solid #dcfce7', color: '#15803d' }}
                      >
                        Bill ✅
                      </button>
                    )}
                    {order.status !== 'Delivered' && order.status !== 'Cancelled' && (
                      <button className={styles.btnTrack} onClick={() => router.push(`/track-order/${order.id || order.orderId}`)}>
                        Track
                      </button>
                    )}
                  </div>
                </div>

                {expandedOrders.includes(order.orderId) && (
                  <div className={styles.detailsSection}>
                    <div className={styles.itemsList}>
                      {order.items.map((item, idx) => (
                        <div key={idx} className={styles.itemRow}>
                          <span className={styles.itemQty}>{item.quantity}</span>
                          <span className={styles.itemName}>{item.name || item.product?.name}</span>
                          <span className={styles.itemPrice}>₹{(item.price || item.product?.price || 0) * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <div className={styles.deliveryInfo}>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Address</span>
                        <span className={styles.infoValue}>{order.address.address}, {order.address.pincode}</span>
                      </div>
                      <div className={styles.infoRow}>
                        <span className={styles.infoLabel}>Payment</span>
                        <span className={styles.infoValue}>{order.paymentMethod}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
    </ProtectedRoute>
  );
}
