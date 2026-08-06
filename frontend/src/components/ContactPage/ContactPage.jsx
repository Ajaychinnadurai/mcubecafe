import { Helmet } from 'react-helmet-async';
import { MapPin, Phone, Mail, Clock, MessageSquare, Sparkles } from 'lucide-react';
import './ContactPage.css';

export default function ContactPage() {
  const handleWhatsAppClick = () => {
    const text = encodeURIComponent("Hello Mcube's Cafe! I would like to get in touch with you.");
    window.open(`https://wa.me/919876543210?text=${text}`, '_blank');
  };

  return (
    <div className="contact-page">
      <Helmet>
        <title>Contact Us — Mcubes Cafe</title>
        <meta name="description" content="Get in touch with Mcubes Cafe. Visit us near Bharathiyar University or contact us via WhatsApp, phone, or email." />
      </Helmet>

      {/* Hero Header */}
      <section className="contact-hero">
        <div className="container">
          <div className="contact-hero-badge">
            <Sparkles size={16} /> <span>Get In Touch</span>
          </div>
          <h1>Contact Us</h1>
          <p>Have a question or feedback? We'd love to hear from you. Visit our cafe or drop us a message anytime.</p>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="contact-container container">
        {/* Info Cards Grid */}
        <div className="contact-info-grid">
          <div className="contact-card">
            <div className="contact-icon-wrapper">
              <MapPin size={24} />
            </div>
            <h3>Visit Us</h3>
            <p>Near Bharathiyar University</p>
            <p className="sub-detail">Maruthamalai Main Road, Coimbatore</p>
          </div>

          <div className="contact-card">
            <div className="contact-icon-wrapper">
              <Clock size={24} />
            </div>
            <h3>Opening Hours</h3>
            <p>Mon – Sun: 07:00 AM – 10:00 PM</p>
            <p className="sub-detail">Fresh hot tea, coffee &amp; snacks all day</p>
          </div>

          <div className="contact-card">
            <div className="contact-icon-wrapper">
              <Phone size={24} />
            </div>
            <h3>Call &amp; WhatsApp</h3>
            <p>+91 99999 99999</p>
            <button className="whatsapp-quick-btn" onClick={handleWhatsAppClick}>
              <MessageSquare size={16} /> Chat on WhatsApp
            </button>
          </div>

          <div className="contact-card">
            <div className="contact-icon-wrapper">
              <Mail size={24} />
            </div>
            <h3>Email Inquiry</h3>
            <p>hello@mcubescafe.com</p>
            <p className="sub-detail">support@mcubescafe.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}
