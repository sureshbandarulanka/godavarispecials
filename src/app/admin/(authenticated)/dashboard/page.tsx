'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { getOrdersAsync, getProducts, fetchFirebaseData } from '@/services/productService';
import { getUsersAsync } from '@/services/authService';
import { getTodayVisits, getTodayVisitDetails } from '@/services/analyticsService';
import { useCategories } from '@/context/CategoryContext';
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  Clock, 
  Package,
  IndianRupee,
  ChevronRight,
  Eye
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
  const { categories } = useCategories();
  const [productCount, setProductCount] = useState(0);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [userStats, setUserStats] = useState({ total: 0, today: 0 });
  const [todayVisitsCount, setTodayVisitsCount] = useState(0);
  const [visitDetails, setVisitDetails] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'users' | 'today-users' | 'today-visits' | 'orders' | 'today-orders' | 'products' | 'categories' | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await fetchFirebaseData();
        const products = getProducts();
        setProductCount(products.length);
        setAllProducts(products);
        
        const data = await getOrdersAsync();
        setOrders(data as Order[]);

        const visits = await getTodayVisits();
        setTodayVisitsCount(visits);

        const vDetails = await getTodayVisitDetails();
        setVisitDetails(vDetails);

        const users = await getUsersAsync();
        setAllUsers(users);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayUsers = users.filter(u => {
          if (!u.createdAt) return false;
          const date = u.createdAt.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
          return date >= today;
        });

        setUserStats({
          total: users.length,
          today: todayUsers.length
        });
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
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
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1e293b', marginBottom: '8px' }}>Welcome to Admin Dashboard</h1>
        <p style={{ color: '#64748b' }}>Here is what's happening with your store today.</p>
      </div>

      {/* Primary Metrics (From User Request) */}
      <div className="admin-stats-grid" style={{ marginBottom: '32px' }}>
        <div className="admin-stat-card clickable" onClick={() => { setModalType('products'); setIsModalOpen(true); }}>
          <div className="admin-stat-info">
            <h3>Total Products</h3>
            <div className="admin-stat-value">{loading ? '...' : productCount}</div>
          </div>
          <div className="admin-stat-icon icon-blue">
            <ShoppingBag size={24} />
          </div>
        </div>

        <div className="admin-stat-card clickable" onClick={() => { setModalType('categories'); setIsModalOpen(true); }}>
          <div className="admin-stat-info">
            <h3>Total Categories</h3>
            <div className="admin-stat-value">{loading ? '...' : categories.length}</div>
          </div>
          <div className="admin-stat-icon icon-green">
            <Package size={24} />
          </div>
        </div>

        <div className="admin-stat-card clickable" onClick={() => { setModalType('orders'); setIsModalOpen(true); }}>
          <div className="admin-stat-info">
            <h3>Total Orders</h3>
            <div className="admin-stat-value">{loading ? '...' : stats.totalOrders}</div>
          </div>
          <div className="admin-stat-icon icon-purple">
            <Clock size={24} />
          </div>
        </div>
      </div>

      <div className="admin-card-header" style={{ marginBottom: '16px' }}>
        <h3 className="admin-card-title">User Insights</h3>
      </div>

      {/* User Stats Grid */}
      <div className="admin-stats-grid" style={{ marginBottom: '32px' }}>
        <div className="admin-stat-card clickable" onClick={() => { setModalType('users'); setIsModalOpen(true); }}>
          <div className="admin-stat-info">
            <h3>Total Registered Users</h3>
            <div className="admin-stat-value">{userStats.total}</div>
            <div style={{ fontSize: '12px', color: '#8b5cf6', marginTop: '4px' }}>
              Click to view all customers
            </div>
          </div>
          <div className="admin-stat-icon icon-purple">
            <Users size={24} />
          </div>
        </div>

        <div className="admin-stat-card clickable" onClick={() => { setModalType('today-users'); setIsModalOpen(true); }}>
          <div className="admin-stat-info">
            <h3>Today Registered Users</h3>
            <div className="admin-stat-value">{userStats.today}</div>
            <div style={{ fontSize: '12px', color: '#8b5cf6', marginTop: '4px' }}>
              New signups today
            </div>
          </div>
          <div className="admin-stat-icon icon-orange">
            <Users size={24} />
          </div>
        </div>

        <div className="admin-stat-card clickable" onClick={() => { setModalType('today-visits'); setIsModalOpen(true); }}>
          <div className="admin-stat-info">
            <h3>Today's Website Visitors</h3>
            <div className="admin-stat-value">{loading ? '...' : todayVisitsCount}</div>
            <div style={{ fontSize: '12px', color: '#3b82f6', marginTop: '4px' }}>
              Click to view who visited
            </div>
          </div>
          <div className="admin-stat-icon icon-blue">
            <Eye size={24} />
          </div>
        </div>
      </div>

      <div className="admin-card-header" style={{ marginBottom: '16px' }}>
        <h3 className="admin-card-title">Financial Analytics</h3>
      </div>
      
      {/* Metrics Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card clickable" onClick={() => { setModalType('orders'); setIsModalOpen(true); }}>
          <div className="admin-stat-info">
            <h3>Total Revenue</h3>
            <div className="admin-stat-value">₹{stats.totalRevenue.toLocaleString()}</div>
            <div style={{ fontSize: '12px', color: '#2E7D32', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
              <TrendingUp size={14} /> Total Lifetime Sales
            </div>
          </div>
          <div className="admin-stat-icon icon-blue">
            <IndianRupee size={24} />
          </div>
        </div>

        <div className="admin-stat-card clickable" onClick={() => { setModalType('today-orders'); setIsModalOpen(true); }}>
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

        <div className="admin-stat-card clickable" onClick={() => { setModalType('today-orders'); setIsModalOpen(true); }}>
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
      
      {/* Detail Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{
                modalType === 'users' ? 'All Registered Users' : 
                modalType === 'today-users' ? 'Today\'s New Users' :
                modalType === 'today-visits' ? 'Today\'s Website Visitors' :
                modalType === 'orders' ? 'All Orders' : 
                modalType === 'today-orders' ? 'Today\'s Orders' :
                modalType === 'products' ? 'Product Inventory' :
                'Categories List'
              }</h2>
              <button className="close-btn" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            <div className="modal-body">
              {modalType === 'today-visits' ? (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Visitor Type</th>
                      <th>Name / Email</th>
                      <th>Device & Browser</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visitDetails.length > 0 ? visitDetails.map((v, i) => {
                      const date = v.timestamp?.toDate ? v.timestamp.toDate() : new Date(v.timestamp);
                      return (
                        <tr key={i}>
                          <td>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td>
                            <span className={`badge ${v.type === 'User' ? 'badge-success' : 'badge-info'}`}>
                              {v.type}
                            </span>
                          </td>
                          <td>
                            {v.type === 'User' ? (
                              <div>
                                <div style={{ fontWeight: 600 }}>{v.name || 'User'}</div>
                                <div style={{ fontSize: '12px', color: '#64748b' }}>{v.email || v.phone || '-'}</div>
                              </div>
                            ) : (
                              <div style={{ color: '#64748b' }}>Anonymous Visitor</div>
                            )}
                          </td>
                          <td>
                            <div style={{ fontWeight: 600 }}>{v.device || 'Desktop'}</div>
                            <div style={{ fontSize: '12px', color: '#64748b', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={v.userAgent}>
                              {v.userAgent}
                            </div>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan={4} style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>No detailed visits recorded today yet.</td></tr>
                    )}
                  </tbody>
                </table>
              ) : modalType?.includes('users') ? (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Joined On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers
                      .filter(u => {
                        if (modalType !== 'today-users') return true;
                        const today = new Date();
                        today.setHours(0,0,0,0);
                        const date = u.createdAt?.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
                        return date >= today;
                      })
                      .map((u, i) => {
                        const date = u.createdAt?.toDate ? u.createdAt.toDate() : new Date(u.createdAt);
                        return (
                          <tr key={i}>
                            <td>{u.displayName || 'User'}</td>
                            <td>{u.email || '-'}</td>
                            <td>{u.phone || '-'}</td>
                            <td>{date.toLocaleDateString()}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              ) : modalType?.includes('orders') ? (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders
                      .filter(o => {
                        if (modalType !== 'today-orders') return true;
                        const today = new Date();
                        today.setHours(0,0,0,0);
                        const date = o.createdAt?.toDate ? o.createdAt.toDate() : new Date(o.createdAt);
                        return date >= today;
                      })
                      .map((o, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600, color: '#3b82f6' }}>{o.orderId}</td>
                          <td>{o.address?.name || 'Guest'}</td>
                          <td>{o.items?.length || 0} items</td>
                          <td>₹{o.total}</td>
                          <td>
                            <span className={`badge ${
                              o.status === 'Delivered' ? 'badge-success' : 
                              o.status === 'Cancelled' ? 'badge-error' : 'badge-info'
                            }`}>{o.status}</span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              ) : modalType === 'products' ? (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Price (1st Variant)</th>
                      <th>Stock Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allProducts.map((p, i) => (
                      <tr key={i}>
                        <td><img src={p.imageUrl} width="40" height="40" style={{ borderRadius: '8px', objectFit: 'cover' }} /></td>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td>{p.category}</td>
                        <td>₹{p.variants?.[0]?.price || '-'}</td>
                        <td>
                          <span className={`badge ${p.isOutOfStock ? 'badge-error' : 'badge-success'}`}>
                            {p.isOutOfStock ? 'Out of Stock' : 'In Stock'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
                  {categories.map((c, i) => (
                    <div key={i} style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px', textAlign: 'center' }}>
                      <img src={c.imageUrl} width="60" height="60" style={{ margin: '0 auto 12px', display: 'block', borderRadius: '12px' }} />
                      <span style={{ fontWeight: 700, color: '#1e293b' }}>{c.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .dashboard-container {
          animation: fadeIn 0.5s ease-out;
        }
        .clickable {
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .clickable:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
          border-color: #3b82f6;
        }
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          padding: 20px;
          backdrop-filter: blur(4px);
        }
        .modal-content {
          background: white;
          padding: 32px;
          border-radius: 24px;
          max-width: 900px;
          width: 100%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 16px;
        }
        .close-btn {
          background: none;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #64748b;
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
