import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../../components/Navbar';
import Footer from '../../../components/Footer';
import { usePageTitle } from '../../../hooks';
import '../../../assets/css/style.css';
import './Culinary.css';
import '@fontsource/dancing-script';
import '@fontsource/playfair-display';

// Import images from assets
import chettinadChickenImg from '../../../assets/culinary/chettinad_chicken.jpg';
import kothuParottaImg from '../../../assets/culinary/kothu_parotta.jpg';
import fishCurryImg from '../../../assets/culinary/fish_curry.jpg';
import filterCoffeeImg from '../../../assets/culinary/filter_coffee.jpg';
import placeholderFoodImg from '../../../assets/culinary/placeholder_food.jpg';

const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

// Particle Background System (Matching Home UI)
class CulinaryParticle {
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

const regions = [
    { id: 'all', name: 'All Regions', tag: 'All' },
    { id: 'chettinad', name: 'Chettinad', desc: 'Spicy, aromatic, and rich in heritage.', tag: 'Chettinad' },
    { id: 'madurai', name: 'Madurai', desc: 'Street food paradise with bold flavors.', tag: 'Madurai' },
    { id: 'kongu', name: 'Kongu Nadu', desc: 'Simple, healthy, and using native ingredients.', tag: 'Kongu' },
    { id: 'coastal', name: 'Coastal Chennai', desc: 'Fresh seafood with tangy tamarind notes.', tag: 'Coastal' }
];

export default function Culinary() {
    usePageTitle('Culinary Tourism | Flavors of Tamil Nadu');
    const navigate = useNavigate();

    const [activeRegion, setActiveRegion] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(false);
    const [mapLoaded, setMapLoaded] = useState(false);

    // Details modal
    const [selectedPlace, setSelectedPlace] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);

    // Particle Background
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
                particles.push(new CulinaryParticle(canvas.width, canvas.height));
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

    const handleSearch = (queryOverride) => {
        if (!mapLoaded || !window.google?.maps?.places) return;

        let query = queryOverride || searchTerm;
        const regionQuery = activeRegion && activeRegion !== 'All' ? activeRegion : '';

        let searchBase = query;
        if (!searchBase) {
            if (regionQuery) {
                searchBase = regionQuery;
            } else {
                searchBase = "Tamil Nadu";
            }
        }

        const searchText = `famous food restaurants in ${searchBase}`;

        setLoading(true);
        setPlaces([]);
        const service = new window.google.maps.places.PlacesService(document.createElement('div'));

        const commonFields = ['name', 'formatted_address', 'photos', 'rating', 'place_id', 'geometry', 'user_ratings_total', 'types'];

        const searchAsync = (text) => {
            return new Promise((resolve) => {
                const request = {
                    query: text,
                    fields: commonFields,
                };
                service.textSearch(request, (results, status) => {
                    if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
                        resolve(results);
                    } else {
                        resolve([]);
                    }
                });
            });
        };

