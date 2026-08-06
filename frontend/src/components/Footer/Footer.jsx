import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer" id="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <img src="/logo.png" alt="M Cube's Cafe Logo" style={{ width: '46px', height: '46px', objectFit: 'contain' }} />
              <h3 style={{ margin: 0 }}>Mcubes Cafe</h3>
            </div>
            <p>
              Coffee, snacks &amp; good vibes near Bharathiyar University.
              Your neighborhood hangout for great conversations and even better coffee.
            </p>
            <div className="footer-social">
              <a href="#" target="_blank" rel="noopener noreferrer" title="Instagram">
                📸
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer" title="WhatsApp">
                💬
              </a>
              <a href="#" target="_blank" rel="noopener noreferrer" title="Facebook">
                👍
              </a>
            </div>
          </div>

          <div className="footer-column">
            <h4>Quick Links</h4>
            <Link to="/">Home</Link>
            <Link to="/menu">Menu</Link>
            <Link to="/#gallery">Gallery</Link>
            <Link to="/#contact">Contact</Link>
          </div>

          <div className="footer-column">
            <h4>For Customers</h4>
            <Link to="/login">Login</Link>
            <Link to="/signup">Sign Up</Link>
            <Link to="/cart">Cart</Link>
            <Link to="/orders">My Orders</Link>
          </div>

          <div className="footer-column">
            <h4>Contact</h4>
            <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
              📍 Near Bharathiyar University
            </span>
            <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
              📞 +91 99999 99999
            </span>
            <span style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '0.6rem' }}>
              🕐 7 AM – 10 PM
            </span>
            <Link to="/admin/login">🔐 Admin</Link>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            © {new Date().getFullYear()} Mcubes Cafe. Made with ☕ and ❤️ in Coimbatore.
          </p>
          <p>
            <a href="https://maps.app.goo.gl/KVJAQkKtorgApioi9" target="_blank" rel="noopener noreferrer">
              Get Directions
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
