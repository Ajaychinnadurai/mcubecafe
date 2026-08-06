import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { Image as ImageIcon, X, ZoomIn, Sparkles, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api/axios';
import './GalleryPage.css';

// High-resolution curated fallback images for Mcube Cafe
const SAMPLE_GALLERY = [
  {
    id: 1,
    title: 'Mcube Luxury Ambiance',
    category: 'Ambiance',
    image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=1200&q=80',
    description: 'Warm lighting, dark wood aesthetics, and cozy seating spaces.'
  },
  {
    id: 2,
    title: 'Fresh Exotic Fruit Juices',
    category: 'Juices & Shakes',
    image: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?auto=format&fit=crop&w=1200&q=80',
    description: '100% natural, freshly squeezed tropical fruit blends.'
  },
  {
    id: 3,
    title: 'Signature Steamed Momos',
    category: 'Momos & Burgers',
    image: 'https://images.unsplash.com/photo-1625220194771-7ebdea0b70b9?auto=format&fit=crop&w=1200&q=80',
    description: 'Handcrafted dumplings served with spicy garlic chili chutney.'
  },
  {
    id: 4,
    title: 'Artisanal Espresso & Cappuccino',
    category: 'Desserts & Coffee',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=1200&q=80',
    description: 'Freshly roasted Arabica beans prepared by expert baristas.'
  },
  {
    id: 5,
    title: 'Gourmet Loaded Burger',
    category: 'Momos & Burgers',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1200&q=80',
    description: 'Juicy patty, melted cheddar, and secret cafe sauce on brioche.'
  },
  {
    id: 6,
    title: 'Thick Belgian Chocolate Shake',
    category: 'Juices & Shakes',
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=1200&q=80',
    description: 'Rich dark chocolate shake topped with whipped cream and choco chips.'
  },
  {
    id: 7,
    title: 'Cozy Evening Lounge Bar',
    category: 'Ambiance',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    description: 'The perfect spot for friends, study sessions, and coffee dates.'
  },
  {
    id: 8,
    title: 'Sizzling Crispy Fried Momos',
    category: 'Momos & Burgers',
    image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=1200&q=80',
    description: 'Golden fried dumplings with crunchy exterior and juicy filling.'
  },
  {
    id: 9,
    title: 'Decadent Chocolate Lava Cake',
    category: 'Desserts & Coffee',
    image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1200&q=80',
    description: 'Warm molten chocolate cake served with vanilla bean ice cream.'
  }
];

export default function GalleryPage() {
  const [items, setItems] = useState(SAMPLE_GALLERY);
  const [activeCategory, setActiveCategory] = useState('All');
  const [lightboxImage, setLightboxImage] = useState(null);

  useEffect(() => {
    const fetchGallery = async () => {
      try {
        const response = await api.get('/gallery/');
        if (response.data && response.data.length > 0) {
          setItems(response.data);
        }
      } catch {
        // Fall back to SAMPLE_GALLERY
      }
    };
    fetchGallery();
  }, []);

  // Lock background scrolling when Lightbox is active on mobile/desktop
  useEffect(() => {
    if (lightboxImage) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [lightboxImage]);

  const categories = ['All', 'Ambiance', 'Juices & Shakes', 'Momos & Burgers', 'Desserts & Coffee'];

  // Helper metadata normalizers for sample photos & backend gallery objects
  const getItemTitle = (item) => item?.title || item?.caption || item?.name || "M Cube's Cafe Photo";

  const getItemCategory = (item) => {
    if (item?.category) return item.category;
    if (item?.tag) return item.tag;
    const text = (item?.caption || '').toLowerCase();
    if (text.includes('interior') || text.includes('ambiance') || text.includes('seating') || text.includes('patio') || text.includes('lighting') || text.includes('outdoor')) {
      return 'Ambiance';
    }
    if (text.includes('juice') || text.includes('shake') || text.includes('drink') || text.includes('beverage') || text.includes('mojito') || text.includes('milkshake')) {
      return 'Juices & Shakes';
    }
    if (text.includes('momo') || text.includes('burger') || text.includes('snack') || text.includes('bites') || text.includes('fries') || text.includes('patty')) {
      return 'Momos & Burgers';
    }
    if (text.includes('coffee') || text.includes('tea') || text.includes('dessert') || text.includes('cake') || text.includes('espresso') || text.includes('lava')) {
      return 'Desserts & Coffee';
    }
    return 'Ambiance';
  };

  const getItemDescription = (item) => {
    if (item?.description) return item.description;
    if (item?.caption) return item.caption;
    return "Special moment captured at M Cube's Cafe near Bharathiyar University, Coimbatore.";
  };

  const filteredItems = activeCategory === 'All'
    ? items
    : items.filter((item) => {
        const itemCat = getItemCategory(item).toLowerCase();
        const activeCat = activeCategory.toLowerCase();
        return itemCat === activeCat || itemCat.includes(activeCat) || activeCat.includes(itemCat);
      });

  const lightboxIndex = lightboxImage ? filteredItems.findIndex(i => i.id === lightboxImage.id) : -1;

  const handlePrevImage = useCallback((e) => {
    if (e) e.stopPropagation();
    if (filteredItems.length === 0) return;
    const currentIndex = lightboxImage ? filteredItems.findIndex(i => i.id === lightboxImage.id) : 0;
    const prevIndex = (currentIndex - 1 + filteredItems.length) % filteredItems.length;
    setLightboxImage(filteredItems[prevIndex]);
  }, [filteredItems, lightboxImage]);

  const handleNextImage = useCallback((e) => {
    if (e) e.stopPropagation();
    if (filteredItems.length === 0) return;
    const currentIndex = lightboxImage ? filteredItems.findIndex(i => i.id === lightboxImage.id) : 0;
    const nextIndex = (currentIndex + 1) % filteredItems.length;
    setLightboxImage(filteredItems[nextIndex]);
  }, [filteredItems, lightboxImage]);

  // Keyboard navigation listener (Left, Right, Escape)
  useEffect(() => {
    if (!lightboxImage) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handlePrevImage();
      } else if (e.key === 'ArrowRight') {
        handleNextImage();
      } else if (e.key === 'Escape') {
        setLightboxImage(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage, handlePrevImage, handleNextImage]);

  // Touch swipe state for mobile gesture navigation
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 });
  const [touchEnd, setTouchEnd] = useState({ x: 0, y: 0 });

  const handleTouchStart = (e) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    setTouchEnd({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchMove = (e) => {
    setTouchEnd({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = () => {
    if (!touchStart.x || !touchEnd.x) return;
    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isHorizontal = Math.abs(distanceX) > Math.abs(distanceY);

    if (isHorizontal) {
      if (distanceX > 40) {
        handleNextImage();
      } else if (distanceX < -40) {
        handlePrevImage();
      }
    } else {
      if (distanceY < -70) {
        setLightboxImage(null);
      }
    }
  };

  return (
    <div className="gallery-page">
      <Helmet>
        <title>Image Gallery — Mcubes Cafe</title>
        <meta name="description" content="Explore photos of Mcubes Cafe ambiance, handcrafted juices, gourmet burgers, sizzling momos, and delicious coffee." />
      </Helmet>

      {/* Hero Header */}
      <section className="gallery-hero">
        <div className="container">
          <div className="gallery-hero-badge">
            <Sparkles size={16} /> <span>Visual Experience</span>
          </div>
          <h1>Mcubes Gallery</h1>
          <p>Immerse yourself in our cafe ambiance, culinary creations, and signature beverages.</p>

          {/* Category Filter Pills */}
          <div className="gallery-filters">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Grid */}
      <section className="gallery-grid-section container">
        <div className="gallery-grid">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="gallery-card"
              onClick={() => setLightboxImage(item)}
            >
              <div className="gallery-img-wrapper">
                <img src={item.image || item.image_url} alt={getItemTitle(item)} className="gallery-img" />
                <div className="gallery-overlay">
                  <div className="zoom-icon-wrapper">
                    <ZoomIn size={24} />
                  </div>
                  <h3>{getItemTitle(item)}</h3>
                  <span className="category-tag">{getItemCategory(item)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Lightbox Modal with Next/Previous Navigation & Touch Swipe */}
      {lightboxImage && (
        <div className="lightbox-overlay" onClick={() => setLightboxImage(null)}>
          {/* Always accessible fixed top-right close button */}
          <button
            className="lightbox-fixed-close"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxImage(null);
            }}
            aria-label="Close lightbox modal"
            title="Close (Esc)"
          >
            <X size={24} />
          </button>

          {/* Previous Image Button */}
          <button
            className="lightbox-nav-btn prev"
            onClick={handlePrevImage}
            aria-label="Previous photo"
            title="Previous photo (Left Arrow)"
          >
            <ChevronLeft size={28} />
          </button>

          <div
            className="lightbox-card"
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="lightbox-header-bar">
              <span className="lightbox-counter">
                {lightboxIndex >= 0 ? `${lightboxIndex + 1} of ${filteredItems.length}` : ''}
              </span>
              <button
                className="lightbox-close"
                onClick={() => setLightboxImage(null)}
                aria-label="Close image lightbox"
              >
                <X size={20} />
              </button>
            </div>

            <div className="lightbox-img-wrapper" onClick={handleNextImage} title="Tap to view next photo">
              <img src={lightboxImage.image || lightboxImage.image_url} alt={getItemTitle(lightboxImage)} />
            </div>

            <div className="lightbox-caption">
              <h2>{getItemTitle(lightboxImage)}</h2>
              <span className="lightbox-badge">{getItemCategory(lightboxImage)}</span>
              <p>{getItemDescription(lightboxImage)}</p>
            </div>
          </div>

          {/* Next Image Button */}
          <button
            className="lightbox-nav-btn next"
            onClick={handleNextImage}
            aria-label="Next photo"
            title="Next photo (Right Arrow)"
          >
            <ChevronRight size={28} />
          </button>
        </div>
      )}
    </div>
  );
}

