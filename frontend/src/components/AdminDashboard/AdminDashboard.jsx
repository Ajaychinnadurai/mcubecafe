import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import NotificationBell from '../NotificationBell/NotificationBell';
import TrendLineGraph from './TrendLineGraph';
import './AdminDashboard.css';

const statusOptions = [
  { value: 'pending_payment', label: '⏳ Pending Payment', color: '#ff9800' },
  { value: 'pending_counter', label: '💰 Pay at Counter', color: '#ff9800' },
  { value: 'paid', label: '✅ Paid', color: '#4caf50' },
  { value: 'preparing', label: '👨‍🍳 Preparing', color: '#2196f3' },
  { value: 'ready', label: '🎉 Ready', color: '#fdf43b' },
  { value: 'completed', label: '✅ Completed', color: '#4caf50' },
  { value: 'cancelled', label: '❌ Cancelled', color: '#e53935' },
];

export default function AdminDashboard() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('orders');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Order highlighted from a notification click (?order=N)
  const [highlightOrderId, setHighlightOrderId] = useState(() => {
    const param = searchParams.get('order');
    return param ? Number(param) : null;
  });

  // Orders state
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [statusMsg, setStatusMsg] = useState(null);

  // Trend graph state
  const [graphMetric, setGraphMetric] = useState('revenue');
  const [graphPeriod, setGraphPeriod] = useState('7d');

  // Menu state
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // item being edited inline
  const [newItem, setNewItem] = useState({
    name: '', description: '', price: '', category: '', is_bestseller: false, is_available: true,
  });
  const [newCategory, setNewCategory] = useState({ name: '', slug: '' });

  // Gallery state
  const [galleryImages, setGalleryImages] = useState([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadCaption, setUploadCaption] = useState('');

  // Testimonial state
  const [testimonials, setTestimonials] = useState([]);
  const [testimonialLoading, setTestimonialLoading] = useState(false);
  const [newTestimonial, setNewTestimonial] = useState({ customer_name: '', content: '', rating: 5 });

  const showStatus = (msg, type = 'success') => {
    setStatusMsg({ msg, type });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (paymentFilter) params.payment_method = paymentFilter;
      const [ordersRes, statsRes] = await Promise.all([
        api.get('/admin/orders/', { params }),
        api.get('/admin/orders/stats/'),
      ]);
      setOrders(ordersRes.data);
      setStats(statsRes.data);
    } catch { /* fail silently */ }
    finally { setOrdersLoading(false); }
  }, [statusFilter, paymentFilter]);

  // Fetch menu
  const fetchMenu = useCallback(async () => {
    try {
      setMenuLoading(true);
      const [menuRes, catRes] = await Promise.all([
        api.get('/admin/menu/'),
        api.get('/admin/menu/categories/'),
      ]);
      setMenuItems(menuRes.data);
      setCategories(catRes.data);
    } catch { /* fail silently */ }
    finally { setMenuLoading(false); }
  }, []);

  // Fetch gallery
  const fetchGallery = useCallback(async () => {
    try {
      setGalleryLoading(true);
      const res = await api.get('/admin/gallery/');
      setGalleryImages(res.data);
    } catch { /* fail silently */ }
    finally { setGalleryLoading(false); }
  }, []);

  // Fetch testimonials
  const fetchTestimonials = useCallback(async () => {
    try {
      setTestimonialLoading(true);
      const res = await api.get('/admin/testimonials/');
      setTestimonials(res.data);
    } catch { /* fail silently */ }
    finally { setTestimonialLoading(false); }
  }, []);

  useEffect(() => {
    if (!isAdmin) { navigate('/admin/login'); return; }
    fetchOrders();
    fetchMenu();
    fetchGallery();
    fetchTestimonials();
  }, [isAdmin, fetchOrders, fetchMenu, fetchGallery, fetchTestimonials, navigate]);

  // Listen for real-time new order notification event
  useEffect(() => {
    const handleNewOrder = (e) => {
      fetchOrders();
      const notif = e.detail;
      showStatus(notif?.message ? `🔔 ${notif.message}` : '🔔 New order received!');
    };

    window.addEventListener('new-order-received', handleNewOrder);
    return () => window.removeEventListener('new-order-received', handleNewOrder);
  }, [fetchOrders]);

  // Auto-clear the order highlight after a few seconds
  useEffect(() => {
    if (!highlightOrderId) return;
    const timer = setTimeout(() => setHighlightOrderId(null), 6000);
    return () => clearTimeout(timer);
  }, [highlightOrderId]);

  // ===== ORDER ACTIONS =====
  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      await api.patch(`/admin/orders/${orderId}/`, { status: newStatus });
      showStatus(`Order #${orderId} updated to ${statusOptions.find(s => s.value === newStatus)?.label}`);
      fetchOrders();
    } catch { showStatus('Failed to update order', 'error'); }
  };

  const handleMarkCashPaid = async (orderId) => {
    try {
      await api.post(`/admin/orders/${orderId}/mark-cash-paid/`);
      showStatus(`Order #${orderId} marked as paid`);
      fetchOrders();
    } catch { showStatus('Failed to mark as paid', 'error'); }
  };

  // ===== MENU ACTIONS =====
  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price || !newItem.category) return;
    try {
      const formData = new FormData();
      formData.append('name', newItem.name);
      formData.append('description', newItem.description);
      formData.append('price', parseFloat(newItem.price));
      formData.append('category', parseInt(newItem.category));
      formData.append('is_bestseller', newItem.is_bestseller);
      formData.append('is_available', newItem.is_available);
      await api.post('/admin/menu/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setNewItem({ name: '', description: '', price: '', category: '', is_bestseller: false, is_available: true });
      showStatus(`"${newItem.name}" added to menu`);
      fetchMenu();
    } catch { showStatus('Failed to add item', 'error'); }
  };

  const handleUpdateItem = async (itemId, data) => {
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, val]) => {
        if (val !== undefined && val !== null) formData.append(key, val);
      });
      await api.patch(`/admin/menu/${itemId}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setEditingItem(null);
      showStatus('Menu item updated');
      fetchMenu();
    } catch { showStatus('Failed to update item', 'error'); }
  };

  const handleToggle = async (itemId, field, current) => {
    try {
      await api.patch(`/admin/menu/${itemId}/`, { [field]: !current });
      fetchMenu();
    } catch { /* fail silently */ }
  };

  const handleDeleteItem = async (itemId, itemName) => {
    if (!window.confirm(`Delete "${itemName}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/menu/${itemId}/`);
      showStatus(`"${itemName}" deleted`);
      fetchMenu();
    } catch { showStatus('Failed to delete item', 'error'); }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategory.name) return;
    try {
      const slug = newCategory.slug || newCategory.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await api.post('/admin/menu/categories/', { ...newCategory, slug });
      setNewCategory({ name: '', slug: '' });
      showStatus(`Category "${newCategory.name}" added`);
      fetchMenu();
    } catch { showStatus('Failed to add category', 'error'); }
  };

  const handleToggleCategory = async (catId, current) => {
    try {
      await api.patch(`/admin/menu/categories/${catId}/`, { is_active: !current });
      showStatus('Category visibility updated');
      fetchMenu();
    } catch { showStatus('Failed to update category', 'error'); }
  };

  const handleDeleteCategory = async (catId, catName) => {
    if (!window.confirm(`Delete category "${catName}"? All menu items inside it will also be deleted.`)) return;
    try {
      await api.delete(`/admin/menu/categories/${catId}/`);
      showStatus(`Category "${catName}" deleted`);
      fetchMenu();
    } catch { showStatus('Failed to delete category', 'error'); }
  };

  // ===== GALLERY ACTIONS =====
  const handleUploadImage = async (e) => {
    e.preventDefault();
    if (!uploadFile) return;
    try {
      const formData = new FormData();
      formData.append('image', uploadFile);
      formData.append('caption', uploadCaption);
      await api.post('/admin/gallery/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadFile(null);
      setUploadCaption('');
      document.getElementById('gallery-upload-input').value = '';
      showStatus('Gallery image uploaded');
      fetchGallery();
    } catch { showStatus('Failed to upload image', 'error'); }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Delete this gallery image?')) return;
    try {
      await api.delete(`/admin/gallery/${imageId}/`);
      showStatus('Gallery image deleted');
      fetchGallery();
    } catch { showStatus('Failed to delete image', 'error'); }
  };

  // ===== TESTIMONIAL ACTIONS =====
  const handleAddTestimonial = async (e) => {
    e.preventDefault();
    if (!newTestimonial.customer_name || !newTestimonial.content) return;
    try {
      await api.post('/admin/testimonials/', newTestimonial);
      setNewTestimonial({ customer_name: '', content: '', rating: 5 });
      showStatus('Testimonial added');
      fetchTestimonials();
    } catch { showStatus('Failed to add testimonial', 'error'); }
  };

  const handleDeleteTestimonial = async (id) => {
    if (!window.confirm('Delete this testimonial?')) return;
    try {
      await api.delete(`/admin/testimonials/${id}/`);
      showStatus('Testimonial deleted');
      fetchTestimonials();
    } catch { showStatus('Failed to delete testimonial', 'error'); }
  };

  // ===== EXPORT / DATA DOWNLOAD ACTIONS =====
  const handleDownloadExport = (endpoint, filename) => {
    showStatus(`Preparing ${filename}...`);
    api.get(endpoint, { responseType: 'blob' })
      .then((res) => {
        const downloadUrl = window.URL.createObjectURL(new Blob([res.data]));
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        showStatus(`Downloaded ${filename}`);
      })
      .catch((err) => {
        console.error('Export download failed:', err);
        showStatus('Failed to download data report', 'error');
      });
  };

  const handleDownloadPDFBill = (orderId) => {
    showStatus(`Generating Bill PDF for Order #${orderId}...`);
    api.get(`/orders/${orderId}/bill/download/`, { responseType: 'blob' })
      .then((res) => {
        const downloadUrl = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', `Mcubes_Bill_#${orderId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        showStatus(`Downloaded Bill PDF for Order #${orderId}`);
      })
      .catch((err) => {
        console.error('Bill PDF download failed:', err);
        showStatus('Failed to download PDF bill', 'error');
      });
  };

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  if (!isAdmin) return null;

  return (
    <div className="admin-layout">
      {/* Status Toast */}
      {statusMsg && (
        <div style={{
          position: 'fixed', top: '1rem', right: '1rem', zIndex: 10000,
          padding: '0.75rem 1.5rem', borderRadius: 'var(--border-radius-sm)',
          background: statusMsg.type === 'error' ? 'var(--error)' : 'var(--success)',
          color: 'white', fontWeight: 500, animation: 'slideInRight 0.3s ease',
        }}>
          {statusMsg.msg}
        </div>
      )}

      {/* Sidebar Backdrop Overlay (mobile) */}
      <div
        className={`admin-sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-sidebar-header">
          <a href="/" className="admin-sidebar-brand">
            <img src="/logo.png" alt="M Cube's Cafe Logo" />
            <span>Mcubes Admin</span>
          </a>
          <button className="sidebar-close-btn" onClick={() => setSidebarOpen(false)} aria-label="Close sidebar">
            ✕
          </button>
        </div>
        <div className="admin-sidebar-nav">
          <button className={`admin-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => { setActiveTab('orders'); setSidebarOpen(false); }}>
            <span className="icon">📋</span> Orders
          </button>
          <button className={`admin-nav-item ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => { setActiveTab('menu'); setSidebarOpen(false); }}>
            <span className="icon">🍽️</span> Menu
          </button>
          <button className={`admin-nav-item ${activeTab === 'gallery' ? 'active' : ''}`}
            onClick={() => { setActiveTab('gallery'); setSidebarOpen(false); }}>
            <span className="icon">🖼️</span> Gallery
          </button>
          <button className={`admin-nav-item ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => { setActiveTab('reviews'); setSidebarOpen(false); }}>
            <span className="icon">⭐</span> Reviews
          </button>
          <button className={`admin-nav-item ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => { setActiveTab('stats'); setSidebarOpen(false); }}>
            <span className="icon">📊</span> Analytics
          </button>
          <button className={`admin-nav-item ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => { setActiveTab('export'); setSidebarOpen(false); }}>
            <span className="icon">📥</span> Data Downloads
          </button>
        </div>
        <div className="admin-sidebar-footer">
          <button className="admin-nav-item" onClick={() => window.open('/', '_blank')}>
            <span className="icon">🏠</span> View Storefront
          </button>
          <button className="admin-nav-item" style={{ color: 'var(--error)' }} onClick={handleLogout}>
            <span className="icon">🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        <button className="hamburger-admin" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>

        <div className="admin-header">
          <div className="admin-header-left">
            <h1>
              {activeTab === 'orders' && '📋 Orders'}
              {activeTab === 'menu' && '🍽️ Menu Editor'}
              {activeTab === 'gallery' && '🖼️ Gallery'}
              {activeTab === 'reviews' && '⭐ Reviews & Testimonials'}
              {activeTab === 'stats' && '📊 Analytics'}
              {activeTab === 'export' && '📥 Data Downloads & Export'}
            </h1>
            <p>Welcome back, {user?.username}! Manage your cafe from here.</p>
          </div>
          <div className="admin-header-right">
            <NotificationBell />
          </div>
        </div>

        {/* Stats Overview (shown on orders tab) */}
        {stats && activeTab === 'orders' && (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(76, 175, 80, 0.1)' }}>📦</div>
              <div className="stat-info"><h3>{stats.today_orders_count}</h3><p>Today's Orders</p></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(253, 244, 59, 0.1)' }}>💰</div>
              <div className="stat-info"><h3>₹{stats.today_revenue?.toFixed(2)}</h3><p>Today's Revenue</p></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(33, 150, 243, 0.1)' }}>⏳</div>
              <div className="stat-info"><h3>{stats.pending_orders_count}</h3><p>Pending Orders</p></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon" style={{ background: 'rgba(156, 39, 176, 0.1)' }}>📈</div>
              <div className="stat-info"><h3>{stats.total_orders_count}</h3><p>Total Orders</p></div>
            </div>
          </div>
        )}

        {/* ===== ORDERS TAB ===== */}
        {activeTab === 'orders' && (
          <div className="admin-table-wrapper">
            <div className="admin-table-header">
              <h3>All Orders</h3>
              <div className="admin-table-filters">
                <select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="">All Status</option>
                  {statusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <select aria-label="Filter by payment method" value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
                  <option value="">All Payments</option>
                  <option value="upi">UPI</option>
                  <option value="stripe">Card (Stripe)</option>
                  <option value="cash">Cash</option>
                </select>
                <button className="btn btn-outline btn-sm" onClick={fetchOrders}>🔄 Refresh</button>
                <button className="btn btn-primary btn-sm export-btn-sm" onClick={() => handleDownloadExport('/admin/export/orders/', `mcubes_orders_${statusFilter || 'all'}.csv`)} title="Export Orders to CSV">
                  📥 Export Orders CSV
                </button>
              </div>
            </div>
            {ordersLoading ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <div className="spinner spinner-lg"></div>
                <p style={{ marginTop: '1rem' }}>Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>No orders found.</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="admin-table">
                  <thead><tr>
                    <th>Order #</th><th>Customer</th><th>Items</th><th>Total</th>
                    <th>Payment</th><th>Status</th><th>Actions</th>
                  </tr></thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className={highlightOrderId === order.id ? 'order-row-highlight' : ''}>
                        <td style={{ fontWeight: 700, color: 'var(--yellow)' }}>#{order.id}</td>
                        <td>
                          <div>{order.user_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.user_phone}</div>
                        </td>
                        <td>
                          {order.items?.slice(0, 2).map((item, i) => (
                            <div key={i} style={{ fontSize: '0.85rem' }}>{item.item_name} × {item.quantity}</div>
                          ))}
                          {order.items?.length > 2 && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>+{order.items.length - 2} more</div>
                          )}
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--yellow)' }}>₹{order.total_amount}</td>
                        <td>
                          <span style={{ fontSize: '0.85rem' }}>
                            {order.payment_method === 'upi' ? '📱 Online (UPI)' :
                             order.payment_method === 'cash' ? '💰 Offline (Cash)' : order.payment_method}
                          </span>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {order.order_type === 'dine_in' ? 'Dine In' : 'Takeaway'}
                          </div>
                        </td>
                        <td>
                          <select className="status-select" value={order.status}
                            onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                            aria-label={`Status for order #${order.id}`}
                            style={{
                              background: (statusOptions.find(s => s.value === order.status)?.color || '#333') + '22',
                              color: statusOptions.find(s => s.value === order.status)?.color || '#fff',
                              borderColor: statusOptions.find(s => s.value === order.status)?.color || '#333',
                            }}>
                            {statusOptions.map((opt) => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                            {order.payment_method === 'cash' && order.status === 'pending_counter' && (
                              <button className="action-btn mark-paid" onClick={() => handleMarkCashPaid(order.id)}>
                                💰 Mark Paid
                              </button>
                            )}
                            <button className="action-btn download-pdf-btn" onClick={() => handleDownloadPDFBill(order.id)} title="Download Order PDF Bill">
                              📄 Bill PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ===== MENU TAB ===== */}
        {activeTab === 'menu' && (
          <>
            {/* Add New Item */}
            <div className="add-item-form">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>➕ Add New Menu Item</h3>
                <button className="btn btn-outline btn-sm" onClick={() => handleDownloadExport('/admin/export/menu/', 'mcubes_menu_catalog.csv')}>
                  📥 Export Menu CSV
                </button>
              </div>
              <form onSubmit={handleAddItem}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="add-item-name">Name *</label>
                    <input id="add-item-name" type="text" className="form-input" value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} placeholder="e.g. Cold Coffee" required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="add-item-price">Price (₹) *</label>
                    <input id="add-item-price" type="number" step="0.01" className="form-input" value={newItem.price}
                      onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} placeholder="99.00" required />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="add-item-desc">Description</label>
                  <textarea id="add-item-desc" className="form-input" rows="2" value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} placeholder="Brief description" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="add-item-category">Category *</label>
                    <select id="add-item-category" className="form-input" value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} required>
                      <option value="">Select category</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', paddingBottom: '0.75rem' }}>
                    <label className="toggle-label">
                      <input type="checkbox" checked={newItem.is_bestseller}
                        onChange={(e) => setNewItem({ ...newItem, is_bestseller: e.target.checked })} />
                      ⭐ Bestseller
                    </label>
                    <button type="submit" className="btn btn-primary btn-sm">➕ Add Item</button>
                  </div>
                </div>
              </form>
            </div>

            {/* Add Category */}
            <div className="add-item-form">
              <h3>📁 Add Menu Category</h3>
              <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                  <label className="form-label" htmlFor="add-category-name">Category Name</label>
                  <input id="add-category-name" type="text" className="form-input" value={newCategory.name}
                    onChange={(e) => {
                      const name = e.target.value;
                      setNewCategory({ name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') });
                    }} placeholder="e.g. Smoothie Bowls" required />
                </div>
                <button type="submit" className="btn btn-secondary btn-sm">📁 Add</button>
              </form>
            </div>

            {/* Manage Categories */}
            <div className="add-item-form category-manager">
              <h3>📂 Manage Categories</h3>
              {categories.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No categories yet. Add one above.</p>
              ) : (
                <div className="category-list">
                  {categories.map((cat) => (
                    <div key={cat.id} className={`category-row ${cat.is_active ? '' : 'inactive'}`}>
                      <div className="category-row-info">
                        <span className="category-name">{cat.name}</span>
                        <span className="category-meta">
                          {cat.item_count} item{cat.item_count === 1 ? '' : 's'} · /{cat.slug}
                        </span>
                      </div>
                      <div className="category-row-actions">
                        <button
                          type="button"
                          className={`btn btn-sm ${cat.is_active ? 'btn-outline' : 'btn-primary'}`}
                          onClick={() => handleToggleCategory(cat.id, cat.is_active)}
                        >
                          {cat.is_active ? '🟢 Active' : '⚫ Hidden'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                          aria-label={`Delete category ${cat.name}`}
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Menu Items Grid */}
            {menuLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner spinner-lg"></div></div>
            ) : (
              <div className="menu-editor-grid">
                {menuItems.map((item) => (
                  <div key={item.id} className="menu-edit-card">
                    {editingItem === item.id ? (
                      /* Inline edit mode */
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        const form = e.target;
                        const data = {};
                        if (form.name.value) data.name = form.name.value;
                        if (form.price.value) data.price = parseFloat(form.price.value);
                        if (form.description.value) data.description = form.description.value;
                        if (form.category.value) data.category = parseInt(form.category.value);
                        if (form.image?.files?.[0]) data.image = form.image.files[0];
                        handleUpdateItem(item.id, data);
                      }}>
                        <input type="text" className="form-input" name="name" defaultValue={item.name}
                          aria-label="Item name"
                          style={{ marginBottom: '0.5rem', fontSize: '1rem' }} />
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <input type="number" step="0.01" className="form-input" name="price" defaultValue={item.price}
                            aria-label="Item price"
                            style={{ width: '40%' }} />
                          <select className="form-input" name="category" defaultValue={item.category}
                            aria-label="Item category"
                            style={{ flex: 1 }}>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                          </select>
                        </div>
                        <textarea className="form-input" name="description" rows="2" defaultValue={item.description}
                          aria-label="Item description"
                          style={{ marginBottom: '0.5rem' }} />
                        <input type="file" name="image" accept="image/*" className="form-input"
                          aria-label="Item image"
                          style={{ fontSize: '0.8rem', marginBottom: '0.5rem' }} />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button type="submit" className="btn btn-primary btn-sm">💾 Save</button>
                          <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditingItem(null)}>Cancel</button>
                        </div>
                      </form>
                    ) : (
                      /* View mode */
                      <>
                        {item.image_url && (
                          <img src={item.image_url} alt={item.name}
                            style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: 'var(--border-radius-sm)', marginBottom: '0.75rem' }} />
                        )}
                        <div className="menu-edit-header">
                          <span className="menu-edit-name">
                            {item.name} {item.is_bestseller && '⭐'}
                          </span>
                          <span className="menu-edit-price">₹{item.price}</span>
                        </div>
                        <div className="menu-edit-desc">{item.description}</div>
                        <div className="menu-edit-toggles">
                          <label className="toggle-label">
                            <input type="checkbox" checked={item.is_bestseller}
                              onChange={() => handleToggle(item.id, 'is_bestseller', item.is_bestseller)} />
                            ⭐ Bestseller
                          </label>
                          <label className="toggle-label">
                            <input type="checkbox" checked={item.is_available}
                              onChange={() => handleToggle(item.id, 'is_available', item.is_available)} />
                            {item.is_available ? '✅ Available' : '❌ Unavailable'}
                          </label>
                          <button className="btn btn-outline btn-sm" onClick={() => setEditingItem(item.id)}>✏️ Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDeleteItem(item.id, item.name)}>🗑️</button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ===== GALLERY TAB ===== */}
        {activeTab === 'gallery' && (
          <>
            <div className="add-item-form">
              <h3>📸 Upload Gallery Image</h3>
              <form onSubmit={handleUploadImage}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="gallery-upload-input">Choose Image *</label>
                    <input id="gallery-upload-input" type="file" accept="image/*" className="form-input"
                      onChange={(e) => setUploadFile(e.target.files[0])} required style={{ fontSize: '0.85rem' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="gallery-caption">Caption</label>
                    <input id="gallery-caption" type="text" className="form-input" value={uploadCaption}
                      onChange={(e) => setUploadCaption(e.target.value)} placeholder="e.g. Cozy interior corner" />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary" disabled={!uploadFile}>📤 Upload Image</button>
              </form>
            </div>

            {galleryLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner spinner-lg"></div></div>
            ) : galleryImages.length === 0 ? (
              <div className="admin-table-wrapper">
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No gallery images yet. Upload your first cafe photo above!
                </div>
              </div>
            ) : (
              <div className="gallery-grid">
                {galleryImages.map((img) => (
                  <div key={img.id} className="menu-edit-card" style={{ padding: '0.75rem' }}>
                    {img.image_url && (
                      <img src={img.image_url} alt={img.caption}
                        style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: 'var(--border-radius-sm)', marginBottom: '0.5rem' }} />
                    )}
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      {img.caption || 'No caption'}
                    </p>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteImage(img.id)}>🗑️ Delete</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ===== REVIEWS TAB ===== */}
        {activeTab === 'reviews' && (
          <>
            <div className="add-item-form">
              <h3>⭐ Add Testimonial</h3>
              <form onSubmit={handleAddTestimonial}>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label" htmlFor="testimonial-name">Customer Name *</label>
                    <input id="testimonial-name" type="text" className="form-input" value={newTestimonial.customer_name}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, customer_name: e.target.value })}
                      placeholder="e.g. Priya K." required />
                  </div>
                  <div className="form-group">
                    <label className="form-label" htmlFor="testimonial-rating">Rating *</label>
                    <select id="testimonial-rating" className="form-input" value={newTestimonial.rating}
                      onChange={(e) => setNewTestimonial({ ...newTestimonial, rating: parseInt(e.target.value) })}>
                      {[5, 4, 3, 2, 1].map((r) => (
                        <option key={r} value={r}>{'⭐'.repeat(r)}{'☆'.repeat(5 - r)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="testimonial-content">Review *</label>
                  <textarea id="testimonial-content" className="form-input" rows="3" value={newTestimonial.content}
                    onChange={(e) => setNewTestimonial({ ...newTestimonial, content: e.target.value })}
                    placeholder="What did the customer say?" required />
                </div>
                <button type="submit" className="btn btn-primary">➕ Add Review</button>
              </form>
            </div>

            {testimonialLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}><div className="spinner spinner-lg"></div></div>
            ) : testimonials.length === 0 ? (
              <div className="admin-table-wrapper">
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No testimonials yet. Add your first review above!
                </div>
              </div>
            ) : (
              <div className="menu-editor-grid">
                {testimonials.map((t) => (
                  <div key={t.id} className="menu-edit-card">
                    <div style={{ marginBottom: '0.5rem' }}>
                      {'⭐'.repeat(t.rating)}{'☆'.repeat(5 - t.rating)}
                    </div>
                    <p style={{ fontSize: '0.95rem', color: 'var(--off-white)', fontStyle: 'italic', marginBottom: '0.75rem' }}>
                      "{t.content}"
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600, color: 'var(--yellow)' }}>— {t.customer_name}</span>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTestimonial(t.id)}>🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ===== ANALYTICS TAB ===== */}
        {activeTab === 'stats' && (
          <div className="analytics-dashboard">
            {!stats ? (
              <div className="admin-table-wrapper">
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <div className="spinner spinner-lg"></div>
                  <p style={{ marginTop: '1rem' }}>Loading analytics...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Summary cards */}
                <div className="stats-grid">
                  <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(253, 244, 59, 0.1)' }}>💰</div>
                    <div className="stat-info">
                      <h3>₹{stats.today_revenue.toFixed(2)}</h3>
                      <p>Revenue Today</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(76, 175, 80, 0.1)' }}>📦</div>
                    <div className="stat-info">
                      <h3>{stats.today_orders_count}</h3>
                      <p>Orders Today</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(33, 150, 243, 0.1)' }}>📅</div>
                    <div className="stat-info">
                      <h3>₹{stats.month_revenue.toFixed(2)}</h3>
                      <p>Revenue This Month</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'rgba(156, 39, 176, 0.1)' }}>🗒️</div>
                    <div className="stat-info">
                      <h3>{stats.month_orders_count}</h3>
                      <p>Orders This Month</p>
                    </div>
                  </div>
                </div>

                {/* ===== TREND LINE GRAPH CARD ===== */}
                <div className="admin-table-wrapper analytics-card trend-graph-card">
                  <div className="admin-table-header trend-header">
                    <div>
                      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                        📈 {graphMetric === 'revenue' ? 'Revenue Growth Trend' : 'Order Volume Trend'}
                      </h3>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        Interactive smooth curve trajectory over {graphPeriod === '7d' ? 'the last 7 days' : 'the last 30 days'}
                      </p>
                    </div>

                    <div className="trend-controls-row">
                      {/* Metric Toggle */}
                      <div className="trend-toggle-group">
                        <button
                          className={`trend-toggle-btn ${graphMetric === 'revenue' ? 'active' : ''}`}
                          onClick={() => setGraphMetric('revenue')}
                        >
                          💰 Revenue (₹)
                        </button>
                        <button
                          className={`trend-toggle-btn ${graphMetric === 'orders' ? 'active' : ''}`}
                          onClick={() => setGraphMetric('orders')}
                        >
                          📦 Orders Count
                        </button>
                      </div>

                      {/* Period Toggle */}
                      <div className="trend-toggle-group">
                        <button
                          className={`trend-toggle-btn ${graphPeriod === '7d' ? 'active' : ''}`}
                          onClick={() => setGraphPeriod('7d')}
                        >
                          7 Days
                        </button>
                        <button
                          className={`trend-toggle-btn ${graphPeriod === '30d' ? 'active' : ''}`}
                          onClick={() => setGraphPeriod('30d')}
                        >
                          30 Days
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* SVG Trend Line Component */}
                  <TrendLineGraph
                    data={graphPeriod === '30d' ? (stats.month_trend || []) : (stats.week_revenue || [])}
                    metric={graphMetric}
                    height={250}
                    strokeColor={graphMetric === 'revenue' ? '#fdf43b' : '#2196f3'}
                  />
                </div>

                <div className="analytics-row">
                  {/* Orders by status */}
                  <div className="admin-table-wrapper analytics-card">
                    <div className="admin-table-header">
                      <h3>🧭 Orders by Status</h3>
                    </div>
                    <div className="status-breakdown">
                      {(() => {
                        const total = Object.values(stats.status_counts || {}).reduce((a, b) => a + b, 0);
                        return statusOptions.map((opt) => {
                          const count = stats.status_counts?.[opt.value] || 0;
                          return (
                            <div className="status-bar-row" key={opt.value}>
                              <span className="status-bar-label">{opt.label}</span>
                              <div className="status-bar-track">
                                <div
                                  className="status-bar-fill"
                                  style={{ width: `${total ? (count / total) * 100 : 0}%`, background: opt.color }}
                                />
                              </div>
                              <span className="status-bar-count">{count}</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Top selling items */}
                  <div className="admin-table-wrapper analytics-card">
                    <div className="admin-table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3>🏆 Top Selling Items (30 days)</h3>
                      <button className="btn btn-outline btn-sm" onClick={() => handleDownloadExport('/admin/export/sales/', 'mcubes_sales_report.csv')}>
                        📥 Export Sales CSV
                      </button>
                    </div>
                    {stats.top_items?.length ? (
                      <ul className="top-items-list">
                        {stats.top_items.map((t, i) => (
                          <li key={t.name}>
                            <span className="top-item-rank">{i + 1}</span>
                            <div className="top-item-info">
                              <span className="top-item-name">{t.name}</span>
                              <span className="top-item-meta">
                                {t.quantity} sold · ₹{t.revenue.toLocaleString('en-IN')}
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        No sales in the last 30 days yet.
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ===== DATA DOWNLOADS TAB ===== */}
        {activeTab === 'export' && (
          <div className="data-export-container">
            <div className="export-intro-banner">
              <div className="export-banner-icon">📥</div>
              <div>
                <h2>Admin Data Download & Exports</h2>
                <p>Export cafe reports, order logs, customer data, and menu items directly into CSV spreadsheets for accounting and analysis.</p>
              </div>
            </div>

            <div className="export-cards-grid">
              {/* Card 1: Orders */}
              <div className="admin-table-wrapper export-card">
                <div className="export-card-header">
                  <div className="export-card-icon" style={{ background: 'rgba(253, 244, 59, 0.15)', color: 'var(--yellow)' }}>📦</div>
                  <div>
                    <h3>Orders Log CSV</h3>
                    <p className="export-card-subtitle">Full order records with customer details, order type, payment methods &amp; totals.</p>
                  </div>
                </div>
                <div className="export-card-body">
                  <div className="export-meta-pill">Includes: Order ID, Timestamp, Customer, WhatsApp, Status, Items Summary, Amount</div>
                </div>
                <div className="export-card-footer">
                  <button className="btn btn-primary" onClick={() => handleDownloadExport('/admin/export/orders/', 'mcubes_all_orders.csv')}>
                    📥 Download Orders CSV
                  </button>
                </div>
              </div>

              {/* Card 2: Menu */}
              <div className="admin-table-wrapper export-card">
                <div className="export-card-header">
                  <div className="export-card-icon" style={{ background: 'rgba(76, 175, 80, 0.15)', color: '#4caf50' }}>🍽️</div>
                  <div>
                    <h3>Menu Catalog CSV</h3>
                    <p className="export-card-subtitle">Complete menu item details, categories, prices, bestseller tags &amp; availability.</p>
                  </div>
                </div>
                <div className="export-card-body">
                  <div className="export-meta-pill">Includes: Item ID, Name, Category, Price, Bestseller, Veg/Non-Veg, Availability</div>
                </div>
                <div className="export-card-footer">
                  <button className="btn btn-primary" onClick={() => handleDownloadExport('/admin/export/menu/', 'mcubes_menu_catalog.csv')}>
                    📥 Download Menu CSV
                  </button>
                </div>
              </div>

              {/* Card 3: Sales Report */}
              <div className="admin-table-wrapper export-card">
                <div className="export-card-header">
                  <div className="export-card-icon" style={{ background: 'rgba(33, 150, 243, 0.15)', color: '#2196f3' }}>📊</div>
                  <div>
                    <h3>Sales &amp; Revenue Report CSV</h3>
                    <p className="export-card-subtitle">Comprehensive financial breakdown, 14-day daily trends, and top selling item rankings.</p>
                  </div>
                </div>
                <div className="export-card-body">
                  <div className="export-meta-pill">Includes: Total Revenue, Completed Orders Count, 14-Day Breakdown, Top Items</div>
                </div>
                <div className="export-card-footer">
                  <button className="btn btn-primary" onClick={() => handleDownloadExport('/admin/export/sales/', 'mcubes_sales_report.csv')}>
                    📥 Download Sales Report CSV
                  </button>
                </div>
              </div>

              {/* Card 4: Customers */}
              <div className="admin-table-wrapper export-card">
                <div className="export-card-header">
                  <div className="export-card-icon" style={{ background: 'rgba(156, 39, 176, 0.15)', color: '#ab47bc' }}>👥</div>
                  <div>
                    <h3>Customer Directory CSV</h3>
                    <p className="export-card-subtitle">Customer account listing, contact details, total orders placed, and lifetime spend.</p>
                  </div>
                </div>
                <div className="export-card-body">
                  <div className="export-meta-pill">Includes: User ID, Username, Email, Phone/WhatsApp, Joined Date, Total Spend</div>
                </div>
                <div className="export-card-footer">
                  <button className="btn btn-primary" onClick={() => handleDownloadExport('/admin/export/customers/', 'mcubes_customer_directory.csv')}>
                    📥 Download Customers CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
