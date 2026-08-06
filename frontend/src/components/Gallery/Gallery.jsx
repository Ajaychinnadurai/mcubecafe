import { useState, useEffect } from 'react';
import { Coffee, Home, Sandwich, Cake, Music, Sofa, BookOpen, Leaf, Sparkles, Image as ImageIcon } from 'lucide-react';
import api from '../../api/axios';
import './Gallery.css';

const REAL_CAFE_PHOTOS = [
  {
    id: 'real-exterior',
    image: '/gallery/exterior.jpg',
    caption: "M Cube's Cafe Storefront & Outdoor Seating",
    tag: "Storefront View",
  },
  {
    id: 'real-interior',
    image: '/gallery/interior.jpg',
    caption: 'Self-Service Patio & Hanging Triangle Lamps',
    tag: 'Patio Ambiance',
  },
];

const defaultGalleryItems = [
  ...REAL_CAFE_PHOTOS,
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=800&q=80',
    caption: 'Signature Mint & Fruit Mojitos',
    tag: 'Cold Refreshments',
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80',
    caption: 'Juicy Cheese Burgers & Crispy Fries',
    tag: 'Campus Bestsellers',
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
    caption: 'Steamed & Peri-Peri Chicken Momos',
    tag: 'Hot Snacks',
  },
  {
    id: 6,
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
    caption: 'Fresh Brewed Coffee & Rajasthani Ginger Tea',
    tag: 'Hot Beverages',
  },
];

export default function Gallery() {
  const [galleryItems, setGalleryItems] = useState(defaultGalleryItems);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const res = await api.get('/gallery/');
        if (res.data && res.data.length > 0) {
          // Keep real cafe photos at the top
          const otherItems = res.data.filter(
            (i) => !i.caption?.includes('Storefront') && !i.caption?.includes('Patio')
          );
          setGalleryItems([...REAL_CAFE_PHOTOS, ...otherItems]);
        } else {
          setGalleryItems(defaultGalleryItems);
        }
      } catch {
        setGalleryItems(defaultGalleryItems);
      }
    };
    fetchGallery();
  }, []);

  return (
    <section className="gallery section" id="gallery">
      <div className="gallery-glow"></div>
      <div className="container">
        <div className="text-center">
          <div className="section-badge">
            <Sparkles size={14} /> Cafe Gallery
          </div>
          <h2 className="section-title">
            Explore <span className="text-gradient">M Cube's Cafe</span>
          </h2>
          <p className="section-subtitle" style={{ margin: '0 auto 3rem', maxWidth: '540px' }}>
            Take a look at our real cafe setup on Maruthamalai Main Road, cozy patio seating, and customer favorite treats.
          </p>
        </div>

        <div className="gallery-grid">
          {galleryItems.map((item, index) => {
            const IconComponent = item.icon || Coffee;
            return (
              <div key={item.id || index} className="gallery-card">
                {item.image ? (
                  <img src={item.image} alt={item.caption} className="gallery-img" />
                ) : (
                  <div className="gallery-icon-wrapper">
                    <IconComponent size={44} className="gallery-icon" />
                  </div>
                )}
                <div className="gallery-overlay">
                  <div className="gallery-tag">
                    <ImageIcon size={14} /> {item.tag || "M Cube's Spot"}
                  </div>
                  <h4 className="gallery-caption">{item.caption}</h4>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
