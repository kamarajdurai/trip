import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from '../components/Footer';
import '../assets/css/style.css';
import { usePageTitle } from '../hooks';
import Navbar from '../components/Navbar';

class HomeParticle {
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
        ctx.fillStyle = 'rgba(128, 0, 32, 0.6)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

const Home = () => {
    usePageTitle('Premium Travel & Tourism + Instagram Feed');

    const navigate = useNavigate();
    const { t } = useTranslation();
    const canvasRef = React.useRef(null);
    const sectionRef = React.useRef(null);

    // Particle Background System (Optimized for High Performance & Low CPU)
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
        // Optimized count to keep CPU usage < 1%
        const isMobile = window.innerWidth < 768;
        const particleCount = isMobile ? 18 : 35;
        let animationFrameId;
        let isVisible = false;

        const initParticles = () => {
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push(new HomeParticle(canvas.width, canvas.height));
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

                    if (distSq < 6400) { // 80px distance squared (avoids Math.sqrt)
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

    // Cursor Glow Logic (Scoped to Section)
    useEffect(() => {
        const section = sectionRef.current;
        const cursorGlow = section?.querySelector('.cursor-glow');
        if (!section || !cursorGlow) return;

        const handleMouseMove = (e) => {
            const rect = section.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            cursorGlow.style.left = x + 'px';
            cursorGlow.style.top = y + 'px';
            cursorGlow.style.opacity = '1';
        };

        const handleMouseLeave = () => {
            cursorGlow.style.opacity = '0';
        };

        section.addEventListener('mousemove', handleMouseMove);
        section.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            section.removeEventListener('mousemove', handleMouseMove);
            section.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    // Initial theme check removed background effect to avoid interference
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    // Observer for fade-in
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                }
            });
        });

        const targets = document.querySelectorAll('.fade-in-section');
        targets.forEach(target => observer.observe(target));

