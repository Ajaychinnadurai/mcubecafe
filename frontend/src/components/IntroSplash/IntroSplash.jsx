import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './IntroSplash.css';

export default function IntroSplash() {
  const [visible, setVisible] = useState(false);
  const [animState, setAnimState] = useState('intro-enter'); // 'intro-enter' | 'intro-zoom-fade-out'
  const location = useLocation();

  useEffect(() => {
    const runCinematicIntro = () => {
      setVisible(true);
      setAnimState('intro-enter');

      // Start zoom out & fade out at 2.3s, finish at 3.0s
      const timerZoomFade = setTimeout(() => {
        setAnimState('intro-zoom-fade-out');
      }, 2300);

      const timerHide = setTimeout(() => {
        setVisible(false);
      }, 3000);

      return () => {
        clearTimeout(timerZoomFade);
        clearTimeout(timerHide);
      };
    };

    // Run intro animation ONLY ONCE per session on initial load, never when navigating or clicking Home button
    const hasSeenIntro = sessionStorage.getItem('mcube_intro_shown');
    if (!hasSeenIntro && location.pathname === '/') {
      sessionStorage.setItem('mcube_intro_shown', 'true');
      runCinematicIntro();
    }
  }, [location.pathname]);

  if (!visible) return null;

  return (
    <div className={`cinematic-intro-overlay ${animState}`}>
      <div className="max-logo-content-wrap">
        <img src="/logo.png" alt="M Cube's Cafe Logo" className="max-intro-logo-img" />
        
        <div className="animated-text-container">
          <h1 className="animated-brand-title">
            <span className="title-letter">M</span>{' '}
            <span className="title-letter">C U B E ' S</span>{' '}
            <span className="title-letter gold-accent">C A F E</span>
          </h1>
          <p className="animated-brand-tagline">COIMBATORE'S #1 CRAVE SPOT</p>
        </div>
      </div>
    </div>
  );
}
