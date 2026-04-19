'use client';

import React, { useEffect, useState } from 'react';
import { getOrdersAsync, updateOrderStatusAsync, deleteOrderAsync, restoreOrderAsync, emptyBinAsync } from '@/services/productService';
import { Trash2, RotateCcw, Archive } from 'lucide-react';
import { generateOrderPDF } from '@/utils/pdfGenerator';

interface Order {
  id: string;
  orderId: string;
  customerName: string;
  status: string;
  paymentStatus?: string;
  deliveredAt?: any;
  total: number;
  createdAt: any;
  items: any[];
  address: any;
  pricing: any;
  paymentMethod: string;
  upiApp?: string | null;
  statusHistory?: { status: string; time: string }[];
  courierName?: string;
  trackingId?: string;
  isDeleted?: boolean;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [courierName, setCourierName] = useState("");
  const [trackingId, setTrackingId] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'deleted'>('active');

  const handleDownload = async (type: 'INVOICE' | 'BILL') => {
    if (!selectedOrder) return;
    try {
      const { blob, filename } = await generateOrderPDF(selectedOrder, type);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("PDF Download failed:", error);
      alert("Failed to generate PDF");
    }
  };

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await getOrdersAsync();
      setOrders(data as Order[]);
    } catch (error) {
      console.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    if (newStatus === selectedOrder?.status) return;

    setUpdatingStatus(true);
    try {
      const trackingData = newStatus === 'Dispatched' ? { courierName, trackingId } : undefined;
      await updateOrderStatusAsync(orderId, newStatus, trackingData);
      
      // TRIGGER FINAL BILL EMAIL on Delivery
      if (newStatus === 'Delivered') {
        fetch('/api/send-bill', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        }).catch(err => console.error("Failed to send delivery email:", err));
      }

      setToast(`Order updated to ${newStatus}`);
      
      // Update local state for immediate feedback
      if (selectedOrder && selectedOrder.id === orderId) {
        const updatedHistory = [...(selectedOrder.statusHistory || []), { status: newStatus, time: new Date().toISOString() }];
        setSelectedOrder({ 
          ...selectedOrder, 
          status: newStatus, 
          statusHistory: updatedHistory,
          courierName: trackingData?.courierName || selectedOrder.courierName,
          trackingId: trackingData?.trackingId || selectedOrder.trackingId
        });
      }
      
      await loadOrders();
      setCourierName("");
      setTrackingId("");
      setTimeout(() => setToast(null), 3000);
    } catch (error: any) {
      alert(error.message || "Failed to update status");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to delete this order? It will be moved to the Recycle Bin.")) return;
    try {
      await deleteOrderAsync(orderId);
      setToast("Order moved to Recycle Bin");
      setSelectedOrder(null);
      await loadOrders();
    } catch (err) {
      alert("Failed to delete order");
    }
  };

  const handleRestoreOrder = async (orderId: string) => {
    try {
      await restoreOrderAsync(orderId);
      setToast("Order restored successfully");
      await loadOrders();
    } catch (err) {
      alert("Failed to restore order");
    }
  };

  const handleEmptyBin = async () => {
    if (!window.confirm("Are you sure you want to PERMANENTLY delete all orders in the Recycle Bin? This action cannot be undone.")) return;
    try {
      await emptyBinAsync("orders");
      setToast("Recycle Bin emptied");
      await loadOrders();
    } catch (err) {
      alert("Failed to empty bin");
    }
  };

  const filteredOrders = orders.filter(o => activeTab === 'active' ? !o.isDeleted : o.isDeleted);

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'Placed': return 'badge-placed';
      case 'Confirmed': return 'badge-confirmed';
      case 'Preparation': return 'badge-preparation';
      case 'Dispatched': return 'badge-dispatched';
      case 'Out for Delivery': return 'badge-out';
      case 'Delivered': return 'badge-delivered';
      case 'Cancelled': return 'badge-error';
      default: return 'badge-info';
    }
  };

  const getAllowedStatuses = (currentStatus: string) => {
    const transitions: Record<string, string[]> = {
      'Placed': ['Confirmed', 'Cancelled'],
      'Confirmed': ['Preparation', 'Cancelled'],
      'Preparation': ['Dispatched', 'Cancelled'],
      'Dispatched': ['Out for Delivery', 'Delivered', 'Cancelled'],
      'Out for Delivery': ['Delivered', 'Cancelled'],
      'Delivered': [],
      'Cancelled': []
    };
    return transitions[currentStatus] || [];
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="admin-page">
      <div className="admin-card">
        <div className="admin-card-header" style={{ borderBottom: 'none' }}>
          <div style={{ display: 'flex', gap: '16px' }}>
            <button 
              className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
              onClick={() => setActiveTab('active')}
            >
              All Orders ({orders.filter(o => !o.isDeleted).length})
            </button>
            <button 
              className={`tab-btn ${activeTab === 'deleted' ? 'active' : ''}`}
              onClick={() => setActiveTab('deleted')}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Archive size={16} /> Recycle Bin ({orders.filter(o => o.isDeleted).length})
            </button>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {activeTab === 'deleted' && orders.some(o => o.isDeleted) && (
              <button 
                className="btn-secondary" 
                onClick={handleEmptyBin}
                style={{ background: '#fee2e2', color: '#ef4444', borderColor: '#fecaca' }}
              >
                Empty Bin
              </button>
            )}
            <button className="btn-secondary" onClick={loadOrders} disabled={loading}>
              Refresh
            </button>
          </div>
        </div>

        <div className="admin-table-container">
          {loading ? (
            <div className="admin-empty">
              <div className="spinner" style={{ margin: '0 auto' }}></div>
              <p style={{ marginTop: '16px', color: '#64748b' }}>Fetching orders...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="admin-empty">
              <div className="admin-empty-icon">📦</div>
              <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b' }}>No orders yet</h3>
              <p style={{ color: '#64748b' }}>When customers place orders, they will appear here.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} style={{ opacity: order.isDeleted ? 0.7 : 1 }}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#3b82f6' }}>{order.orderId}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>ID: {order.id.slice(0, 8)}...</div>
                    </td>
                    <td>{formatDate(order.createdAt)}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{order.address?.name}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>{order.address?.phone}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>₹{order.total}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-icon" 
                        title="View Details"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      </button>
                      {order.isDeleted && (
                        <button 
                          className="btn-icon" 
                          title="Restore Order"
                          onClick={(e) => { e.stopPropagation(); handleRestoreOrder(order.id); }}
                          style={{ color: '#10b981', marginLeft: '8px' }}
                        >
                          <RotateCcw size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px', padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <div>
                <h2 className="modal-title" style={{ margin: 0 }}>Order {selectedOrder.orderId}</h2>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Placed on {formatDate(selectedOrder.createdAt)}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button 
                  onClick={() => handleDownload('INVOICE')}
                  className="btn-secondary"
                  style={{ fontSize: '11px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  Invoice
                </button>
                {selectedOrder.status === 'Delivered' && (
                  <button 
                    onClick={() => handleDownload('BILL')}
                    style={{ 
                      fontSize: '11px', 
                      padding: '6px 10px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                    Bill
                  </button>
                )}
                {!selectedOrder.isDeleted && (
                  <button 
                    onClick={() => handleDeleteOrder(selectedOrder.id)}
                    style={{ 
                      background: '#fee2e2',
                      color: '#ef4444',
                      border: '1px solid #fecaca',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 600
                    }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                )}
                {selectedOrder.isDeleted && (
                  <button 
                    onClick={() => handleRestoreOrder(selectedOrder.id)}
                    style={{ 
                      background: '#dcfce7',
                      color: '#15803d',
                      border: '1px solid #bbf7d0',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px',
                      fontWeight: 600
                    }}
                  >
                    <RotateCcw size={14} /> Restore
                  </button>
                )}
                <button 
                  onClick={() => setSelectedOrder(null)}
                  style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}
                >
                  &times;
                </button>
              </div>
            </div>

            <div style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
              <div style={{ marginBottom: '24px', padding: '16px', background: '#eff6ff', borderRadius: '12px', border: '1px solid #dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#3b82f6', textTransform: 'uppercase', marginBottom: '4px' }}>Current Status</div>
                  <span className={`badge ${getStatusBadgeClass(selectedOrder.status)}`} style={{ fontSize: '14px', padding: '6px 12px' }}>
                    {selectedOrder.status}
                  </span>
                  {selectedOrder.trackingId && (
                    <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
                      <strong>{selectedOrder.courierName}:</strong> {selectedOrder.trackingId}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'flex-end', flex: 1 }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', width: '100%', justifyContent: 'flex-end' }}>
                    <label style={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}>Update Status:</label>
                    <select 
                      className="form-select" 
                      style={{ fontSize: '13px', padding: '6px 10px', minWidth: '150px' }}
                      value={selectedOrder.status}
                      onChange={(e) => handleStatusUpdate(selectedOrder.id, e.target.value)}
                      disabled={updatingStatus || getAllowedStatuses(selectedOrder.status).length === 0}
                    >
                      <option value={selectedOrder.status} disabled>{selectedOrder.status}</option>
                      {getAllowedStatuses(selectedOrder.status).map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  {getAllowedStatuses(selectedOrder.status).includes('Dispatched') && (
                    <div style={{ 
                      width: '100%', 
                      maxWidth: '300px', 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '8px',
                      padding: '12px',
                      background: 'white',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>Enter Shipment Details:</div>
                      <input 
                        type="text" 
                        placeholder="Courier Name (e.g. Delhivery)"
                        className="form-input"
                        style={{ fontSize: '12px', padding: '6px' }}
                        value={courierName}
                        onChange={(e) => setCourierName(e.target.value)}
                      />
                      <input 
                        type="text" 
                        placeholder="Tracking ID / AWB"
                        className="form-input"
                        style={{ fontSize: '12px', padding: '6px' }}
                        value={trackingId}
                        onChange={(e) => setTrackingId(e.target.value)}
                      />
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>Tracking ID must be min 8 chars.</div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '32px' }}>
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                    Customer & Shipping
                  </h4>
                  <div style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6 }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{selectedOrder.address?.name}</div>
                    <div>{selectedOrder.address?.phone}</div>
                    <div style={{ marginTop: '8px', fontSize: '13px' }}>
                      {selectedOrder.address?.address1}<br />
                      {selectedOrder.address?.address2 && <>{selectedOrder.address.address2}<br /></>}
                      {selectedOrder.address?.city} - {selectedOrder.address?.pincode}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
                    Payment Details
                  </h4>
                  <div style={{ fontSize: '14px', color: '#475569' }}>
                    <div style={{ marginBottom: '4px' }}><strong>Method:</strong> {selectedOrder.paymentMethod}</div>
                    {selectedOrder.upiApp && <div><strong>App:</strong> {selectedOrder.upiApp}</div>}
                  </div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 600, color: '#1e293b', marginBottom: '12px' }}>Order Items</h4>
                <div style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} style={{ padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: idx === selectedOrder.items.length - 1 ? 'none' : '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        {item.image ? (
                          <img src={item.image} alt="" style={{ width: '40px', height: '40px', borderRadius: '6px', objectFit: 'cover' }} />
                        ) : (
                          <div style={{ width: '40px', height: '40px', borderRadius: '6px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>🍲</div>
                        )}
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600 }}>{item.name}</div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{item.weight} x {item.quantity}</div>
                        </div>
                      </div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>₹{Number(item.price) * Number(item.quantity)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: '24px', padding: '16px', borderTop: '2px dashed #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px', color: '#64748b' }}>
                  <span>Item Total</span>
                  <span>₹{selectedOrder.pricing?.itemTotal}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px', color: '#64748b' }}>
                  <span>Delivery Charge</span>
                  <span>₹{selectedOrder.pricing?.deliveryCharge}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px', color: '#64748b' }}>
                  <span>GST (5%)</span>
                  <span>₹{selectedOrder.pricing?.gst}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, color: '#1e293b', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                  <span>Grand Total</span>
                  <span style={{ color: '#3b82f6' }}>₹{selectedOrder.total}</span>
                </div>
              </div>
            </div>

            <div style={{ padding: '16px 24px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setSelectedOrder(null)}>Close Details</button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="toast">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          {toast}
        </div>
      )}

      <style>{`
        .badge-placed { background: #fff7ed; color: #9a3412; border: 1px solid #ffedd5; }
        .badge-confirmed { background: #eff6ff; color: #1d4ed8; border: 1px solid #dbeafe; }
        .badge-preparation { background: #fffbeb; color: #b45309; border: 1px solid #fef3c7; }
        .badge-dispatched { background: #f5f3ff; color: #6d28d9; border: 1px solid #ede9fe; }
        .badge-out { background: #f0fdfa; color: #0d9488; border: 1px solid #ccfbf1; }
        .badge-success { background: #f0fdf4; color: #15803d; border: 1px solid #dcfce7; }
        .badge-error { background: #fef2f2; color: #b91c1c; border: 1px solid #fee2e2; }
        
        .tab-btn {
          padding: 8px 16px;
          border: none;
          background: none;
          color: #64748b;
          font-weight: 600;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s;
        }
        .tab-btn.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
          background: #eff6ff;
          border-radius: 8px 8px 0 0;
        }
      `}</style>
    </div>
  );
}
