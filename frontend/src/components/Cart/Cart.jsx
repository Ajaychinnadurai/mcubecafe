import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { Coffee, CupSoda, Sandwich, Cookie, Cake, IceCream, Utensils, Cherry, Dumbbell, ShoppingCart, Trash2, ArrowLeft, Plus, Check, Sparkles, Flame, Zap } from 'lucide-react';
import useDocumentTitle from '../../utils/useDocumentTitle';
import { getSmartRecommendations } from '../../utils/recommendations';
import '../Menu/Menu.css';
import './Cart.css';

const POPULAR_RECOMMENDATIONS = [
  { id: 314, name: 'Virgin Mojito', price: 49, categorySlug: 'mojito', is_bestseller: true, image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80', matchTag: 'Top Refreshment', description: 'Refreshing lime and fresh mint mojito' },
  { id: 344, name: 'Oreo Milkshake', price: 99, categorySlug: 'shakes', is_bestseller: true, image_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&q=80', matchTag: 'Bestseller Shake', description: 'Rich chocolate cookie milkshake' },
  { id: 402, name: 'Chicken Momos', price: 80, categorySlug: 'momos', is_bestseller: true, image_url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=400&q=80', matchTag: 'Crowd Favorite', description: 'Steamed spicy chicken stuffed momos' },
  { id: 449, name: 'Peri-Peri Masala Fries', price: 70, categorySlug: 'tasty-bites', is_bestseller: true, image_url: 'https://images.unsplash.com/photo-1630384060421-cb3f20e0649d?auto=format&fit=crop&w=400&q=80', matchTag: 'Perfect Side', description: 'Crispy potato fries tossed in fiery peri-peri' },
];

export default function Cart() {
  useDocumentTitle('Your Cart', 'Review your cart items and proceed to checkout at M Cube\'s Cafe.');
  const navigate = useNavigate();
  const { items, itemCount, subtotal, updateQuantity, removeItem, clearCart, addItem } = useCart();
  const { isAuthenticated, user } = useAuth();
  const [addedRecs, setAddedRecs] = useState({});

  // Dynamic recommendations powered by Purchase History & Cart Context (Only for Logged-In User ID)
  const dynamicRecommendations = useMemo(() => {
    return getSmartRecommendations(items, POPULAR_RECOMMENDATIONS, 4, user?.id);
  }, [items, user?.id]);

  const handleAddRec = (recItem, e) => {
    e.preventDefault();
    addItem(recItem);
    setAddedRecs(prev => ({ ...prev, [recItem.id]: true }));
    setTimeout(() => {
      setAddedRecs(prev => ({ ...prev, [recItem.id]: false }));
    }, 1200);
  };

  const handleQuickBuyRec = (recItem, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const itemToBuy = {
      id: recItem.id,
      name: recItem.name,
      price: recItem.price,
      image_url: recItem.image_url,
      quantity: 1,
    };
    navigate('/checkout', { state: { quickBuyItem: itemToBuy } });
  };

  const getIconForItem = (name) => {
    const lower = name.toLowerCase();
    const props = { size: 28, style: { color: 'var(--yellow)' } };
    if (lower.includes('coffee') || lower.includes('espresso') || lower.includes('cappuccino') || lower.includes('latte') || lower.includes('cold brew')) return <Coffee {...props} />;
    if (lower.includes('chai') || lower.includes('tea')) return <Coffee {...props} />;
    if (lower.includes('shake') || lower.includes('smoothie')) return <CupSoda {...props} />;
    if (lower.includes('sandwich') || lower.includes('wrap') || lower.includes('burger')) return <Sandwich {...props} />;
    if (lower.includes('fries') || lower.includes('samosa') || lower.includes('bread')) return <Cookie {...props} />;
    if (lower.includes('brownie') || lower.includes('cake') || lower.includes('cheesecake') || lower.includes('dessert')) return <Cake {...props} />;
    if (lower.includes('ice cream') || lower.includes('sundae')) return <IceCream {...props} />;
    if (lower.includes('gulab') || lower.includes('custard')) return <Cookie {...props} />;
    if (lower.includes('chicken') || lower.includes('meat')) return <Utensils {...props} />;
    if (lower.includes('oreo') || lower.includes('chocolate')) return <Cookie {...props} />;
    return <Utensils {...props} />;
  };

  if (items.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="cart-empty">
            <div className="cart-empty-icon" style={{ display: 'flex', justifyContent: 'center', color: 'var(--yellow)' }}>
              <ShoppingCart size={64} />
            </div>
            <h3 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Your Cart is Craving Great Food!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
              Don't let your stomach wait — treat yourself to our freshly brewed coffees, hot momos &amp; sizzling bites right now!
            </p>
            <Link to="/menu" className="btn btn-primary btn-lg" style={{ marginBottom: '2.5rem', fontWeight: 700, padding: '0.85rem 2rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <Utensils size={18} /> Explore Delicious Menu &amp; Order
            </Link>

            {/* Empty Cart Recommendations */}
            <div className="cart-recommendations-section">
              <div className="cart-rec-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Flame size={20} style={{ color: 'var(--yellow)' }} />
                <h3>Top Trending Bestsellers You Must Try!</h3>
              </div>
              <div className="menu-items-grid">
                {dynamicRecommendations.map(rec => (
                  <div key={rec.id} className="menu-item-card recommendation-card">
                    <div className="menu-item-info-col">
                      <div className="item-title-row">
                        <span className={`diet-dot ${rec.name.toLowerCase().includes('chicken') ? 'non-veg' : 'veg'}`} />
                        <h3 className="menu-item-name">{rec.name}</h3>
                      </div>
                      <div className="item-price-badge-row">
                        <span className="menu-item-price">₹{rec.price}</span>
                        <span className="recommendation-badge">{rec.matchTag}</span>
                      </div>
                      <p className="menu-item-desc">{rec.description}</p>
                    </div>
                    <div className="menu-item-media-col">
                      <div className="menu-item-img-container">
                        <img src={rec.image_url} alt={rec.name} className="menu-item-thumb" loading="lazy" />
                      </div>
                      <div className="menu-item-action-footer">
                        <button
                          className={`add-btn ${addedRecs[rec.id] ? 'added' : ''}`}
                          onClick={(e) => handleAddRec(rec, e)}
                        >
                          {addedRecs[rec.id] ? <><Check size={13} /> ADDED</> : <><Plus size={13} /> ADD</>}
                        </button>
                        <button
                          className="quick-buy-btn"
                          onClick={(e) => handleQuickBuyRec(rec, e)}
                        >
                          <Zap size={13} /> BUY NOW
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <button className="btn-page-back" onClick={() => navigate(-1)} title="Go Back">
          <ArrowLeft size={16} /> Back
        </button>
        <div className="section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 className="section-title" style={{ margin: 0, display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShoppingCart size={24} style={{ color: 'var(--yellow)' }} /> Your Order ({itemCount} {itemCount === 1 ? 'item' : 'items'})
            </h2>
            <button className="btn btn-outline btn-sm" onClick={clearCart}>
              <Trash2 size={16} /> Clear Cart
            </button>
          </div>

          <div className="cart-content">
            <div className="cart-items-list">
              {items.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-icon">{getIconForItem(item.name)}</div>
                  <div className="cart-item-details">
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-price">₹{item.price} each</div>
                  </div>
                  <div className="cart-item-controls">
                    <div className="quantity-controls">
                      <button className="quantity-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)}>−</button>
                      <span className="quantity-value">{item.quantity}</span>
                      <button className="quantity-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                    <span className="cart-item-total">₹{(item.price * item.quantity).toFixed(2)}</span>
                    <button className="remove-item-btn" onClick={() => removeItem(item.id)} title="Remove item">
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-summary">
              <h3>Order Summary</h3>
              <div className="summary-row">
                <span>Subtotal ({itemCount} items)</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Tax &amp; Service</span>
                <span style={{ color: '#22c55e', fontWeight: 600 }}>Included</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span className="amount">₹{subtotal.toFixed(2)}</span>
              </div>
              {isAuthenticated ? (
                <Link to="/checkout" className="btn btn-primary checkout-btn" style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Flame size={18} /> Complete Order Now — ₹{subtotal.toFixed(2)} →
                </Link>
              ) : (
                <Link to="/login?redirect=checkout" className="btn btn-primary checkout-btn" style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <Flame size={18} /> Login &amp; Claim Order — ₹{subtotal.toFixed(2)} →
                </Link>
              )}
            </div>
          </div>

          {/* Active Cart Recommendations */}
          <div className="cart-recommendations-section active-cart-recs">
            <div className="cart-rec-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Sparkles size={20} style={{ color: 'var(--yellow)' }} />
              <h3>Don't Miss Out! Frequently Ordered Together</h3>
            </div>
            <div className="menu-items-grid">
              {dynamicRecommendations.map(rec => (
                <div key={rec.id} className="menu-item-card recommendation-card">
                  <div className="menu-item-info-col">
                    <div className="item-title-row">
                      <span className={`diet-dot ${rec.name.toLowerCase().includes('chicken') ? 'non-veg' : 'veg'}`} />
                      <h3 className="menu-item-name">{rec.name}</h3>
                    </div>
                    <div className="item-price-badge-row">
                      <span className="menu-item-price">₹{rec.price}</span>
                      <span className="recommendation-badge">{rec.matchTag}</span>
                    </div>
                    <p className="menu-item-desc">{rec.description}</p>
                  </div>
                  <div className="menu-item-media-col">
                    <div className="menu-item-img-container">
                      <img src={rec.image_url} alt={rec.name} className="menu-item-thumb" loading="lazy" />
                    </div>
                    <div className="menu-item-action-footer">
                      <button
                        className={`add-btn ${addedRecs[rec.id] ? 'added' : ''}`}
                        onClick={(e) => handleAddRec(rec, e)}
                      >
                        {addedRecs[rec.id] ? <><Check size={13} /> ADDED</> : <><Plus size={13} /> ADD</>}
                      </button>
                      <button
                        className="quick-buy-btn"
                        onClick={(e) => handleQuickBuyRec(rec, e)}
                      >
                        <Zap size={13} /> BUY NOW
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