        return () => observer.disconnect();
    }, []);

    return (
        <div className="home-container">
            <Navbar />

            {/* Hero Section — Stitch Cinematic Style */}
            <section className="stitch-hero">
                {/* Background Image */}
                <div className="stitch-hero__bg">
                    <picture>
                        <source media="(max-width: 768px)" srcSet="/temple.webp" />
                        <img
                            src="/sunset.webp"
                            alt="Meenakshi Temple Sunrise"
                            className="stitch-hero__img"
                            width="1920"
                            height="1080"
                            fetchPriority="high"
                            decoding="async"
                        />
                    </picture>
                    <div className="stitch-hero__overlay"></div>
                </div>

                {/* Content */}
                <div className="stitch-hero__content">
                    <h1 className="stitch-hero__title">
                        Tamil Nadu Tourism - <br />
                        <span className="stitch-hero__title-italic">Where Stories Come Alive</span>
                    </h1>

                    <div className="stitch-hero__buttons">
                        <button className="stitch-hero__btn stitch-hero__btn--ar" onClick={() => navigate('/ar')}>
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>view_in_ar</span>
                            <span>AR EXPERIENCE</span>
                        </button>
                        <button className="stitch-hero__btn stitch-hero__btn--vr" onClick={() => navigate('/vr')}>
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>vrpano</span>
                            <span>VIRTUAL REALITY</span>
                        </button>
                    </div>
                </div>

                {/* Scroll Indicator */}
                <div className="stitch-hero__scroll-hint">
                    <span className="stitch-hero__scroll-text">Scroll to Discover</span>
                    <span className="material-symbols-outlined stitch-hero__scroll-icon">expand_more</span>
                </div>
            </section>

            {/* Wrapped Content with Unified Particle Background */}
            <main className="main-content-wrapper" ref={sectionRef}>
                <canvas ref={canvasRef} id="particleCanvas"></canvas>
                <div className="cursor-glow"></div>

                {/* Quick Stats Trust Banner */}
                <section className="tn-stats-banner" style={{ display: 'flex', justifyContent: 'center', gap: '30px', flexWrap: 'wrap', padding: '30px 20px', background: 'rgba(255, 255, 255, 0.75)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(129,0,0,0.08)', position: 'relative', zIndex: 10 }}>
                    <div style={{ textAlign: 'center', minWidth: '130px' }}>
                        <div style={{ fontSize: '2rem', fontWeight: '800', color: '#810000' }}>150+</div>
                        <div style={{ fontSize: '0.85rem', color: '#555', fontWeight: '500' }}>Iconic Destinations</div>
                    </div>
                    <div style={{ textAlign: 'center', minWidth: '130px' }}>
                        <div style={{ fontSize: '2rem', fontWeight: '800', color: '#810000' }}>50,000+</div>
                        <div style={{ fontSize: '0.85rem', color: '#555', fontWeight: '500' }}>Happy Travelers</div>
                    </div>
                    <div style={{ textAlign: 'center', minWidth: '130px' }}>
                        <div style={{ fontSize: '2rem', fontWeight: '800', color: '#810000' }}>4.9 ★</div>
                        <div style={{ fontSize: '0.85rem', color: '#555', fontWeight: '500' }}>Experience Rating</div>
                    </div>
                    <div style={{ textAlign: 'center', minWidth: '130px' }}>
                        <div style={{ fontSize: '2rem', fontWeight: '800', color: '#810000' }}>100%</div>
                        <div style={{ fontSize: '0.85rem', color: '#555', fontWeight: '500' }}>Verified Guides</div>
                    </div>
                </section>

                {/* Tamil Nadu Wonders Section */}
                <section id="tn-wonders">
                    <div className="tn-header">
                        <h2>{t('home.wonders_title')}</h2>
                        <p>{t('home.wonders_subtitle')}</p>
                    </div>
                    <div className="tn-cards-container">
                        {/* Card 1 */}
                        <div className="tn-card" onClick={() => navigate('/culinary')} style={{ cursor: 'pointer' }}>
                            <img src="/tn verse/src/memories-cuisine.webp" alt="Culinary Tourism" width="400" height="280" loading="lazy" decoding="async" />
                            <div className="tn-card-content">
                                <h3>{t('home.culinary_title')}</h3>
                                <p>{t('home.culinary_desc')}</p>
                                <button className="explore-btn-3d" style={{ marginTop: '10px', width: '100%' }}>Explore Cuisine →</button>
                            </div>
                        </div>
                        {/* Card 2 */}
                        <div className="tn-card" onClick={() => navigate('/agri')} style={{ cursor: 'pointer' }}>
                            <img src="/tn verse/src/agri.webp" alt="Agri & Rural Tourism" width="400" height="280" loading="lazy" decoding="async" />
                            <div className="tn-card-content">
                                <h3>{t('home.agri_title')}</h3>
                                <p>{t('home.agri_desc')}</p>
                                <button className="explore-btn-3d" style={{ marginTop: '10px', width: '100%' }}>Explore Villages →</button>
                            </div>
                        </div>
                        {/* Card 3 */}
                        <div className="tn-card" onClick={() => navigate('/medical')} style={{ cursor: 'pointer' }}>
                            <img src="/tn verse/src/medical.webp" alt="Wellness & Medical Tourism" width="400" height="280" loading="lazy" decoding="async" />
                            <div className="tn-card-content">
                                <h3>{t('home.wellness_title')}</h3>
                                <p>{t('home.wellness_desc')}</p>
                                <button className="explore-btn-3d" style={{ marginTop: '10px', width: '100%' }}>Explore Wellness →</button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* AR Experience Section (Zig-Zag: Text Left, Image Right) */}
                <section className="zig-zag-section fade-in-section">
                    <div className="zig-zag-container">
                        <div className="zig-zag-row">
                            <div className="zig-zag-content">
                                <h2>{t('ar.title')}</h2>
                                <p>{t('ar.subtitle')}</p>
                                <button className="btn-premium" onClick={() => navigate('/ar')}>
                                    {t('common.start_exploring')}
                                </button>
                            </div>
                            <div className="zig-zag-image">
                                <img src="/tn verse/src/ar_preview.webp" alt="AR Experience Preview" loading="lazy" decoding="async" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* VR Experience Section (Zig-Zag: Image Left, Text Right) */}
                <section className="zig-zag-section fade-in-section">
                    <div className="zig-zag-container">
                        <div className="zig-zag-row reverse">
                            <div className="zig-zag-content">
                                <h2>{t('vr.title')}</h2>
                                <p>{t('vr.select_desc')}</p>
                                <button className="btn-premium" onClick={() => navigate('/vr')}>
                                    {t('common.explore_now')}
                                </button>
                            </div>
                            <div className="zig-zag-image">
                                <img src="/where-to-go/gangai_vr.jpg" alt="VR Experience Preview" loading="lazy" decoding="async" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Waterfall Timeline Section */}
                <section id="historical-timeline" className="fade-in-section">
                    <div className="section-header-centered">
                        <h2>{t('home.timeline_title')}</h2>
                        <p>{t('home.timeline_subtitle')}</p>
                    </div>

                    <div className="timeline-waterfall">
                        <div className="timeline-center-line"></div>

                        {[
                            { title: 'Sangam Era', desc: 'The golden age of Tamil literature and early civilization.', icon: '📜' },
                            { title: 'The Great Cholas', desc: 'The rise of the maritime empire and architectural marvels like Brihadisvara.', icon: '🏛️' },
                            { title: 'Modern Era', desc: "Tamil Nadu's growth as a technological and cultural hub of India.", icon: '🏙️' }
                        ].map((item, idx) => (
                            <motion.div
                                key={idx}
                                className={`timeline-item-wf ${idx % 2 === 0 ? 'left' : 'right'}`}
                                initial={{ opacity: 0, x: idx % 2 === 0 ? -100 : 100, y: 50 }}
                                whileInView={{ opacity: 1, x: 0, y: 0 }}
                                viewport={{ once: true, margin: "-100px" }}
                                transition={{ duration: 0.8, delay: idx * 0.2, type: "spring" }}
                            >
                                <div className="timeline-dot-wf">
                                    <span className="dot-inner"></span>
                                </div>
                                <div className="timeline-card-wf">
                                    <div className="wf-card-icon">{item.icon}</div>
                                    <h3>{item.title}</h3>
                                    <p>{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </section>

                {/* About Us Section */}
                <section id="about-us" className="fade-in-section">
                    <div className="about-container">
                        <div className="about-text">
                            <h2>{t('home.about_title')}</h2>
                            <p>{t('home.about_desc')}</p>
                            <motion.button
                                className="btn-plan-now"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => navigate('/plan-trip')}
                            >
                                {t('navbar.plan_trip')} <i className="fa-solid fa-arrow-right"></i>
                            </motion.button>
                        </div>
                        <div className="about-image">
                            <img src="/tn verse/src/tour.webp" alt="Tamil Nadu Tourism" width="600" height="400" loading="lazy" decoding="async" />
                            <div className="image-overlay-subtle"></div>
                        </div>
                    </div>
                </section>

                <Footer />
            </main >
        </div >
    );
};

export default Home;
