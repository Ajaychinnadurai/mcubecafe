import { Coffee, Coins, Wifi, Sofa, Heart, Users, Sparkles } from 'lucide-react';
import './About.css';

export default function About() {
  const founders = [
    { name: 'Manoj', initial: 'M', role: 'Coffee Enthusiast & Co-founder', bio: 'Passionate about roasting the perfect espresso' },
    { name: 'Mithun', initial: 'M', role: 'Operations & Co-founder', bio: 'Ensuring seamless service and warm hospitality' },
    { name: 'Mohan', initial: 'M', role: 'Head Barista & Co-founder', bio: 'Crafting signature brews and campus favorites' },
  ];

  return (
    <section className="about section" id="about">
      <div className="about-glow"></div>
      <div className="container about-container">
        <div className="about-content">
          <div className="about-subtitle-badge">
            <Sparkles size={14} /> Our Story &amp; Passion
          </div>

          <h2 className="section-title">
            The Story Behind <span className="text-gradient">M CUBE'S</span>
          </h2>

          <p className="about-text">
            <strong>Mcubes Cafe</strong> was born from a simple dream shared by{' '}
            <strong>three best friends</strong> — Manoj, Mithun, and Mohan. We turned our shared passion for coffee into a vibrant, welcoming space near Bharathiyar University.
          </p>

          <p className="about-text">
            The <strong>"M"</strong> in each of our names inspired <strong>Mcubes</strong>{' '}
            (M³) — representing a cube of rich flavor, deep friendship, and community connection.
          </p>

          <div className="about-features-grid">
            <div className="about-feature-card">
              <div className="feature-icon-box"><Coffee size={22} /></div>
              <div>
                <h4>Specialty Coffee</h4>
                <p>Freshly roasted beans &amp; authentic South Indian filter coffee</p>
              </div>
            </div>

            <div className="about-feature-card">
              <div className="feature-icon-box"><Coins size={22} /></div>
              <div>
                <h4>Student Friendly</h4>
                <p>Delicious food &amp; drinks priced for student budgets</p>
              </div>
            </div>

            <div className="about-feature-card">
              <div className="feature-icon-box"><Wifi size={22} /></div>
              <div>
                <h4>High-Speed Wi-Fi</h4>
                <p>Perfect for study sessions, group projects &amp; remote work</p>
              </div>
            </div>

            <div className="about-feature-card">
              <div className="feature-icon-box"><Sofa size={22} /></div>
              <div>
                <h4>Cozy Ambiance</h4>
                <p>Relaxed seating with warm lighting and chill acoustic tunes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Founders Showcase Card */}
        <div className="about-card-wrapper">
          <div className="about-main-card">
            <div className="about-photo-banner">
              <img src="/gallery/exterior.jpg" alt="M Cube's Cafe Front Storefront" className="about-banner-img" />
              <div className="about-banner-overlay" />
            </div>

            <div className="about-card-header">
              <div className="cube-badge">M³</div>
              <div>
                <h3>Meet The Three Founders</h3>
                <p>The M's behind your favorite cup</p>
              </div>
            </div>

            <div className="founders-list">
              {founders.map((founder) => (
                <div key={founder.name} className="founder-glass-card">
                  <div className="founder-avatar-circle">{founder.initial}</div>
                  <div className="founder-details">
                    <h4>{founder.name}</h4>
                    <span className="founder-role">{founder.role}</span>
                    <p className="founder-bio">{founder.bio}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="about-card-footer">
              <Heart size={16} className="heart-icon" />
              <span>Built with love for Coimbatore coffee lovers</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
