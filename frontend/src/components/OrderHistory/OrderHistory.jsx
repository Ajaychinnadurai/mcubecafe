import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../contexts/AuthContext';
import { syncUserBackendOrders } from '../../utils/recommendations';
import {
  Clock, Coins, CheckCircle, ChefHat, Sparkles, XCircle, Lock, AlertCircle,
  ClipboardList, Utensils, ShoppingBag, Smartphone, FileText, Download, Printer, X, Eye, ArrowRight
} from 'lucide-react';
import './OrderHistory.css';

const statusColors = {
  pending_payment: { bg: 'rgba(255, 152, 0, 0.15)', color: '#ff9800', icon: <Clock size={14} /> },
  pending_counter: { bg: 'rgba(255, 152, 0, 0.15)', color: '#ff9800', icon: <Coins size={14} /> },
  paid: { bg: 'rgba(76, 175, 80, 0.15)', color: '#4caf50', icon: <CheckCircle size={14} /> },
  preparing: { bg: 'rgba(33, 150, 243, 0.15)', color: '#2196f3', icon: <ChefHat size={14} /> },
  ready: { bg: 'rgba(253, 244, 59, 0.15)', color: '#fdf43b', icon: <Sparkles size={14} /> },
  completed: { bg: 'rgba(76, 175, 80, 0.15)', color: '#4caf50', icon: <CheckCircle size={14} /> },
  cancelled: { bg: 'rgba(229, 57, 53, 0.15)', color: '#e53935', icon: <XCircle size={14} /> },
};

const ORDER_STEPS = [
  { key: 'placed', label: 'Placed', icon: Clock },
  { key: 'paid', label: 'Payment', icon: Coins },
  { key: 'preparing', label: 'Preparing', icon: ChefHat },
  { key: 'ready', label: 'Ready', icon: Sparkles },
  { key: 'completed', label: 'Completed', icon: CheckCircle },
];

function getStepIndex(status) {
  switch (status) {
    case 'pending_payment':
      return 0;
    case 'pending_counter':
      return 1;
    case 'paid':
      return 1;
    case 'preparing':
      return 2;
    case 'ready':
      return 3;
    case 'completed':
      return 4;
    case 'cancelled':
      return -1;
    default:
      return 0;
  }
}

