import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import { useCart } from '../../contexts/CartContext';
import { PartyPopper, Receipt, Smartphone, ClipboardList, Utensils, AlertCircle, CreditCard, CheckCircle } from 'lucide-react';
import './Payment.css';

export default function Payment() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const orderId = searchParams.get('order_id');
  const method = searchParams.get('method');

  const [orderDetails, setOrderDetails] = useState(null);
  const [upiData, setUpiData] = useState(null);
  const [stripeSecret, setStripeSecret] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [transactionRef, setTransactionRef] = useState('');


  useEffect(() => {
    if (!orderId || !method) {
      navigate('/cart');
      return;
    }

    const initPayment = async () => {
      try {
        setLoading(true);

        // Get order details
        const orderRes = await api.get(`/orders/${orderId}/`);
        setOrderDetails(orderRes.data);

        if (method === 'upi') {
          const upiRes = await api.post('/orders/pay/upi/', { order_id: parseInt(orderId) });
          setUpiData(upiRes.data);
          setTransactionRef(upiRes.data.transaction_ref);
        }
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to initialize payment.');
      } finally {
        setLoading(false);
      }
    };

    clearCart();
    initPayment();
  }, [orderId, method, navigate, clearCart]);

  const handleStripePayment = async () => {
    setProcessing(true);
    setError(null);

    try {
      // For demo: simulate Stripe payment confirmation
      const response = await api.post('/orders/pay/stripe/confirm/', {
        order_id: parseInt(orderId),
        payment_intent_id: stripeSecret ? stripeSecret.split('_secret')[0] : `pi_demo_${orderId}`,
      });

      if (response.data.success) {
        setSuccess({
          orderId: orderId,
          message: 'Payment successful! Your order is being prepared.',
          bill: response.data.bill,
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const handleUpiConfirm = async () => {
    setProcessing(true);
    setError(null);

    try {
      const response = await api.post('/orders/pay/upi/confirm/', {
        order_id: parseInt(orderId),
        transaction_ref: transactionRef,
      });

      if (response.data.success) {
        setSuccess({
          orderId: orderId,
          message: 'UPI payment confirmed! Your order is being prepared.',
          bill: response.data.bill,
        });
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to confirm payment.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="payment-page">
        <div className="payment-container">
          <div className="loading-container">
            <div className="spinner spinner-lg"></div>
            <p>Preparing payment...</p>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="payment-page">
        <div className="payment-container">
          <div className="payment-card">
            <div className="payment-success">
              <div className="payment-success-icon" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: 'var(--yellow)' }}>
                <PartyPopper size={64} />
              </div>
              <h2>Payment Successful!</h2>
              <p>Order #{success.orderId}</p>
              <p>{success.message}</p>
              {success.bill && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--dark-gray)', borderRadius: 'var(--border-radius-sm)', textAlign: 'left' }}>
                  <h4 style={{ color: 'var(--yellow)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Receipt size={16} /> Bill Summary
                  </h4>
                  {success.bill.items?.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', padding: '0.2rem 0' }}>
                      <span>{item.name} × {item.quantity}</span>
                      <span>₹{item.subtotal}</span>
                    </div>
                  ))}
                  <div style={{ borderTop: '1px solid var(--dark-gray)', marginTop: '0.5rem', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--yellow)' }}>
                    <span>Total</span>
                    <span>₹{success.bill.total}</span>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <Smartphone size={14} /> Bill will be sent to your WhatsApp number.
                  </p>
                </div>
              )}
              <div className="payment-actions">
                <Link to="/orders" className="btn btn-primary"><ClipboardList size={18} /> My Orders</Link>
                <Link to="/menu" className="btn btn-secondary"><Utensils size={18} /> Order More</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-container">
        <button className="back-btn" onClick={() => navigate('/checkout')}>
          ← Back to Checkout
        </button>

        <div className="payment-card">
          <h2>Complete Payment</h2>
          <p className="subtitle">Order #{orderId}</p>

          {error && (
            <div className="payment-error" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
              <AlertCircle size={16} /> {error}
            </div>
          )}

          <div className="payment-amount">
            <div className="payment-amount-label">Amount to Pay</div>
            <div className="payment-amount-value">
              ₹{orderDetails?.total_amount || '...'}
            </div>
          </div>

          {method === 'stripe' && (
            <div className="stripe-form-container">
              <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                  <CreditCard size={16} /> Test Mode — Click "Pay Now" to simulate card payment
                </p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  [TODO: Integrate Stripe Elements for real card input]
                </p>
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', justifyContent: 'center' }}
                onClick={handleStripePayment}
                disabled={processing}
              >
                {processing ? (
                  <><span className="spinner"></span> Processing...</>
                ) : (
                  <><CreditCard size={18} /> Pay ₹{orderDetails?.total_amount || '...'}</>
                )}
              </button>
            </div>
          )}

          {method === 'upi' && upiData && (
            <div className="upi-section">
              <div className="upi-qr-container">
                <img src={upiData.qr_code} alt="UPI QR Code" className="upi-qr-code" />
              </div>
              <div className="upi-details">
                <p>Scan the QR code with any UPI app</p>
                <p className="upi-id">{upiData.upi_id}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Payee: {upiData.payee_name} | ₹{upiData.amount}
                </p>
              </div>

              <a
                href={upiData.upi_link}
                className="upi-pay-btn"
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}
                onClick={() => {
                  // After user pays via UPI app, they come back and confirm
                  setTimeout(() => {
                    document.getElementById('upi-confirm-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 500);
                }}
              >
                <Smartphone size={16} /> Pay via UPI
              </a>

              <div id="upi-confirm-section" className="upi-manual-confirm">
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
                  Already paid? Click below to confirm your payment.
                </p>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={handleUpiConfirm}
                  disabled={processing}
                >
                  {processing ? (
                    <><span className="spinner"></span> Confirming...</>
                  ) : (
                    <><CheckCircle size={16} /> I've Paid — Confirm</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
