import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { ShoppingCart, ChevronDown, LayoutDashboard, ClipboardList, LogOut, Home, UtensilsCrossed, Image as GalleryIcon, Phone, User, Search } from 'lucide-react';
import NotificationBell from '../NotificationBell/NotificationBell';
import './Navbar.css';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);

    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setProfileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    setProfileOpen(false);
    navigate('/');
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Menu', path: '/menu' },
    { label: 'Gallery', path: '/gallery' },
    { label: 'Contact', path: '/contact' },
  ];

  const isHomeActive = location.pathname === '/' && !location.hash;
  const isMenuActive = location.pathname === '/menu';
  const isGalleryActive = location.pathname === '/gallery';
  const isContactActive = location.pathname === '/contact';
  const isAuthPage = ['/login', '/signup', '/admin/login'].includes(location.pathname);

  return (
    <>
      <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
        <div className="navbar-container container">
          <Link 
            to="/" 
            className="navbar-brand" 
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem' }}
          >
            <img src="/logo.png" alt="M Cube's Cafe Logo" className="navbar-logo-img" style={{ width: '42px', height: '42px', objectFit: 'contain' }} />
            <span className="brand-text">Mcubes</span>
          </Link>

          {/* Desktop Navigation Links (Hidden on Mobile) */}
          <div className="navbar-desktop-links">
            {navLinks.map((link) => (
              <Link key={link.label} to={link.path} className="nav-link">
                {link.label}
              </Link>
            ))}
          </div>

          {/* Header Action Items (Cart + Notifications + Profile/Auth) */}
          <div className="navbar-right-actions">
            {/* Login Button when logged out */}
            {!isAuthenticated && !isAuthPage && (
              <Link to="/login" className="btn btn-primary btn-sm nav-auth-single-btn">
                Login
              </Link>
            )}

            {/* Cart Icon in Header */}
            {!isAdmin && !location.pathname.startsWith('/admin') && (
              <Link to="/cart" className="nav-cart-icon" title="View Cart">
                <ShoppingCart size={20} />
                {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
              </Link>
            )}

            {/* Notification Bell */}
            {isAuthenticated && <NotificationBell />}

            {/* Profile Dropdown if logged in */}
            {isAuthenticated && (
              <div className="nav-profile" ref={profileRef}>
                <button className="nav-profile-btn" onClick={() => setProfileOpen(!profileOpen)}>
                  <span className={`avatar ${user?.avatar ? 'has-avatar-img' : ''}`}>
                    {user?.avatar ? (
                      <img src={user.avatar} alt={`${user?.username || 'user'} avatar`} className="avatar-img" />
                    ) : (
                      user?.username?.[0]?.toUpperCase() || 'U'
                    )}
                  </span>
                  <span className="nav-username">{user?.username}</span>
                  <ChevronDown size={14} className="dropdown-arrow-icon" style={{ marginLeft: '0.15rem', transition: 'transform 0.3s' }} />
                </button>
                {profileOpen && (
                  <div className="dropdown-menu">
                  <div className="dropdown-header">
                    {user?.avatar && (
                      <img src={user.avatar} alt="" className="dropdown-avatar" />
                    )}
                    <span className="dropdown-email">{user?.email || user?.phone_number}</span>
                    <span className={`dropdown-role badge ${isAdmin ? 'badge-yellow' : 'badge-green'}`}>
                      {user?.role}
                    </span>
                  </div>
                    <Link to="/profile" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                      <User size={16} className="icon-inline" /> My Profile
                    </Link>
                    {isAdmin ? (
                      <Link to="/admin-dashboard" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                        <LayoutDashboard size={16} className="icon-inline" /> Dashboard
                      </Link>
                    ) : (
                      <Link to="/orders" className="dropdown-item" onClick={() => setProfileOpen(false)}>
                        <ClipboardList size={16} className="icon-inline" /> My Orders
                      </Link>
                    )}
                    <hr className="dropdown-divider" />
                    <button className="dropdown-item dropdown-logout" onClick={handleLogout}>
                      <LogOut size={16} className="icon-inline" /> Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar with Icons */}
      <div className="mobile-bottom-nav">
        <Link to="/" className={`mobile-bottom-item ${isHomeActive ? 'active' : ''}`}>
          <Home size={20} />
          <span>Home</span>
        </Link>
        <Link to="/menu" className={`mobile-bottom-item ${isMenuActive ? 'active' : ''}`}>
          <UtensilsCrossed size={20} />
          <span>Menu</span>
        </Link>
        <Link to="/gallery" className={`mobile-bottom-item ${isGalleryActive ? 'active' : ''}`}>
          <GalleryIcon size={20} />
          <span>Gallery</span>
        </Link>
        <Link to="/contact" className={`mobile-bottom-item ${isContactActive ? 'active' : ''}`}>
          <Phone size={20} />
          <span>Contact</span>
        </Link>
      </div>
    </>
  );
}