export default function OrderHistory() {
  const { isAuthenticated, user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal States
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [loadingBill, setLoadingBill] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await api.get('/orders/my/');
        setOrders(response.data);
        if (user?.id) {
          syncUserBackendOrders(user.id, response.data);
        }
      } catch (err) {
        setError('Failed to load your orders.');
      } finally {
        setLoading(false);
      }
    };
    if (isAuthenticated) {
      fetchOrders();
    }
  }, [isAuthenticated, user?.id]);

  // Prevent background page scrolling & extra bottom space when modal is open
  useEffect(() => {
    if (selectedOrderDetail || selectedBill) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedOrderDetail, selectedBill]);

  const handleDownloadBill = async (orderId, e) => {
    if (e) e.stopPropagation();
    try {
      setDownloadingId(orderId);
      const res = await api.get(`/orders/${orderId}/bill/download/`, {
        responseType: 'blob',
      });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Mcube_Bill_#${orderId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch {
      alert('Could not download bill. Please try again later.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handleOpenBillModal = async (orderId, e) => {
    if (e) e.stopPropagation();
    try {
      setSelectedBill({ loading: true, order_id: orderId });
      const res = await api.get(`/orders/${orderId}/bill/`);
      setSelectedBill(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to load digital bill receipt.');
      setSelectedBill(null);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="orders-page">
        <div className="container">
          <div className="orders-empty">
            <div className="orders-empty-icon" style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <Lock size={64} />
            </div>
            <h3>Login Required</h3>
            <p>Please log in to view your order history and bills.</p>
            <Link to="/login" className="btn btn-primary">Login</Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="orders-page">
        <div className="container">
          <div className="orders-loading">
            <div className="loading-container">
              <div className="spinner spinner-lg"></div>
              <p>Loading your orders...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-page">
        <div className="container">
          <div className="orders-empty">
            <div className="orders-empty-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--error)' }}>
              <AlertCircle size={20} />
              <p style={{ margin: 0 }}>{error}</p>
            </div>
            <button className="btn btn-outline" style={{ marginTop: '1rem' }} onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="orders-page">
        <div className="container">
          <div className="orders-empty">
            <div className="orders-empty-icon" style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-muted)' }}>
              <ClipboardList size={64} />
            </div>
            <h3>No orders yet</h3>
            <p>You haven't placed any orders yet. Time to explore our delicious menu!</p>
            <Link to="/menu" className="btn btn-primary"><Utensils size={18} /> Browse Menu</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="container">
        <div className="section">
          <div className="orders-header-row">
            <div>
              <h2 className="section-title">My Orders</h2>
              <p className="section-subtitle">Track live status, view order details & download cafe bills.</p>
            </div>
          </div>

          <div className="orders-list">
            {orders.map((order) => {
              const statusStyle = statusColors[order.status] || statusColors.completed;
              const isDownloading = downloadingId === order.id;

              return (
                <div key={order.id} className="order-card">
                  <div className="order-header">
                    <div>
                      <span className="order-id">Order #{order.id}</span>
                      <span className="order-date" style={{ marginLeft: '0.75rem' }}>
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <span
                      className="order-status-badge"
                      style={{ background: statusStyle.bg, color: statusStyle.color }}
                    >
                      {statusStyle.icon} {order.status_display || order.status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="order-items">
                    {order.items?.map((item, i) => (
                      <div key={i} className="order-item-row">
                        <span className="order-item-name">{item.item_name}</span>
                        <span className="order-item-qty">× {item.quantity}</span>
                        <span className="order-item-price">₹{item.subtotal || (item.price_at_order * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="order-total">
                    <span>Total Amount</span>
                    <span className="amount">₹{order.total_amount}</span>
                  </div>

                  <div className="order-card-footer">
                    <span className="order-payment-method">
                      {order.payment_method === 'upi' ? (
                        <><Smartphone size={14} style={{ color: 'var(--yellow)' }} /> Online (UPI)</>
                      ) : (
                        <><Coins size={14} style={{ color: 'var(--yellow)' }} /> Cash at Counter</>
                      )}
                      {' • '}
                      {order.order_type === 'dine_in' ? (
                        <><Utensils size={14} /> Dine In</>
                      ) : (
                        <><ShoppingBag size={14} /> Takeaway</>
                      )}
                    </span>

                    <div className="order-actions-wrap">
                      <button
                        className="btn-order-action btn-bill"
                        onClick={(e) => handleOpenBillModal(order.id, e)}
                        title="View Digital Receipt Bill"
                      >
                        <FileText size={15} /> Bill
                      </button>

                      <button
                        className="btn-order-action btn-pdf"
                        onClick={(e) => handleDownloadBill(order.id, e)}
                        disabled={isDownloading}
                        title="Download PDF Bill"
                      >
                        {isDownloading ? (
                          <div className="spinner spinner-xs" />
                        ) : (
                          <Download size={15} />
                        )}
                        PDF
                      </button>

                      <button
                        className="btn-order-action btn-details"
                        onClick={() => setSelectedOrderDetail(order)}
                        title="View Full Order Details"
                      >
                        <Eye size={15} /> Details <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================= ORDER DETAILS MODAL ================= */}
      {selectedOrderDetail && (
        <div className="order-modal-backdrop" onClick={() => setSelectedOrderDetail(null)}>
          <div className="order-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="order-modal-header">
              <div className="modal-title-group">
                <h3>Order #{selectedOrderDetail.id}</h3>
                <span className="modal-date">
                  {new Date(selectedOrderDetail.created_at).toLocaleString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <button className="order-modal-close" onClick={() => setSelectedOrderDetail(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="order-modal-body">
              {/* Order Status Timeline Stepper */}
              <div className="order-stepper-wrap">
                <span className="stepper-title">Order Status Tracker</span>
                {selectedOrderDetail.status === 'cancelled' ? (
                  <div className="cancelled-alert">
                    <XCircle size={18} /> Order has been cancelled.
                  </div>
                ) : (
                  <div className="stepper-timeline">
                    {ORDER_STEPS.map((step, idx) => {
                      const currentIdx = getStepIndex(selectedOrderDetail.status);
                      const isCompleted = idx <= currentIdx;
                      const isCurrent = idx === currentIdx;
                      const StepIcon = step.icon;

                      return (
                        <div
                          key={step.key}
                          className={`stepper-node ${isCompleted ? 'completed' : ''} ${isCurrent ? 'active' : ''}`}
                        >
                          <div className="stepper-icon-circle">
                            <StepIcon size={16} />
                          </div>
                          <span className="stepper-label">{step.label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Items Table */}
              <div className="modal-section-box">
                <h4 className="modal-box-title">Itemized Order Summary</h4>
                <div className="modal-items-table">
                  {selectedOrderDetail.items?.map((item, idx) => (
                    <div key={idx} className="modal-item-row">
                      <div className="modal-item-info">
                        <span className="modal-item-name">{item.item_name}</span>
                        <span className="modal-item-meta">₹{item.price_at_order} × {item.quantity}</span>
                      </div>
                      <span className="modal-item-total">₹{item.subtotal || (item.price_at_order * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Calculation Summary */}
              <div className="modal-summary-box">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₹{selectedOrderDetail.total_amount}</span>
                </div>
                <div className="summary-row">
                  <span>GST & Taxes (Included)</span>
                  <span>₹0.00</span>
                </div>
                <div className="summary-row grand-total">
                  <span>Grand Total</span>
                  <span>₹{selectedOrderDetail.total_amount}</span>
                </div>
              </div>

              {/* Payment & Order Type Meta Details */}
              <div className="modal-meta-grid">
                <div className="meta-card">
                  <span className="meta-label">Payment Method</span>
                  <span className="meta-value">
                    {selectedOrderDetail.payment_method === 'upi' ? 'Online UPI' : 'Cash at Counter'}
                  </span>
                </div>
                <div className="meta-card">
                  <span className="meta-label">Order Type</span>
                  <span className="meta-value">
                    {selectedOrderDetail.order_type === 'dine_in' ? 'Dine In' : 'Takeaway'}
                  </span>
                </div>
              </div>
            </div>

            <div className="order-modal-footer">
              <button
                className="btn btn-outline"
                onClick={(e) => handleOpenBillModal(selectedOrderDetail.id, e)}
              >
                <FileText size={16} /> View Digital Bill
              </button>
              <button
                className="btn btn-yellow"
                onClick={(e) => handleDownloadBill(selectedOrderDetail.id, e)}
              >
                <Download size={16} /> Download Bill PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DIGITAL RECEIPT BILL MODAL ================= */}
      {selectedBill && (
        <div className="order-modal-backdrop" onClick={() => setSelectedBill(null)}>
          <div className="receipt-modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="order-modal-close receipt-close" onClick={() => setSelectedBill(null)}>
              <X size={20} />
            </button>

            {selectedBill.loading ? (
              <div className="receipt-loading">
                <div className="spinner spinner-md" />
                <p>Generating digital bill receipt...</p>
              </div>
            ) : (
              <div className="receipt-paper" id="digital-receipt-content">
                {/* Cafe Header Logo */}
                <div className="receipt-header">
                  <h2 className="receipt-cafe-title">M CUBE'S CAFE</h2>
                  <p className="receipt-tagline">Quality Coffee, Quick Bites & Great Memories</p>
                  <div className="receipt-divider" />
                  <div className="receipt-meta-row">
                    <span><strong>Invoice #:</strong> MCUBE-{selectedBill.order_id}</span>
                    <span><strong>Date:</strong> {selectedBill.date}</span>
                  </div>
                </div>

                {/* Items List */}
                <table className="receipt-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th style={{ textAlign: 'center' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBill.items?.map((item, i) => (
                      <tr key={i}>
                        <td>{item.name || item.item_name}</td>
                        <td style={{ textAlign: 'center' }}>×{item.quantity}</td>
                        <td style={{ textAlign: 'right' }}>₹{Number(item.subtotal).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="receipt-divider" />

                {/* Totals */}
                <div className="receipt-total-block">
                  <div className="receipt-total-row">
                    <span>Total Paid ({selectedBill.payment_method?.toUpperCase()})</span>
                    <span className="receipt-total-val">₹{Number(selectedBill.total_amount ?? selectedBill.total ?? 0).toFixed(2)}</span>
                  </div>
                </div>

                <div className="receipt-footer">
                  <p>✨ Thank you for visiting M Cube's Cafe! ✨</p>
                  <p className="receipt-small">Please present this receipt at the counter if required.</p>
                </div>

                {/* Actions */}
                <div className="receipt-actions no-print">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => window.print()}
                  >
                    <Printer size={14} /> Print
                  </button>
                  <button
                    className="btn btn-yellow btn-sm"
                    onClick={(e) => handleDownloadBill(selectedBill.order_id, e)}
                  >
                    <Download size={14} /> Download PDF
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
