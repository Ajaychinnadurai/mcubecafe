import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { ShoppingCart, ArrowRight, Flame } from 'lucide-react';
import './FloatingCartButton.css';

export default function FloatingCartButton() {
  const { itemCount, subtotal } = useCart();
  const { isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Hide floating cart bar if:
  // 1. Admin user
  // 2. Cart is empty (itemCount === 0)
  // 3. User is on Cart, Checkout, Payment, or Admin pages
  const hiddenRoutes = ['/cart', '/checkout', '/payment'];
  if (
    isAdmin ||
    itemCount === 0 ||
    hiddenRoutes.includes(location.pathname) ||
    location.pathname.startsWith('/admin')
  ) {
    return null;
  }

  return (
    <div className="unified-floating-cart-bar">
      <div className="cart-bar-left">
        <div className="cart-bar-icon-wrap">
          <ShoppingCart size={20} />
          <span className="cart-bar-badge">{itemCount}</span>
        </div>
        <div className="cart-bar-details">
          <span className="cart-bar-items-count">
            {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
          </span>
          <span className="cart-bar-price">₹{subtotal.toFixed(2)}</span>
        </div>
      </div>

      <div className="cart-bar-right-actions">
        <Link to="/cart" className="cart-bar-btn cart-bar-view-btn">
          View Cart
        </Link>
        <button
          onClick={() => navigate('/checkout')}
          className="cart-bar-btn cart-bar-buy-btn"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          <Flame size={16} />
          <span>CLAIM &amp; BUY NOW</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
