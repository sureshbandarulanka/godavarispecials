'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { getOrdersAsync } from '@/services/productService';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  Clock, 
  Package,
  IndianRupee,
  ChevronRight
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';

interface Order {
  id: string;
  orderId: string;
  customerName: string;
  status: string;
  total: number;
  createdAt: any;
  items: any[];
  address: any;
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await getOrdersAsync();
        setOrders(data as Order[]);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const stats = useMemo(() => {
    // 1. Revenue Calculation (Exclude Cancelled)
    const validOrders = orders.filter(o => o.status !== "Cancelled");
    
    // Total Revenue
    const totalRevenue = validOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    
    // 2. Today's Stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayOrdersList = orders.filter(o => {
      // Date Handling: Handle Firestore Timestamp or ISO String
      const date = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
      return date >= today;
    });
    
    const todayValidOrders = todayOrdersList.filter(o => o.status !== "Cancelled");
    const todayRevenue = todayValidOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    
    return {
      totalRevenue,
      totalOrders: orders.length,
      todayOrders: todayOrdersList.length,
      todayRevenue,
      validOrders
    };
  }, [orders]);

  // 3. 7-Day Revenue Chart (Fill missing dates with 0)
  const chartData = useMemo(() => {
    interface ChartDataPoint {
      date: string;
      fullDate: string;
      revenue: number;
    }
    
    const last7Days: ChartDataPoint[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      last7Days.push({
        date: date.toLocaleDateString('en-IN', { weekday: 'short' }),
        fullDate: date.toDateString(),
        revenue: 0
      });
    }

    stats.validOrders.forEach(order => {
      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
      const dayIndex = last7Days.findIndex(d => d.fullDate === orderDate.toDateString());
      if (dayIndex !== -1) {
        last7Days[dayIndex].revenue += Number(order.total) || 0;
      }
    });

    return last7Days;
  }, [stats.validOrders]);

  // 4. Top Selling Products Logic
  const topProducts = useMemo(() => {
    const productCounts: Record<string, { name: string, count: number }> = {};
    
    orders.forEach(order => {
      order.items?.forEach(item => {
        const id = item.id || item.name; // Use productId if available
        if (!productCounts[id]) {
          productCounts[id] = { name: item.name, count: 0 };
        }
        productCounts[id].count += (Number(item.quantity) || 1);
      });
    });

    return Object.values(productCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [orders]);

  // 5. Recent Orders (Latest 5)
  const recentOrders = useMemo(() => {
    return [...orders]
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5);
  }, [orders]);

  if (loading) {
    return (
      <div className="admin-empty">
        <div className="spinner" style={{ margin: '0 auto' }}></div>
        <p style={{ marginTop: '16px', color: '#64748b' }}>Generating production-level insights...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Metrics Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <h3>Total Revenue</h3>
            <div className="admin-stat-value">₹{stats.totalRevenue.toLocaleString()}</div>
            <div style={{ fontSize: '12px', color: '#2E7D32', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              <TrendingUp size={14} /> Clean business growth
            </div>
          </div>
          <div className="admin-stat-icon icon-blue">
            <IndianRupee size={24} />
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <h3>Total Orders</h3>
            <div className="admin-stat-value">{stats.totalOrders}</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
              Lifetime store volume
            </div>
          </div>
          <div className="admin-stat-icon icon-purple">
            <ShoppingBag size={24} />
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <h3>Today's Orders</h3>
            <div className="admin-stat-value">{stats.todayOrders}</div>
            <div style={{ fontSize: '12px', color: '#3472ba', marginTop: '4px' }}>
              New orders received
            </div>
          </div>
          <div className="admin-stat-icon icon-orange">
            <Clock size={24} />
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-info">
            <h3>Today's Revenue</h3>
            <div className="admin-stat-value">₹{stats.todayRevenue.toLocaleString()}</div>
            <div style={{ fontSize: '12px', color: '#2E7D32', marginTop: '4px' }}>
              Daily sales target
            </div>
          </div>
          <div className="admin-stat-icon icon-green">
            <TrendingUp size={24} />
          </div>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="analytics-grid">
        {/* Revenue Chart */}
        <div className="chart-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 className="admin-card-title">Revenue (Last 7 Days)</h3>
            <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block' }}></span>
              Sales in Rupees
            </div>
          </div>
          <div style={{ width: '100%', height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  tickFormatter={(value) => `₹${value}`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [`₹${value}`, 'Revenue']}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorRev)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products */}
        <div className="top-products-card">
          <h3 className="admin-card-title" style={{ marginBottom: '16px' }}>Top 5 Products</h3>
          <div className="product-rank-list">
            {topProducts.length > 0 ? topProducts.map((product, index) => (
              <div key={index} className="product-rank-item">
                <div className="rank-number">{index + 1}</div>
                <div className="rank-info">
                  <span className="rank-name">{product.name}</span>
                  <span className="rank-count">{product.count} orders</span>
                </div>
                <ChevronRight size={16} color="#cbd5e1" />
              </div>
            )) : (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
                <Package size={32} style={{ marginBottom: '8px' }} />
                <p>No product insights yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="admin-card" style={{ marginTop: '32px' }}>
        <div className="admin-card-header">
          <h3 className="admin-card-title">Recent Orders</h3>
          <button className="btn-secondary" style={{ fontSize: '13px' }}>Manage All</button>
        </div>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => {
                const date = order.createdAt?.toDate ? order.createdAt.toDate() : new Date(order.createdAt);
                return (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 600, color: '#3b82f6' }}>{order.orderId}</td>
                    <td>{order.address?.name || 'Guest'}</td>
                    <td style={{ fontWeight: 600 }}>₹{order.total}</td>
                    <td>
                      <span className={`badge ${
                        order.status === 'Delivered' ? 'badge-success' : 
                        order.status === 'Cancelled' ? 'badge-error' : 
                        order.status === 'Pending' ? 'badge-warning' : 'badge-info'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ fontSize: '13px', color: '#64748b' }}>
                      {date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      
      <style jsx>{`
        .dashboard-container {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .badge-warning { background: #fff7ed; color: #9a3412; border: 1px solid #ffedd5; }
        .badge-success { background: #f0fdf4; color: #15803d; border: 1px solid #dcfce7; }
        .badge-error { background: #fef2f2; color: #b91c1c; border: 1px solid #fee2e2; }
      `}</style>
    </div>
  );
}
