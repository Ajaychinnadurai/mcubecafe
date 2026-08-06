import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { Search } from 'lucide-react';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import Home from './components/Home/Home';
import MenuPage from './components/MenuPage/MenuPage';
import GalleryPage from './components/GalleryPage/GalleryPage';
import ContactPage from './components/ContactPage/ContactPage';
import Cart from './components/Cart/Cart';
import Checkout from './components/Checkout/Checkout';
import Payment from './components/Payment/Payment';
import OrderHistory from './components/OrderHistory/OrderHistory';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import ForgotPassword from './components/ForgotPassword/ForgotPassword';
import ResetPassword from './components/ResetPassword/ResetPassword';
import Profile from './components/Profile/Profile';
import Login from './components/Login/Login';
import AdminLogin from './components/AdminLogin/AdminLogin';
import FloatingCartButton from './components/FloatingCartButton/FloatingCartButton';
import IntroSplash from './components/IntroSplash/IntroSplash';
import './App.css';

// Automatically scroll to top or hash element on route/hash change
function ScrollToHash() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}


// Protected route for customer-only pages
function CustomerRoute({ children }) {
  const { isAuthenticated, isCustomer } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isCustomer) return <Navigate to="/admin-dashboard" replace />;
  return children;
}

// Protected route for admin-only pages
function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

// Layout for customer-facing pages with smooth route transitions
function CustomerLayout({ children }) {
  const location = useLocation();

  return (
    <>
      <IntroSplash />
      <Navbar />
      <main key={location.pathname} className="page-transition">
        {children}
      </main>
      <FloatingCartButton />
      <Footer />
    </>
  );
}

// Default SEO meta tags
function DefaultSEO() {
  return (
    <Helmet>
      <meta name="description" content="Mcubes Cafe — Best cafe in town. Fresh juices, shakes, momos, burgers, and more. Dine-in & takeaway available." />
      <meta name="keywords" content="cafe, restaurant, food, shakes, momos, burgers, juices, coffee, mcubes, dine-in, takeaway" />
      <meta name="theme-color" content="#0a0a0a" />
      <meta property="og:title" content="Mcubes Cafe" />
      <meta property="og:description" content="Best cafe in town. Fresh juices, shakes, momos, burgers, and more." />
      <meta property="og:type" content="website" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </Helmet>
  );
}

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <DefaultSEO />
            <ScrollToHash />
            <Routes>
              {/* Customer-facing routes with Navbar + Footer */}
              <Route path="/" element={<CustomerLayout><Home /></CustomerLayout>} />
              <Route path="/menu" element={<CustomerLayout><MenuPage /></CustomerLayout>} />
              <Route path="/gallery" element={<CustomerLayout><GalleryPage /></CustomerLayout>} />
              <Route path="/contact" element={<CustomerLayout><ContactPage /></CustomerLayout>} />
              <Route path="/forgot-password" element={<CustomerLayout><ForgotPassword /></CustomerLayout>} />
              <Route path="/reset-password" element={<CustomerLayout><ResetPassword /></CustomerLayout>} />
              <Route path="/login" element={<CustomerLayout><Login /></CustomerLayout>} />
              <Route path="/signup" element={<CustomerLayout><Login initialMode="signup" /></CustomerLayout>} />
              <Route path="/admin/login" element={<CustomerLayout><AdminLogin /></CustomerLayout>} />
              <Route path="/cart" element={<CustomerLayout><Cart /></CustomerLayout>} />
              <Route path="/checkout" element={<CustomerRoute><CustomerLayout><Checkout /></CustomerLayout></CustomerRoute>} />
              <Route path="/payment" element={<CustomerRoute><CustomerLayout><Payment /></CustomerLayout></CustomerRoute>} />
              <Route path="/orders" element={<CustomerRoute><CustomerLayout><OrderHistory /></CustomerLayout></CustomerRoute>} />
              <Route path="/profile" element={<CustomerLayout><Profile /></CustomerLayout>} />

              {/* Admin Dashboard (separate layout) */}
              <Route path="/admin-dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/admin/*" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

              {/* 404 */}
              <Route path="*" element={
                <CustomerLayout>
                  <div style={{ padding: '8rem 2rem', textAlign: 'center', minHeight: '60vh' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem', color: 'var(--yellow)' }}>
                      <Search size={64} />
                    </div>
                    <h2 style={{ color: 'var(--text-light)', marginBottom: '0.5rem' }}>Page Not Found</h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>The page you're looking for doesn't exist.</p>
                    <a href="/" className="btn btn-primary">Go Home</a>
                  </div>
                </CustomerLayout>
              } />
            </Routes>
          </Router>
        </CartProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}
