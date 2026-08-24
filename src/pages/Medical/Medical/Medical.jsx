import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { usePageTitle } from '../../../hooks';
import '../../../assets/css/style.css';
import './Medical.css';
import HospitalBooking from './HospitalBooking';

import wellnessImg from '../../../assets/medical/wellness.png';
import ayurvedaImg from '../../../assets/medical/ayurveda.png';
import hospitalImg from '../../../assets/medical/hospital.png';

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

// Particle Background System (Matching Home UI)
class MedicalParticle {
    constructor(width, height) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * 0.9;
        this.vy = (Math.random() - 0.5) * 0.9;
        this.size = Math.random() * 1.5 + 0.5;
    }

    update(width, height) {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;
    }

    draw(ctx) {
        ctx.fillStyle = 'rgba(128, 0, 32, 0.5)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

const medicalCategories = [
  {
    id: 1,
    title: "Wellness Retreats",
    subtitle: "Yoga, Meditation & Detox",
    desc: "Restore your body, mind & spirit in the serene hills of Tamil Nadu.",
    img: wellnessImg,
    btnText: "Explore Retreats",
    section: "wellness"
  },
  {
    id: 2,
    title: "Siddha & Ayurveda",
    subtitle: "Traditional Healing Therapies",
    desc: "Experience ancient remedies & expert care for holistic healing.",
    img: ayurvedaImg,
    btnText: "Learn More",
    section: "ayurveda"
  },
  {
    id: 3,
    title: "Hospital Tourism",
    subtitle: "Medical Travel & Care",
    desc: "World-class hospitals offering specialized treatments & full support.",
    img: hospitalImg,
    btnText: "Plan Your Visit",
    section: "hospital"
  }
];

export default function Medical() {
  usePageTitle('Medical & Wellness Tourism | Tamil Nadu');
  const [activeSection, setActiveSection] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [doctorType, setDoctorType] = useState('');
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [bookingPlace, setBookingPlace] = useState(null);

  // Particle Background refs
  const canvasRef = useRef(null);
  const sectionRef = useRef(null);

  useEffect(() => {
    if (!window.google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&libraries=places`;
      script.async = true;
      script.onload = () => setMapLoaded(true);
      document.body.appendChild(script);
    } else {
      setMapLoaded(true);
    }
  }, []);

  // Particle animation effect
  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;

    const ctx = canvas.getContext('2d', { alpha: true });

    const updateSize = () => {
      canvas.width = section.offsetWidth;
      canvas.height = section.offsetHeight;
    };
    updateSize();

    let particles = [];
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 18 : 35;
    let animationFrameId;
    let isVisible = false;

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push(new MedicalParticle(canvas.width, canvas.height));
      }
    };

    const animateParticles = () => {
      if (!isVisible) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const len = particles.length;
      for (let i = 0; i < len; i++) {
        particles[i].update(canvas.width, canvas.height);
        particles[i].draw(ctx);

        for (let j = i + 1; j < len; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distSq = dx * dx + dy * dy;

          if (distSq < 6400) {
            const distance = Math.sqrt(distSq);
            ctx.strokeStyle = `rgba(128, 0, 32, ${0.12 - distance / 800})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      animationFrameId = requestAnimationFrame(animateParticles);
    };

    initParticles();

    const observer = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = requestAnimationFrame(animateParticles);
      } else {
        cancelAnimationFrame(animationFrameId);
      }
    }, { threshold: 0.05 });

    observer.observe(section);

    const handleResize = () => {
      updateSize();
      initParticles();
    };

    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleSectionClick = (section) => {
    setActiveSection(section);
    setPlaces([]);
    setSearchTerm('');
    setDoctorType('');
    setBookingPlace(null);
  };

  const handleSearch = (queryOverride) => {
    const term = typeof queryOverride === 'string' ? queryOverride : searchTerm;
    if (!term || !mapLoaded || !window.google?.maps?.places) return;

    setLoading(true);
    const service = new window.google.maps.places.PlacesService(document.createElement('div'));

    let query = '';
    if (activeSection === 'wellness') {
      query = `Yoga Meditation Detox center in ${term}`;
    } else if (activeSection === 'ayurveda') {
      query = `Siddha Ayurveda Hospital Clinic in ${term}`;
    } else if (activeSection === 'hospital') {
      query = `Best ${doctorType || 'Specialist'} Hospital in ${term}`;
    }

    const request = {
      query: query,
      fields: ['name', 'formatted_address', 'photos', 'rating', 'place_id']
    };

    service.textSearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        setPlaces(results);
      }
      setLoading(false);
    });
  };

  let searchTitle = 'Find Your Peace';
  let searchSubtitle = 'Search for Yoga, Meditation & Detox centers';
  let searchPlaceholder = 'Enter location (e.g., Ooty, Kodaikanal, Coimbatore)...';

  if (activeSection === 'ayurveda') {
    searchTitle = 'Ancient Healing';
    searchSubtitle = 'Search for Siddha & Ayurveda Sanctuaries';
    searchPlaceholder = 'Enter location (e.g., Madurai, Courtallam, Chennai)...';
  } else if (activeSection === 'hospital') {
    searchTitle = 'World-Class Care';
    searchSubtitle = 'Find Top Specialists & Multi-Specialty Hospitals';
    searchPlaceholder = 'Enter location (e.g., Chennai, Coimbatore, Vellore)...';
  }

  const fallbackImg = activeSection === 'wellness' ? wellnessImg : (activeSection === 'ayurveda' ? ayurvedaImg : hospitalImg);

  if (bookingPlace) {
    return (
      <div className="medical-home-themed-page">
        <Navbar />
        <main className="main-content-wrapper" style={{ padding: '40px 20px' }}>
          <HospitalBooking place={bookingPlace} onBack={() => setBookingPlace(null)} />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="medical-home-themed-page">
      <Navbar />

      {/* Hero Section — Stitch Cinematic Style */}
      <section className="stitch-hero">
        <div className="stitch-hero__bg">
          <picture>
            <source media="(max-width: 768px)" srcSet="/tn verse/src/medical.webp" />
            <img
              src="/tn verse/src/medical.webp"
              alt="Tamil Nadu Medical & Wellness Tourism"
              className="stitch-hero__img"
              width="1920"
              height="1080"
              fetchPriority="high"
              decoding="async"
            />
          </picture>
          <div className="stitch-hero__overlay"></div>
        </div>

        <div className="stitch-hero__content">
          <h1 className="stitch-hero__title">
            Tamil Nadu Medical & Wellness - <br />
            <span className="stitch-hero__title-italic">Ancient Wisdom, Modern Healing</span>
          </h1>

          <div className="stitch-hero__buttons">
            <button
              className="stitch-hero__btn stitch-hero__btn--ar"
              onClick={() => {
                handleSectionClick('wellness');
                document.getElementById('medical-dashboard-start')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span className="material-symbols-outlined">self_improvement</span>
              <span>WELLNESS RETREATS</span>
            </button>
            <button
              className="stitch-hero__btn stitch-hero__btn--vr"
              onClick={() => {
                handleSectionClick('ayurveda');
                document.getElementById('medical-dashboard-start')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span className="material-symbols-outlined">spa</span>
              <span>SIDDHA & AYURVEDA</span>
            </button>
            <button
              className="stitch-hero__btn stitch-hero__btn--vr"
              onClick={() => {
                handleSectionClick('hospital');
                document.getElementById('medical-dashboard-start')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span className="material-symbols-outlined">local_hospital</span>
              <span>HOSPITAL TOURISM</span>
            </button>
          </div>
        </div>

        <div className="stitch-hero__scroll-hint" onClick={() => document.getElementById('medical-dashboard-start')?.scrollIntoView({ behavior: 'smooth' })}>
          <span className="stitch-hero__scroll-text">Scroll to Discover</span>
          <span className="material-symbols-outlined stitch-hero__scroll-icon">expand_more</span>
        </div>
      </section>

      {/* Quick Stats Trust Banner */}
      <section className="tn-stats-banner" style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap', padding: '26px 20px', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(129,0,0,0.08)', position: 'relative', zIndex: 10 }}>
        <div style={{ textAlign: 'center', minWidth: '130px' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#810000' }}>120+</div>
          <div style={{ fontSize: '0.85rem', color: '#555', fontWeight: '500' }}>Accredited Hospitals</div>
        </div>
        <div style={{ textAlign: 'center', minWidth: '130px' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#810000' }}>50+</div>
          <div style={{ fontSize: '0.85rem', color: '#555', fontWeight: '500' }}>Wellness Retreats</div>
        </div>
        <div style={{ textAlign: 'center', minWidth: '130px' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#810000' }}>35,000+</div>
          <div style={{ fontSize: '0.85rem', color: '#555', fontWeight: '500' }}>Global Patients</div>
        </div>
        <div style={{ textAlign: 'center', minWidth: '130px' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#810000' }}>98%</div>
          <div style={{ fontSize: '0.85rem', color: '#555', fontWeight: '500' }}>Patient Satisfaction</div>
        </div>
        <div style={{ textAlign: 'center', minWidth: '130px' }}>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#810000' }}>24/7</div>
          <div style={{ fontSize: '0.85rem', color: '#555', fontWeight: '500' }}>Care Facilitation</div>
        </div>
      </section>

      {/* Main Content with Unified Particle Background */}
      <main id="medical-dashboard-start" className="main-content-wrapper medical-content-wrapper" ref={sectionRef}>
        <canvas ref={canvasRef} id="particleCanvas"></canvas>
        <div className="cursor-glow"></div>

        <div className="medical-page-inner">
          {!activeSection ? (
            <div className="medical-dashboard-section">
              <div className="section-header" style={{ textAlign: 'center', marginBottom: '36px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: '800', letterSpacing: '1.5px', color: '#810000', textTransform: 'uppercase' }}>HOLISTIC HEALTHCARE DESTINATION</span>
                <h2 style={{ fontFamily: 'Merriweather', fontSize: '2.2rem', color: '#2b1116', margin: '6px 0 10px 0' }}>Medical & Wellness Tourism</h2>
                <p style={{ color: '#666', fontSize: '1.05rem' }}>Discover rejuvenation in serene hills and world-renowned specialized healthcare in Tamil Nadu.</p>
              </div>

              <div className="medical-cards-grid">
                {medicalCategories.map(cat => (
                  <div key={cat.id} className="medical-card-modern">
                    <div className="card-img-wrapper">
                      <img src={cat.img} alt={cat.title} />
                    </div>
                    <div className="card-content-modern">
                      <h3>{cat.title}</h3>
                      <h4>{cat.subtitle}</h4>
                      <p>{cat.desc}</p>
                      <button
                        className="btn-green"
                        style={{ marginTop: 'auto', width: '100%' }}
                        onClick={() => handleSectionClick(cat.section)}
                      >
                        {cat.btnText} ›
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="wellness-view animate-fade-in">
              <div style={{ marginBottom: '24px' }}>
                <button className="btn-wood" onClick={() => setActiveSection(null)}>← Back to Medical Hub</button>
              </div>

              <div className="silent-header" style={{ textAlign: 'center', marginBottom: '30px' }}>
                <h2 style={{ fontFamily: 'Merriweather', fontSize: '2rem', color: '#810000', margin: '0 0 8px 0' }}>{searchTitle}</h2>
                <p style={{ color: '#666', fontSize: '1.05rem' }}>{searchSubtitle}</p>
              </div>

              <div className="silent-search-container" style={{ maxWidth: '650px', margin: '0 auto 35px auto' }}>
                {activeSection === 'hospital' && (
                  <select
                    className="doctor-select-modern"
                    value={doctorType}
                    onChange={(e) => setDoctorType(e.target.value)}
                    style={{ width: '100%', padding: '12px 18px', borderRadius: '12px', border: '1px solid rgba(129,0,0,0.2)', marginBottom: '15px', fontFamily: 'inherit', fontWeight: '600' }}
                  >
                    <option value="">Select Doctor / Specialist</option>
                    <option value="Cardiologist">Cardiologist (Heart)</option>
                    <option value="Neurologist">Neurologist (Brain)</option>
                    <option value="Orthopedic Surgeon">Orthopedic (Bones/Joints)</option>
                    <option value="Oncologist">Oncologist (Cancer)</option>
                    <option value="Dermatologist">Dermatologist (Skin)</option>
                    <option value="Pediatrician">Pediatrician (Child)</option>
                    <option value="Gynecologist">Gynecologist (Women)</option>
                    <option value="Dentist">Dentist</option>
                    <option value="ENT Specialist">ENT Specialist</option>
                    <option value="Surgeon">General Surgeon</option>
                  </select>
                )}

                <div className="trails-filters" style={{ margin: 0 }}>
                  <div className="filter-search-wrapper">
                    <i className="fa-solid fa-search" style={{ color: '#810000', marginRight: '8px' }}></i>
                    <input
                      type="text"
                      className="filter-search-input"
                      placeholder={searchPlaceholder}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <button className="btn-green" onClick={() => handleSearch()}>
                    {loading ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>

              <div className="peace-grid">
                {loading && <p className="loading-text" style={{ textAlign: 'center', color: '#810000', fontWeight: 'bold', gridColumn: '1/-1' }}>🌿 Finding top verified centers...</p>}

                {!loading && places.map(place => (
                  <div key={place.place_id} className="peace-card-modern">
                    <div className="peace-img-wrapper">
                      <img
                        src={place.photos?.[0]?.getUrl() || fallbackImg}
                        className="peace-img"
                        alt={place.name}
                      />
                    </div>
                    <div className="peace-content-modern">
                      <h3 style={{ fontFamily: 'Merriweather', color: '#2b1116', fontSize: '1.15rem', margin: '0 0 6px 0' }}>{place.name}</h3>
                      <p className="peace-address" style={{ color: '#666', fontSize: '0.85rem', marginBottom: '10px' }}>📍 {place.formatted_address}</p>
                      {place.rating && <div className="peace-rating" style={{ display: 'inline-block', background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: '14px' }}>⭐ {place.rating} / 5.0</div>}

                      <div className="card-actions" style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                        <button
                          className="btn-wood"
                          style={{ flex: 1, padding: '8px', fontSize: '0.85rem' }}
                          onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.name + ' ' + place.formatted_address)}`, '_blank')}
                        >
                          📍 Map View
                        </button>
                        {activeSection === 'hospital' && (
                          <button
                            className="btn-green"
                            style={{ flex: 1.2, padding: '8px', fontSize: '0.85rem' }}
                            onClick={() => setBookingPlace(place)}
                          >
                            📅 Book Visit
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <Footer />
      </main>
    </div>
  );
}
