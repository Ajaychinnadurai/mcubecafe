import { useState, useEffect } from 'react';
import { Star, Quote, Sparkles } from 'lucide-react';
import api from '../../api/axios';
import './Testimonials.css';

export default function Testimonials() {
  const [testimonials, setTestimonials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await api.get('/testimonials/');
        setTestimonials(response.data);
      } catch {
        // Fallback testimonials if API fails
        setTestimonials([
          {
            id: 1,
            customer_name: 'Priya K.',
            role: 'BU Student',
            content: 'Best filter coffee near the university! The cozy vibe and student-friendly prices keep me coming back every week.',
            rating: 5,
          },
          {
            id: 2,
            customer_name: 'Arun M.',
            role: 'Regular Visitor',
            content: 'The Oreo shake and grilled sandwich combo is unbeatable. Perfect hangout spot for friends!',
            rating: 5,
          },
          {
            id: 3,
            customer_name: 'Sneha R.',
            role: 'Coffee Lover',
            content: 'Love the ambiance and the acoustic music playlist. Their chocolate brownie with ice cream is a must-try!',
            rating: 5,
          },
          {
            id: 4,
            customer_name: 'Karthik S.',
            role: 'Freelancer',
            content: 'Great place to study or catch up with friends. The cold brew is excellent and the staff is super friendly.',
            rating: 5,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchTestimonials();
  }, []);

  if (loading) {
    return (
      <section className="testimonials section" id="reviews">
        <div className="container">
          <div className="testimonial-loading">Loading customer reviews...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="testimonials section" id="reviews">
      <div className="testimonials-glow"></div>
      <div className="container">
        <div className="text-center">
          <div className="section-badge">
            <Sparkles size={14} /> Real Experiences
          </div>
          <h2 className="section-title">
            Loved By <span className="text-gradient">Students &amp; Locals</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto 3rem', maxWidth: '520px' }}>
            Hear what our coffee lovers, students, and regular guests have to say about M Cube's Cafe.
          </p>
        </div>

        <div className="testimonials-grid">
          {testimonials.map((t) => (
            <div key={t.id} className="testimonial-card">
              <Quote size={28} className="quote-bg-icon" />
              <div className="testimonial-stars">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    className={i < t.rating ? 'star-gold' : 'star-muted'}
                  />
                ))}
              </div>
              <p className="testimonial-content">"{t.content}"</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">
                  {t.customer_name?.[0] || 'U'}
                </div>
                <div className="testimonial-info">
                  <h4 className="testimonial-name">{t.customer_name}</h4>
                  <span className="testimonial-role">{t.role || 'Verified Customer'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
