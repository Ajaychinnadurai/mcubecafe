import { MapPin, Phone, Mail, Clock, ExternalLink, Sparkles, Navigation } from 'lucide-react';
import './Location.css';

const GOOGLE_MAPS_URL = 'https://maps.app.goo.gl/KVJAQkKtorgApioi9';

export default function Location() {
  return (
    <section className="location-section section" id="contact">
      <div className="location-glow"></div>
      <div className="container">
        <div className="text-center">
          <div className="section-badge">
            <Sparkles size={14} /> Find Us Easily
          </div>
          <h2 className="section-title">
            Visit <span className="text-gradient">M CUBE'S CAFE</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto 3rem', maxWidth: '540px' }}>
            Drop by for a hot filter coffee, study session, or quick hangout. We are conveniently located right near Bharathiyar University campus.
          </p>
        </div>

        <div className="location-grid">
          {/* Map Section */}
          <div className="location-map-card">
            <div className="location-map-inner">
              <iframe
                title="Mcubes Cafe Location"
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3916.1478193498877!2d76.8905!3d11.0315!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMTHCsDAxJzUzLjQiTiA3NsKwNTMnMjU4IkU!5e0!3m2!1sen!2sin!4v1650000000000!5m2!1sen!2sin"
                width="100%"
                height="100%"
                style={{ border: 0, minHeight: '360px', filter: 'grayscale(0.3) contrast(1.1) invert(0.88) hue-rotate(180deg)' }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>

            <div className="map-card-footer">
              <div className="map-location-title">
                <MapPin size={20} className="map-pin-icon" />
                <div>
                  <h4>Bharathiyar University Road</h4>
                  <p>Coimbatore, Tamil Nadu 641046</p>
                </div>
              </div>
              <a
                href={GOOGLE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm"
              >
                <Navigation size={16} /> Open Maps <ExternalLink size={14} />
              </a>
            </div>
          </div>

          {/* Details Section */}
          <div className="location-info-card">
            <h3 className="info-card-title">Contact &amp; Timings</h3>

            <div className="location-detail-item">
              <div className="detail-icon-box"><MapPin size={20} /></div>
              <div className="detail-text">
                <strong>Address</strong>
                <p>Mcubes Cafe, BU Road, Maruthamalai Main Rd, Coimbatore, TN 641046</p>
              </div>
            </div>

            <div className="location-detail-item">
              <div className="detail-icon-box"><Phone size={20} /></div>
              <div className="detail-text">
                <strong>Phone &amp; Orders</strong>
                <p><a href="tel:+919876543210">+91 98765 43210</a></p>
              </div>
            </div>

            <div className="location-detail-item">
              <div className="detail-icon-box"><Mail size={20} /></div>
              <div className="detail-text">
                <strong>Email Us</strong>
                <p><a href="mailto:hello@mcubescafe.com">hello@mcubescafe.com</a></p>
              </div>
            </div>

            {/* Operating Hours Box */}
            <div className="hours-glass-box">
              <div className="hours-header">
                <Clock size={18} className="clock-icon" />
                <span>Operating Hours</span>
              </div>
              <div className="hours-row">
                <span>Monday – Friday</span>
                <span className="hours-time">7:00 AM – 10:00 PM</span>
              </div>
              <div className="hours-row">
                <span>Saturday</span>
                <span className="hours-time">8:00 AM – 11:00 PM</span>
              </div>
              <div className="hours-row">
                <span>Sunday</span>
                <span className="hours-time">9:00 AM – 9:00 PM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
