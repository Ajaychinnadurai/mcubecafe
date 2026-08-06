import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import {
  PartyPopper, ClipboardList, Utensils, AlertCircle, ShoppingBag, CreditCard,
  Smartphone, Coins, Flame, Zap, ShieldCheck, ArrowRight, CheckCircle2, Phone, MessageSquare, Clock
} from 'lucide-react';
import api from '../../api/axios';
import useDocumentTitle from '../../utils/useDocumentTitle';
import { recordOrderHistory } from '../../utils/recommendations';
import './Checkout.css';

export default function Checkout() {
  useDocumentTitle('Express Checkout', 'Complete your order at M Cube\'s Cafe - Fast Dine-In or Takeaway.');
  const { items, subtotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const quickBuyItem = location.state?.quickBuyItem;

  // Determine items to checkout and subtotal
  const checkoutItems = quickBuyItem ? [quickBuyItem] : items;
  const checkoutSubtotal = quickBuyItem 
    ? Number(quickBuyItem.price) * (quickBuyItem.quantity || 1)
    : subtotal;

  const [orderType, setOrderType] = useState('dine_in');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  const [whatsappNumber, setWhatsappNumber] = useState(user?.whatsapp_number || '');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(null);

  const handlePlaceOrder = async () => {
    if (checkoutItems.length === 0) return;

    setLoading(true);
    setError(null);

    try {
      const formattedItems = checkoutItems
        .map((item) => {
          const rawId = item.id || item.menu_item_id || item.menu_item;
          const parsedId = typeof rawId === 'number' ? rawId : parseInt(rawId, 10);
          return {
            menu_item_id: isNaN(parsedId) ? null : parsedId,
            quantity: parseInt(item.quantity, 10) || 1,
          };
        })
        .filter((item) => item.menu_item_id !== null);

      if (formattedItems.length === 0) {
        setError('Your cart does not contain valid menu items. Please clear your cart and re-add items from the menu.');
        setLoading(false);
        return;
      }

      const response = await api.post('/orders/create/', {
        items: formattedItems,
        order_type: orderType,
        payment_method: paymentMethod,
        whatsapp_number: whatsappNumber,
        notes: notes,
      });

      const order = response.data;
      recordOrderHistory(checkoutItems, user?.id);
      if (!quickBuyItem) {
        clearCart();
      }

      // Always navigate directly to Menu page (http://localhost:5173/menu) with order success state
      navigate('/menu', { state: { orderPlaced: true, orderId: order.id, totalAmount: checkoutSubtotal } });
    } catch (err) {
      console.error('Order placement failed:', err.response?.data || err.message);
      const errorData = err.response?.data;

      let msg = 'Failed to place order. Please try again.';
      if (typeof errorData === 'string') {
        msg = errorData;
      } else if (typeof errorData === 'object' && errorData !== null) {
        if (typeof errorData.error === 'string') msg = errorData.error;
        else if (typeof errorData.detail === 'string') msg = errorData.detail;
        else {
          const findFirstStr = (obj) => {
            if (typeof obj === 'string') return obj;
            if (Array.isArray(obj)) {
              for (const elem of obj) {
                const found = findFirstStr(elem);
                if (found) return found;
              }
            } else if (typeof obj === 'object' && obj !== null) {
              for (const key of Object.keys(obj)) {
                const found = findFirstStr(obj[key]);
                if (found) return found;
              }
            }
            return null;
          };
          msg = findFirstStr(errorData) || msg;
        }
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="order-success-card">
            <div className="success-badge-pulse">
              <PartyPopper size={48} className="success-icon-svg" />
            </div>
            <h2>Order Placed Successfully! 🎉</h2>
            <p className="order-id-badge">Order Token #{orderSuccess.orderId}</p>
            <p className="success-msg-text">{orderSuccess.message}</p>
            
            <div className="success-prep-banner">
              <Clock size={16} /> <span>Prep Time: ~10 Minutes • Served Fresh at Counter</span>
            </div>

            {orderSuccess.bill && (
              <div className="order-actions-row">
                <button className="btn btn-primary" onClick={() => navigate('/orders')}>
                  <ClipboardList size={18} /> Track Order Status
                </button>
                <button className="btn btn-secondary" onClick={() => navigate('/menu')}>
                  <Utensils size={18} /> Order More Food
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (checkoutItems.length === 0) {
    navigate('/cart');
    return null;
  }

  const totalItemCount = checkoutItems.reduce((s, i) => s + (i.quantity || 1), 0);

  return (
    <div className="checkout-page">
      <div className="container">
        {/* Express Checkout Header */}
        <div className="checkout-express-header">
          <div className="express-title-wrap">
            <h1 className="checkout-main-title">
              <Zap size={28} style={{ color: 'var(--yellow)' }} /> Express Checkout
            </h1>
            {quickBuyItem ? (
              <span className="express-badge" style={{ background: 'rgba(34, 197, 94, 0.15)', color: '#86efac', borderColor: 'rgba(34, 197, 94, 0.3)' }}>
                ⚡ Quick Buy ({quickBuyItem.name})
              </span>
            ) : (
              <span className="express-badge">1-Tap Quick Order</span>
            )}
          </div>

          <div className="checkout-steps-bar">
            <div className="step-item active">
              <span className="step-num">1</span>
              <span className="step-label">Dining</span>
            </div>
            <div className="step-divider" />
            <div className="step-item active">
              <span className="step-num">2</span>
              <span className="step-label">Payment</span>
            </div>
            <div className="step-divider" />
            <div className="step-item">
              <span className="step-num">3</span>
              <span className="step-label">Enjoy!</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="checkout-error-banner">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="checkout-modern-grid">
          {/* Left Column: Form & Preferences */}
          <div className="checkout-main-card">
            {/* 1. Dining Preference */}
            <div className="checkout-block">
              <div className="block-header">
                <Utensils size={18} style={{ color: 'var(--yellow)' }} />
                <h3>1. Select Order Type</h3>
              </div>

              <div className="order-type-segmented-grid">
                <button
                  type="button"
                  className={`segmented-card ${orderType === 'dine_in' ? 'active' : ''}`}
                  onClick={() => setOrderType('dine_in')}
                >
                  <div className="segmented-icon-box">
                    <Utensils size={24} />
                  </div>
                  <div className="segmented-info">
                    <span className="segmented-title">Dine In</span>
                    <span className="segmented-sub">Eat at Cafe Table</span>
                  </div>
                  {orderType === 'dine_in' && <CheckCircle2 size={18} className="active-check" />}
                </button>

                <button
                  type="button"
                  className={`segmented-card ${orderType === 'takeaway' ? 'active' : ''}`}
                  onClick={() => setOrderType('takeaway')}
                >
                  <div className="segmented-icon-box">
                    <ShoppingBag size={24} />
                  </div>
                  <div className="segmented-info">
                    <span className="segmented-title">Takeaway / Parcel</span>
                    <span className="segmented-sub">Pack for Pickup</span>
                  </div>
                  {orderType === 'takeaway' && <CheckCircle2 size={18} className="active-check" />}
                </button>
              </div>
            </div>

            {/* 2. Payment Method */}
            <div className="checkout-block">
              <div className="block-header">
                <CreditCard size={18} style={{ color: 'var(--yellow)' }} />
                <h3>2. Select Payment Method</h3>
              </div>

              <div className="payment-segmented-grid">
                <button
                  type="button"
                  className={`payment-card ${paymentMethod === 'upi' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('upi')}
                >
                  <div className="payment-card-top">
                    <Smartphone size={24} className="pay-icon" />
                    <span className="pay-title">UPI / QR Code</span>
                    {paymentMethod === 'upi' && <CheckCircle2 size={18} className="active-check" />}
                  </div>
                  <p className="pay-desc">GPay, PhonePe, Paytm, BHIM</p>
                  <span className="fast-tag">⚡ Instant Confirmation</span>
                </button>

                <button
                  type="button"
                  className={`payment-card ${paymentMethod === 'cash' ? 'active' : ''}`}
                  onClick={() => setPaymentMethod('cash')}
                >
                  <div className="payment-card-top">
                    <Coins size={24} className="pay-icon" />
                    <span className="pay-title">Cash at Counter</span>
                    {paymentMethod === 'cash' && <CheckCircle2 size={18} className="active-check" />}
                  </div>
                  <p className="pay-desc">Pay cash when receiving food</p>
                  <span className="counter-tag">💵 Pay at Counter</span>
                </button>
              </div>
            </div>

            {/* 3. WhatsApp & Special Notes */}
            <div className="checkout-block">
              <div className="block-header">
                <Phone size={18} style={{ color: 'var(--yellow)' }} />
                <h3>3. Receipt &amp; Customization</h3>
              </div>

              <div className="inputs-dual-grid">
                <div className="input-field-wrap">
                  <label className="input-label">
                    <MessageSquare size={14} style={{ color: 'var(--yellow)' }} /> WhatsApp Mobile (e-Bill)
                  </label>
                  <input
                    type="text"
                    className="modern-checkout-input"
                    placeholder="Enter 10-digit phone number"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                  />
                </div>

                <div className="input-field-wrap">
                  <label className="input-label">
                    <Flame size={14} style={{ color: 'var(--yellow)' }} /> Special Kitchen Request
                  </label>
                  <input
                    type="text"
                    className="modern-checkout-input"
                    placeholder="e.g. Extra spicy, less ice..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sleek Receipt Summary */}
          <div className="checkout-sidebar-card">
            <div className="sidebar-header">
              <h3>Order Receipt</h3>
              <span className="item-count-badge">{totalItemCount} Items</span>
            </div>

            <div className="sidebar-items-list">
              {checkoutItems.map((item) => (
                <div key={item.id} className="sidebar-item-row">
                  <img src={item.image_url || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=120&q=80'} alt={item.name} className="sidebar-item-thumb" />
                  <div className="sidebar-item-info">
                    <span className="sidebar-item-name">{item.name}</span>
                    <span className="sidebar-item-meta">₹{item.price} × {item.quantity || 1}</span>
                  </div>
                  <span className="sidebar-item-subtotal">₹{(item.price * (item.quantity || 1)).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="sidebar-pricing-breakdown">
              <div className="price-row">
                <span>Subtotal</span>
                <span>₹{checkoutSubtotal.toFixed(2)}</span>
              </div>
              <div className="price-row">
                <span>GST &amp; Taxes</span>
                <span className="included-tag">Included</span>
              </div>
              <div className="price-row total-row">
                <span>Total Amount</span>
                <span className="total-amount">₹{checkoutSubtotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="sidebar-guarantee-pill">
              <ShieldCheck size={16} style={{ color: '#22c55e' }} />
              <span>100% Fresh Daily Ingredients • Served Hot</span>
            </div>

            <button
              className="express-submit-btn"
              onClick={handlePlaceOrder}
              disabled={loading}
            >
              {loading ? (
                <><span className="spinner"></span> Processing Order...</>
              ) : (
                <>
                  <span>CONFIRM ORDER</span>
                  <span className="submit-price-pill">₹{checkoutSubtotal.toFixed(2)} <ArrowRight size={16} /></span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Dock for Mobile Easy Ordering */}
      <div className="mobile-checkout-sticky-dock">
        <div className="dock-price-info">
          <span className="dock-total-label">Total ({totalItemCount} Items)</span>
          <span className="dock-total-val">₹{checkoutSubtotal.toFixed(2)}</span>
        </div>
        <button
          className="dock-submit-btn"
          onClick={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'PLACE ORDER ⚡'}
        </button>
      </div>
    </div>
  );
}
