'use client';
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { subscribeToOrder } from '@/services/productService';
import { useParams, useRouter } from 'next/navigation';
import { Circle, Package, Truck, Clock, CheckCircle, MapPin, AlertCircle } from 'lucide-react';
import styles from '../TrackOrder.module.css';

const STATUS_STEPS = ['Placed', 'Confirmed', 'Preparation', 'Dispatched', 'Out for Delivery', 'Delivered'];

const STATUS_MESSAGES: Record<string, string> = {
  'Placed': "Your order has been placed successfully",
  'Confirmed': "Your order is confirmed",
  'Preparation': "Your order is being prepared with love ❤️",
  'Dispatched': "Your order has been dispatched",
  'Out for Delivery': "Your order is out for delivery 🚚",
  'Delivered': "Order delivered successfully 🎉",
  'Cancelled': "This order has been cancelled"
};

export default function OrderTrackingDetails() {
  const { id } = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    // Real-time tracking with onSnapshot
    const unsubscribe = subscribeToOrder(id as string, (data) => {
      setOrder(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [id]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto' }}></div>
          <p style={{ marginTop: '16px', color: '#64748b', fontWeight: 500 }}>Locating your order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <>
        <Header />
        <div className={styles.container} style={{ textAlign: 'center', padding: '100px 20px' }}>
          <div style={{ background: '#fff', padding: '48px', borderRadius: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', maxWidth: '500px', margin: '0 auto' }}>
            <AlertCircle size={64} color="#ef4444" style={{ margin: '0 auto 24px' }} />
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', marginBottom: '12px' }}>Order Not Found</h1>
            <p style={{ color: '#64748b', marginBottom: '32px' }}>We couldn't find an order with ID: <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{id}</code></p>
            <button 
              className="btn-primary" 
              style={{ width: '100%' }} 
              onClick={() => router.push('/track-order')}
            >
              Try Another ID
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const currentStatusIndex = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'Cancelled';

  return (
    <div className="pb-mobile-nav">
      <Header />
      <main className={styles.container}>
        {/* Mobile Header with Back Button */}
        <div className="mobile-only" style={{ padding: '16px 16px 0' }}>
          <button 
            onClick={() => router.back()} 
            style={{ 
              background: '#fff', 
              border: '1px solid #e1e8ed', 
              borderRadius: '50%', 
              width: '40px', 
              height: '40px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
              cursor: 'pointer'
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2c3e50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
        </div>

        <div className={styles.card} style={{ maxWidth: '800px', margin: '20px auto' }}>
          {/* Header Section */}
          <div className={styles.header} style={{ paddingBottom: '24px', borderBottom: '1px solid #f1f5f9' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '13px', marginBottom: '8px' }}>
                  <Package size={14} /> Order Tracking
                </div>
                <h1 className={styles.title} style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#1e293b' }}>Order #{order.orderId}</h1>
                <p className={styles.subtitle} style={{ fontSize: '14px', color: '#64748b', margin: '6px 0 0' }}>
                  Placed on {new Date(order.createdAt?.toDate ? order.createdAt.toDate() : order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className={`badge ${
                order.status === 'Delivered' ? 'badge-success' : 
                order.status === 'Cancelled' ? 'badge-error' : 'badge-info'
              }`} style={{ fontSize: '13px', fontWeight: 700, padding: '6px 14px', borderRadius: '10px' }}>
                {order.status}
              </div>
            </div>
          </div>

          {/* Progress / Status Message Section */}
          <div style={{ padding: '32px 0' }}>
            {isCancelled ? (
              <div style={{ padding: '24px', background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: '16px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ background: '#fee2e2', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertCircle color="#ef4444" size={24} />
                </div>
                <div>
                  <h3 style={{ color: '#991b1b', fontWeight: 700, fontSize: '18px', margin: 0 }}>Order Cancelled</h3>
                  <p style={{ color: '#b91c1c', margin: '4px 0 0', fontSize: '14px', lineHeight: 1.5 }}>{STATUS_MESSAGES.Cancelled}. If the amount was deducted, a refund will be initiated automatically.</p>
                </div>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                  <div style={{ color: 'var(--brand-primary)', fontWeight: 700, fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                    <div style={{ width: '10px', height: '10px', background: 'var(--brand-primary)', borderRadius: '50%', animation: 'pulse 1.5s infinite' }}></div>
                    {STATUS_MESSAGES[order.status]}
                  </div>
                </div>

                {/* Progress Bar UI */}
                <div className="tracking-stepper">
                  {STATUS_STEPS.map((step, index) => {
                    const isCompleted = index < currentStatusIndex || order.status === 'Delivered';
                    const isActive = index === currentStatusIndex;
                    
                    return (
                      <div key={step} className={`step-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                        <div className="step-point">
                          {isCompleted ? <CheckCircle size={20} /> : isActive ? <div className="active-dot"></div> : <div className="pending-dot"></div>}
                        </div>
                        <div className="step-label">{step}</div>
                        {index < STATUS_STEPS.length - 1 && <div className="step-line"></div>}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {/* Items Summary */}
            <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '16px', padding: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={18} /> Items Summary
              </h2>
              <div className={styles.itemsList}>
                {order.items.map((item: any, idx: number) => (
                  <div key={idx} className={styles.itemRow} style={{ padding: '12px 0', borderBottom: idx === order.items.length - 1 ? 'none' : '1px solid #f8fafc' }}>
                    <img src={item.image} alt="" style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', background: '#f8fafc' }} />
                    <div className={styles.itemDetails} style={{ flex: 1, marginLeft: '12px' }}>
                      <span style={{ fontWeight: 600, fontSize: '14px', color: '#1e293b', display: 'block' }}>{item.name}</span>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{item.weight} x {item.quantity}</span>
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '14px', color: '#1e293b' }}>₹{Number(item.price) * (item.quantity || 1)}</span>
                  </div>
                ))}
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '2px dashed #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>Total Amount</span>
                    <span style={{ color: 'var(--brand-primary)', fontSize: '20px', fontWeight: 800 }}>₹{order.total}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Details */}
            <div style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: '16px', padding: '24px' }}>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#1e293b', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={18} /> Delivery Address
              </h2>
              <div style={{ color: '#475569', lineHeight: 1.6, fontSize: '14px' }}>
                <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '4px', fontSize: '15px' }}>{order.address.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <Truck size={14} /> {order.address.phone}
                </div>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
                  <div>{order.address.address1}</div>
                  {order.address.address2 && <div>{order.address.address2}</div>}
                  <div style={{ fontWeight: 600 }}>{order.address.city} - {order.address.pincode}</div>
                </div>
                <div style={{ marginTop: '16px', padding: '12px', background: '#eff6ff', borderRadius: '10px', color: '#1d4ed8', fontSize: '12px', fontWeight: 500 }}>
                  Payment Method: {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Paid Online'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style jsx>{`
        .tracking-stepper {
          display: flex;
          justify-content: space-between;
          position: relative;
          margin: 40px 0;
          padding: 0 10px;
        }
        .step-item {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 1;
        }
        .step-point {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #fff;
          border: 2px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          margin-bottom: 12px;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .active-dot {
          width: 12px;
          height: 12px;
          background: #3b82f6;
          border-radius: 50%;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
        }
        .pending-dot {
          width: 8px;
          height: 8px;
          background: #e2e8f0;
          border-radius: 50%;
        }
        .step-line {
          position: absolute;
          top: 22px;
          left: 50%;
          width: 100%;
          height: 3px;
          background: #f1f5f9;
          z-index: -1;
          transition: background 0.4s ease;
        }
        .step-item.completed .step-point {
          background: #10b981;
          border-color: #10b981;
          color: #fff;
          box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);
        }
        .step-item.completed .step-line {
          background: #10b981;
        }
        .step-item.active .step-point {
          border-color: #3b82f6;
          color: #3b82f6;
          transform: scale(1.15);
          box-shadow: 0 8px 15px rgba(59, 130, 246, 0.15);
          background: #fff;
        }
        .step-label {
          font-size: 12px;
          font-weight: 600;
          color: #94a3b8;
          text-align: center;
          transition: color 0.3s;
        }
        .step-item.active .step-label {
          color: #3b82f6;
        }
        .step-item.completed .step-label {
          color: #1e293b;
        }
        
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }

        @media (max-width: 640px) {
          .tracking-stepper {
            flex-direction: column;
            gap: 32px;
            align-items: flex-start;
            padding-left: 20px;
          }
          .step-item {
            flex-direction: row;
            width: 100%;
            gap: 20px;
            align-items: center;
          }
          .step-line {
            width: 3px;
            height: calc(100% + 32px);
            top: 22px;
            left: 22px;
          }
          .step-label {
            text-align: left;
            font-size: 14px;
          }
          .step-point {
            margin-bottom: 0;
            width: 40px;
            height: 40px;
          }
        }
      `}</style>
      <Footer />
    </div>
  );
}

// Mock lucide icons for safety in build if not imported correctly
const ShoppingBag = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
);
