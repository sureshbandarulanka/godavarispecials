'use client';

import React, { useState } from 'react';
import styles from './TrackOrder.module.css';
import { findOrderAsync } from '@/services/productService';
import { getTrackingUrl } from '@/utils/shippingEngine';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Search, Package, Truck, CheckCircle, Clock, ExternalLink, MapPin, AlertCircle } from 'lucide-react';

export default function TrackOrderPage() {
  const [orderInput, setOrderInput] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderInput.trim()) return;

    setLoading(true);
    setError(null);
    setOrder(null);

    try {
      // Search for GS-XXXX format
      const foundOrder = await findOrderAsync(orderInput.trim().toUpperCase());
      if (foundOrder) {
        setOrder(foundOrder);
      } else {
        setError("Order not found. Please check your Order ID (e.g. GS-1234)");
      }
    } catch (err) {
      setError("Failed to fetch tracking info. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusStep = (status: string) => {
    const steps = ['Placed', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered'];
    return steps.indexOf(status);
  };

  const currentStep = order ? getStatusStep(order.status) : -1;

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className={styles.container}>
      <Header />

      <main className={styles.main}>
        {/* ---- DESKTOP LAYOUT (unchanged) ---- */}
        <div className="desktop-only">
          <div className={styles.searchSection}>
            <h1>Track Your Order</h1>
            <p>Enter your Order ID sent via WhatsApp/SMS to track your delivery status.</p>
            <form className={styles.searchBox} onSubmit={handleTrack}>
              <Search className={styles.searchIcon} size={20} />
              <input
                type="text"
                placeholder="e.g. GS-1234"
                value={orderInput}
                onChange={(e) => setOrderInput(e.target.value)}
                className={styles.searchInput}
              />
              <button type="submit" className={styles.trackBtn} disabled={loading}>
                {loading ? "Searching..." : "Track Now"}
              </button>
            </form>
          </div>

          {error && (
            <div className={styles.errorCard}>
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          {order && (
            <div className={styles.orderCard}>
              <div className={styles.orderHeader}>
                <div className={styles.orderIdInfo}>
                  <span className={styles.label}>Order ID</span>
                  <span className={styles.value}>{order.orderId}</span>
                </div>
                <div className={styles.orderDateInfo}>
                  <span className={styles.label}>Placed On</span>
                  <span className={styles.value}>{formatDate(order.createdAt)}</span>
                </div>
                <div className={styles.orderStatusBadge}>{order.status}</div>
              </div>
              <div className={styles.stepper}>
                {['Placed', 'Confirmed', 'Shipped', 'Delivered'].map((step, idx) => {
                  const stepIdx = ['Placed', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered'].indexOf(step);
                  const isCompleted = currentStep >= stepIdx;
                  const isCurrent = order.status === step;
                  return (
                    <div key={step} className={`${styles.step} ${isCompleted ? styles.completed : ''} ${isCurrent ? styles.active : ''}`}>
                      <div className={styles.stepIconWrapper}>
                        {step === 'Placed' && <Clock size={18} />}
                        {step === 'Confirmed' && <CheckCircle size={18} />}
                        {step === 'Shipped' && <Truck size={18} />}
                        {step === 'Delivered' && <Package size={18} />}
                      </div>
                      <span className={styles.stepLabel}>{step}</span>
                      {idx < 3 && <div className={styles.stepLine} />}
                    </div>
                  );
                })}
              </div>
              <div className={styles.detailsGrid}>
                <div className={styles.shippingInfo}>
                  <h3><MapPin size={18} /> Delivery Address</h3>
                  <p><strong>{order.address.name}</strong></p>
                  <p>{order.address.address1}</p>
                  <p>{order.address.city} - {order.address.pincode}</p>
                </div>
                {order.status !== 'Placed' && order.status !== 'Confirmed' && order.trackingId && (
                  <div className={styles.trackingInfo}>
                    <h3><Truck size={18} /> Shipping Updates</h3>
                    <div className={styles.courierBox}>
                      <div className={styles.courierLogo}><Truck size={24} /></div>
                      <div className={styles.courierDetails}>
                        <span className={styles.courierName}>{order.courierName || "Standard Shipping"}</span>
                        <span className={styles.trackingId}>AWB: {order.trackingId}</span>
                      </div>
                      {getTrackingUrl(order.courierName, order.trackingId) && (
                        <a href={getTrackingUrl(order.courierName, order.trackingId)!} target="_blank" rel="noopener noreferrer" className={styles.extLinkBtn}>
                          Track Externally <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ---- MOBILE LAYOUT — compact professional ---- */}
        <div className="track-order-mobile-wrap" style={{ display: 'none' }} id="mobile-track-section">
          <p className="track-order-mobile-title">Track Order</p>
          <p className="track-order-mobile-sub">Enter your Order ID sent via WhatsApp / SMS.</p>

          <form className="track-search-row" onSubmit={handleTrack}>
            <input
              type="text"
              placeholder="e.g. GS-1234"
              value={orderInput}
              onChange={(e) => setOrderInput(e.target.value)}
            />
            <button type="submit" disabled={loading}>
              {loading ? '...' : 'Track'}
            </button>
          </form>

          {error && (
            <div className={styles.errorCard} style={{ fontSize: '12px', padding: '10px 12px', gap: '8px' }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {order && (
            <div className="track-info-card">
              {/* Single-line Order ID row */}
              <div className="track-order-id-row">
                <span className="track-order-id-label">Order ID</span>
                <span className="track-order-id-value">{order.orderId}</span>
                <span className="track-status-badge">{order.status}</span>
              </div>

              {/* Compact Stepper */}
              <div className="track-stepper-compact">
                {['Placed', 'Confirmed', 'Shipped', 'Delivered'].map((step, idx) => {
                  const stepIdx = ['Placed', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered'].indexOf(step);
                  const isCompleted = currentStep >= stepIdx;
                  const isCurrent = order.status === step;
                  return (
                    <div key={step} className="track-step-node">
                      <div className={`track-step-circle ${isCompleted ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                        {step === 'Placed' && <Clock size={13} />}
                        {step === 'Confirmed' && <CheckCircle size={13} />}
                        {step === 'Shipped' && <Truck size={13} />}
                        {step === 'Delivered' && <Package size={13} />}
                      </div>
                      <span className={`track-step-label ${isCompleted ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>{step}</span>
                      {idx < 3 && <div className={`track-step-connector ${isCompleted ? 'done' : ''}`} />}
                    </div>
                  );
                })}
              </div>

              {/* Address row */}
              <div className="track-detail-row">
                <div className="track-detail-icon"><MapPin size={14} /></div>
                <div className="track-detail-text">
                  <div className="track-detail-title">Delivery Address</div>
                  <div className="track-detail-value">
                    {order.address.name} · {order.address.address1}, {order.address.city} — {order.address.pincode}
                  </div>
                </div>
              </div>

              {/* Placed date row */}
              <div className="track-detail-row">
                <div className="track-detail-icon"><Clock size={14} /></div>
                <div className="track-detail-text">
                  <div className="track-detail-title">Placed On</div>
                  <div className="track-detail-value">{formatDate(order.createdAt)}</div>
                </div>
              </div>

              {/* Courier row (only when shipped) */}
              {order.trackingId && (
                <div className="track-detail-row">
                  <div className="track-detail-icon"><Truck size={14} /></div>
                  <div className="track-detail-text">
                    <div className="track-detail-title">Courier · AWB</div>
                    <div className="track-detail-value">
                      {order.courierName || 'Standard'} &nbsp;·&nbsp; {order.trackingId}
                      {getTrackingUrl(order.courierName, order.trackingId) && (
                        <a
                          href={getTrackingUrl(order.courierName, order.trackingId)!}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ marginLeft: 8, color: '#3472ba', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}
                        >
                          Track ↗
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* JS-free show/hide: mobile section visibility toggled via CSS */}
        <style>{`
          @media (max-width: 767px) {
            .desktop-only { display: none !important; }
            #mobile-track-section { display: block !important; }
          }
        `}</style>
      </main>

      <Footer />
    </div>
  );
}