        searchAsync(searchText)
            .then((restaurants) => {
                let combined = restaurants.slice(0, 20);
                const uniquePlaces = Array.from(new Map(combined.map(item => [item.place_id, item])).values());
                setPlaces(uniquePlaces);
                setLoading(false);
            });
    };

    const fetchPlaceDetails = (placeId) => {
        if (!mapLoaded || !window.google?.maps?.places) return;
        setDetailsLoading(true);

        const service = new window.google.maps.places.PlacesService(document.createElement('div'));
        const request = {
            placeId: placeId,
            fields: ['name', 'formatted_address', 'formatted_phone_number', 'website', 'opening_hours', 'rating', 'user_ratings_total', 'reviews', 'photos', 'url', 'geometry']
        };

        service.getDetails(request, (place, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                setSelectedPlace(place);
            }
            setDetailsLoading(false);
        });
    };

    return (
        <div className="culinary-home-themed-page">
            <Navbar />

            {/* Hero Section — Stitch Cinematic Style */}
            <section className="stitch-hero">
                <div className="stitch-hero__bg">
                    <picture>
                        <source media="(max-width: 768px)" srcSet="/tn verse/src/memories-cuisine.webp" />
                        <img
                            src="/tn verse/src/memories-cuisine.webp"
                            alt="Tamil Nadu Heritage Food & Cuisine"
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
                        Tamil Nadu Culinary Odyssey - <br />
                        <span className="stitch-hero__title-italic">A Symphony of Heritage Flavors</span>
                    </h1>

                    <div className="stitch-hero__buttons">
                        <button
                            className="stitch-hero__btn stitch-hero__btn--ar"
                            onClick={() => document.getElementById('explore-section')?.scrollIntoView({ behavior: 'smooth' })}
                        >
                            <span className="material-symbols-outlined">restaurant_menu</span>
                            <span>FOOD TRAILS</span>
                        </button>
                        <button
                            className="stitch-hero__btn stitch-hero__btn--vr"
                            onClick={() => {
                                setSearchTerm('Chettinad');
                                handleSearch('Chettinad');
                                document.getElementById('explore-section')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                        >
                            <span className="material-symbols-outlined">ramen_dining</span>
                            <span>CHETTINAD CUISINE</span>
                        </button>
                        <button
                            className="stitch-hero__btn stitch-hero__btn--vr"
                            onClick={() => {
                                setSearchTerm('Madurai');
                                handleSearch('Madurai');
                                document.getElementById('explore-section')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                        >
                            <span className="material-symbols-outlined">local_cafe</span>
                            <span>MADURAI STREET FOOD</span>
                        </button>
                    </div>
                </div>

                <div className="stitch-hero__scroll-hint" onClick={() => document.getElementById('explore-section')?.scrollIntoView({ behavior: 'smooth' })}>
                    <span className="stitch-hero__scroll-text">Scroll to Discover</span>
                    <span className="material-symbols-outlined stitch-hero__scroll-icon">expand_more</span>
                </div>
            </section>

            {/* Quick Stats Trust Banner */}
            <section className="tn-stats-banner" style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap', padding: '26px 20px', background: 'rgba(255, 255, 255, 0.85)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(129,0,0,0.08)', position: 'relative', zIndex: 10 }}>
                <div style={{ textAlign: 'center', minWidth: '130px' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#810000' }}>500+</div>
                    <div style={{ fontSize: '0.85rem', color: '#555', fontWeight: '500' }}>Heritage Eateries</div>
                </div>
                <div style={{ textAlign: 'center', minWidth: '130px' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#810000' }}>30+</div>
                    <div style={{ fontSize: '0.85rem', color: '#555', fontWeight: '500' }}>Iconic Food Trails</div>
                </div>
                <div style={{ textAlign: 'center', minWidth: '130px' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#810000' }}>50,000+</div>
                    <div style={{ fontSize: '0.85rem', color: '#555', fontWeight: '500' }}>Happy Foodies</div>
                </div>
                <div style={{ textAlign: 'center', minWidth: '130px' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#810000' }}>4.9 ★</div>
                    <div style={{ fontSize: '0.85rem', color: '#555', fontWeight: '500' }}>Flavor Rating</div>
                </div>
                <div style={{ textAlign: 'center', minWidth: '130px' }}>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#810000' }}>100%</div>
                    <div style={{ fontSize: '0.85rem', color: '#555', fontWeight: '500' }}>Authentic Flavors</div>
                </div>
            </section>

            {/* Main Content with Unified Particle Background */}
            <main className="main-content-wrapper culinary-content-wrapper" ref={sectionRef}>
                <canvas ref={canvasRef} id="particleCanvas"></canvas>
                <div className="cursor-glow"></div>

                <div className="food-trails-section" id="explore-section">
                    <div className="section-header" style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '800', letterSpacing: '1.5px', color: '#810000', textTransform: 'uppercase' }}>GASTRONOMY HERITAGE</span>
                        <h2 style={{ fontFamily: 'Merriweather', fontSize: '2.2rem', color: '#2b1116', margin: '6px 0 10px 0' }}>Tamil Nadu Food Trails</h2>
                        <p style={{ color: '#666', fontSize: '1.05rem' }}>Explore authentic regional cuisines and iconic eateries across Tamil Nadu</p>
                    </div>

                    {/* Regional Filter Chips */}
                    <div className="culinary-region-chips">
                        {regions.map(r => (
                            <button
                                key={r.id}
                                className={`culinary-chip ${activeRegion === r.tag ? 'active' : ''}`}
                                onClick={() => {
                                    setActiveRegion(r.tag);
                                    if (r.tag !== 'All') {
                                        setSearchTerm(r.tag);
                                        handleSearch(r.tag);
                                    } else {
                                        setSearchTerm('');
                                        setPlaces([]);
                                    }
                                }}
                            >
                                {r.name}
                            </button>
                        ))}
                    </div>

                    {/* Search Bar */}
                    <div className="trails-filters">
                        <div className="filter-search-wrapper">
                            <i className="fa-solid fa-search" style={{ color: '#810000', marginRight: '8px' }}></i>
                            <input
                                className="filter-search-input"
                                type="text"
                                placeholder="Search by food or city (e.g. Madurai, Karaikudi, Chennai, Biryani)..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <button className="btn-green" onClick={() => handleSearch()}>
                            {loading ? 'Searching...' : 'Explore Spots'}
                        </button>
                    </div>

                    {/* Loading Spinner */}
                    {loading ? (
                        <div className="loading-spinner" style={{ textAlign: 'center', padding: '50px', fontSize: '1.2rem', color: '#810000' }}>
                            🍲 Simmering flavors & fetching authentic eateries...
                        </div>
                    ) : places.length > 0 ? (
                        <div className="search-results-wrapper">
                            <div className="grid-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
                                <h3 style={{ fontFamily: 'Merriweather', color: '#2b1116', fontSize: '1.5rem', margin: 0 }}>
                                    Top Spots in "{searchTerm || activeRegion || 'Tamil Nadu'}"
                                </h3>
                                <button
                                    onClick={() => { setPlaces([]); setSearchTerm(''); setActiveRegion('All'); }}
                                    className="btn-wood"
                                    style={{ padding: '6px 18px', fontSize: '0.85rem' }}
                                >
                                    Clear Results
                                </button>
                            </div>
                            <div className="trails-grid">
                                {places.slice(0, 20).map((place, index) => {
                                    const fallbacks = [
                                        chettinadChickenImg,
                                        kothuParottaImg,
                                        fishCurryImg,
                                        filterCoffeeImg,
                                        placeholderFoodImg
                                    ];
                                    const fallbackIndex = place.name.length % fallbacks.length;
                                    const fallbackSrc = fallbacks[fallbackIndex];
                                    const imageSrc = place.photos?.[0]?.getUrl({ maxWidth: 400 }) || fallbackSrc;

                                    return (
                                        <div key={place.place_id} className="trail-card">
                                            <div className="card-header-bar">{place.name}</div>
                                            <div className="card-images">
                                                <img
                                                    src={imageSrc}
                                                    alt={place.name}
                                                    onError={(e) => e.target.src = fallbackSrc}
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                />
                                            </div>
                                            <div className="card-info">
                                                <div className="info-row">
                                                    <span style={{ color: '#f59e0b' }}>★</span>
                                                    <div>
                                                        <span className="info-label">Rating</span>
                                                        <span className="info-val">{place.rating ? `${place.rating} (${place.user_ratings_total})` : '4.7 (Top Rated)'}</span>
                                                    </div>
                                                </div>
                                                <div className="info-row">
                                                    <span>📍</span>
                                                    <div>
                                                        <span className="info-label">Location</span>
                                                        <span className="info-val" style={{ fontSize: '0.85rem', lineHeight: '1.3' }}>{place.formatted_address?.split(',')[0]}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button className="btn-explore-trail" onClick={() => fetchPlaceDetails(place.place_id)}>View Details ›</button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        /* Default Curated Regional Cards */
                        <div className="trails-grid">
                            {/* Madurai Card */}
                            <div className="trail-card">
                                <div className="card-header-bar">Madurai Street Food Trail</div>
                                <div className="card-images">
                                    <img src={kothuParottaImg} alt="Kothu Parotta" />
                                </div>
                                <div className="card-info">
                                    <div className="info-row">
                                        <span>🍲</span>
                                        <div>
                                            <span className="info-label">Signature Dishes</span>
                                            <span className="info-val">Jigarthanda, Kari Dosai, Kothu Parotta</span>
                                        </div>
                                    </div>
                                    <div className="info-row">
                                        <span>📍</span>
                                        <div>
                                            <span className="info-label">Popular Street</span>
                                            <span className="info-val">Simmakkal & West Masi Street</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="btn-explore-trail" onClick={() => { setSearchTerm('Madurai'); handleSearch('Madurai'); }}>Explore Madurai Eateries ›</button>
                            </div>

                            {/* Chettinad Card */}
                            <div className="trail-card">
                                <div className="card-header-bar">Chettinad Heritage Feast</div>
                                <div className="card-images">
                                    <img src={chettinadChickenImg} alt="Chettinad Chicken" />
                                </div>
                                <div className="card-info">
                                    <div className="info-row">
                                        <span>🍲</span>
                                        <div>
                                            <span className="info-label">Signature Dishes</span>
                                            <span className="info-val">Chettinad Chicken, Vellai Paniyaram</span>
                                        </div>
                                    </div>
                                    <div className="info-row">
                                        <span>📍</span>
                                        <div>
                                            <span className="info-label">Popular Area</span>
                                            <span className="info-val">Karaikudi & Kanadukathan</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="btn-explore-trail" onClick={() => { setSearchTerm('Chettinad'); handleSearch('Chettinad'); }}>Explore Chettinad Eateries ›</button>
                            </div>

                            {/* Chennai Coastal Card */}
                            <div className="trail-card">
                                <div className="card-header-bar">Chennai Coastal & Tiffin Trail</div>
                                <div className="card-images">
                                    <img src={filterCoffeeImg} alt="Filter Coffee" />
                                </div>
                                <div className="card-info">
                                    <div className="info-row">
                                        <span>🍲</span>
                                        <div>
                                            <span className="info-label">Signature Dishes</span>
                                            <span className="info-val">Filter Coffee, Ghee Podi Dosa, Fish Curry</span>
                                        </div>
                                    </div>
                                    <div className="info-row">
                                        <span>📍</span>
                                        <div>
                                            <span className="info-label">Popular Area</span>
                                            <span className="info-val">Mylapore & Marina Beach</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="btn-explore-trail" onClick={() => { setSearchTerm('Chennai'); handleSearch('Chennai'); }}>Explore Chennai Eateries ›</button>
                            </div>

                            {/* Kongu Nadu Card */}
                            <div className="trail-card">
                                <div className="card-header-bar">Kongu Nadu Native Specialties</div>
                                <div className="card-images">
                                    <img src={fishCurryImg} alt="Kongu Specialty" />
                                </div>
                                <div className="card-info">
                                    <div className="info-row">
                                        <span>🍲</span>
                                        <div>
                                            <span className="info-label">Signature Dishes</span>
                                            <span className="info-val">Pallipalayam Chicken, Arisi Paruppu Sadam</span>
                                        </div>
                                    </div>
                                    <div className="info-row">
                                        <span>📍</span>
                                        <div>
                                            <span className="info-label">Popular Area</span>
                                            <span className="info-val">Coimbatore & Erode</span>
                                        </div>
                                    </div>
                                </div>
                                <button className="btn-explore-trail" onClick={() => { setSearchTerm('Coimbatore'); handleSearch('Coimbatore'); }}>Explore Kongu Eateries ›</button>
                            </div>
                        </div>
                    )}
                </div>

                <Footer />
            </main>

            {/* Details Modal */}
            {selectedPlace && (
                <div className="modal-overlay" onClick={() => setSelectedPlace(null)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="close-modal" onClick={() => setSelectedPlace(null)}>&times;</button>

                        <div className="modal-header" style={{ padding: '24px 24px 10px 24px' }}>
                            <h2 style={{ fontFamily: 'Merriweather', color: '#810000', margin: '0 0 8px 0' }}>{selectedPlace.name}</h2>
                            <div className="modal-rating" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                                <span className="stars" style={{ background: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '6px', fontWeight: 'bold', fontSize: '0.85rem' }}>★ {selectedPlace.rating || '4.8'}</span>
                                <span className="reviews-count" style={{ color: '#666', fontSize: '0.85rem' }}>({selectedPlace.user_ratings_total || 150} reviews)</span>
                            </div>
                            <p className="modal-address" style={{ color: '#555', fontSize: '0.9rem', margin: 0 }}>📍 {selectedPlace.formatted_address}</p>
                        </div>

                        <div className="modal-gallery" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', padding: '0 24px', margin: '15px 0' }}>
                            {selectedPlace.photos?.slice(0, 4).map((photo, i) => (
                                <img key={i} src={photo.getUrl({ maxHeight: 300 })} alt={`${selectedPlace.name} view ${i + 1}`} style={{ width: '100%', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
                            ))}
                        </div>

                        <div className="modal-details-grid" style={{ padding: '0 24px 24px 24px' }}>
                            <div className="info-column" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {selectedPlace.formatted_phone_number && (
                                    <div className="info-item" style={{ background: '#fbf5f6', padding: '10px 14px', borderRadius: '8px' }}>
                                        <strong>Phone:</strong> {selectedPlace.formatted_phone_number}
                                    </div>
                                )}
                                {selectedPlace.website && (
                                    <div className="info-item" style={{ background: '#fbf5f6', padding: '10px 14px', borderRadius: '8px' }}>
                                        <strong>Website:</strong> <a href={selectedPlace.website} target="_blank" rel="noreferrer" style={{ color: '#810000', fontWeight: 'bold' }}>Visit Website</a>
                                    </div>
                                )}
                                <a href={selectedPlace.url} target="_blank" rel="noreferrer" className="btn-green" style={{ width: '100%', textAlign: 'center', marginTop: '10px', textDecoration: 'none' }}>
                                    Open in Google Maps
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {detailsLoading && (
                <div className="modal-overlay">
                    <div className="loading-spinner" style={{ background: 'white', padding: '20px 40px', borderRadius: '12px', fontWeight: 'bold', color: '#810000' }}>
                        Fetching eatery details...
                    </div>
                </div>
            )}
        </div>
    );
}
