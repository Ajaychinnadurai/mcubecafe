import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Utensils, ArrowRight, Star, Clock, Coffee, ShieldCheck } from 'lucide-react';
import './Hero.css';

const HERO_BACKGROUND_IMAGES = [
  '/images/hero_banner.png',
  '/images/artisan_coffee.png',
  '/images/signature_burger.png',
  '/images/pov_window.png',
  '/images/pov_entrance.png',
];

export default function Hero() {
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  // Auto-change background slideshow every 6 seconds
  useEffect(() => {
    const bgTimer = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % HERO_BACKGROUND_IMAGES.length);
    }, 6000);
    return () => clearInterval(bgTimer);
  }, []);

  return (
    <section className="hero" id="home">
      {/* Background Image Slideshow */}
      <div className="hero-bg-slideshow">
        {HERO_BACKGROUND_IMAGES.map((imgUrl, idx) => (
          <div
            key={imgUrl}
            className={`hero-bg-slide ${idx === currentBgIndex ? 'active' : ''}`}
            style={{ backgroundImage: `url(${imgUrl})` }}
          />
        ))}
      </div>

      <div className="hero-overlay-dark" />

      {/* Inset Brand Border Frame Overlay */}
      <div className="hero-inset-border-frame" />

      <div className="hero-container container">
        <div className="hero-content">
          {/* Top Live Badge Ticker */}
          <div className="hero-live-badge">
            <span className="live-pulse-dot" />
            <span className="live-badge-text">Coimbatore's #1 Crave Spot</span>
            <span className="live-badge-divider">•</span>
            <Star size={13} fill="var(--yellow)" stroke="none" />
            <span className="live-rating-text">4.9 ★ (500+ Reviews)</span>
          </div>

          <h1 className="hero-title">
            Welcome to <span className="hero-gradient-text">M Cube's Cafe</span>
          </h1>

          <p className="hero-subtitle">
            Indulge in specialty roasted Arabica coffee, mouth-watering gourmet burgers &amp; hot momos. Prepared fresh daily near Bharathiyar University.
          </p>

          <div className="hero-actions">
            <Link to="/menu" className="hero-btn hero-btn-primary">
              <Utensils size={18} />
              <span>View Menu</span>
              <ArrowRight size={18} className="btn-arrow" />
            </Link>
            <Link to="/cart" className="hero-btn hero-btn-secondary">
              <span>View Cart</span>
            </Link>
          </div>

          {/* Micro Feature Highlights */}
          <div className="hero-micro-features">
            <div className="micro-feature-item">
              <Coffee size={15} style={{ color: 'var(--yellow)' }} />
              <span>100% Arabica Brews</span>
            </div>
            <div className="micro-feature-item">
              <Clock size={15} style={{ color: 'var(--yellow)' }} />
              <span>~10 Min Express Prep</span>
            </div>
            <div className="micro-feature-item">
              <ShieldCheck size={15} style={{ color: 'var(--yellow)' }} />
              <span>Fresh Daily Ingredients</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
