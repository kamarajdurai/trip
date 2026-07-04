import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTripContext } from '../context/TripContext';
import '../assets/css/style.css'; // Importing global styles

import { auth, db } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';

const Navbar = () => {
    const { t, i18n } = useTranslation();
    const { isDarkMode, toggleTheme } = useTripContext();
    const [scrolled, setScrolled] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        let unsubscribeProfile = null;

        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);

            // Clean up previous profile listener if it exists
            if (unsubscribeProfile) {
                unsubscribeProfile();
                unsubscribeProfile = null;
            }

            if (currentUser) {
                // Set up real-time listener for the user's profile
                unsubscribeProfile = onSnapshot(doc(db, 'users', currentUser.uid), (snapshot) => {
                    if (snapshot.exists()) {
                        setProfile(snapshot.data());
                    }
                });
            } else {
                setProfile(null);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeProfile) unsubscribeProfile();
        };
    }, []);

    const handleLogout = async () => {
        try {
            await signOut(auth);
            closeSidebar();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'ta', name: 'தமிழ்' },
        { code: 'ml', name: 'മലയാളം' },
        { code: 'kn', name: 'ಕನ್ನಡ' },
        { code: 'hi', name: 'हिन्दी' },
        { code: 'te', name: 'తెలుగు' }
    ];

    const changeLanguage = (lng) => {
        i18n.changeLanguage(lng);
    };

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
        document.body.style.overflow = !sidebarOpen ? 'hidden' : 'auto';
    };

    const closeSidebar = () => {
        setSidebarOpen(false);
        document.body.style.overflow = 'auto';
    };

    return (
        <>
            <nav className={`stitch-navbar ${scrolled ? 'stitch-navbar--scrolled' : ''}`}>
                <div className="stitch-navbar__inner">
                    {/* Logo */}
                    <Link to="/" className="stitch-navbar__logo">
                        <span className="stitch-navbar__logo-tn">TN</span>
                        <span className="stitch-navbar__logo-verse">verse</span>
                    </Link>

                    {/* Desktop Nav Links */}
                    <div className="stitch-navbar__links">
                        <Link to="/home" className={`stitch-navbar__link ${location.pathname === '/home' ? 'stitch-navbar__link--active' : ''}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>home</span>
                            {t('navbar.home')}
                        </Link>
                        <Link to="/plan-trip" className={`stitch-navbar__link ${location.pathname === '/plan-trip' ? 'stitch-navbar__link--active' : ''}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>map</span>
                            {t('navbar.plan_trip')}
                        </Link>
                        <Link to="/ar" className={`stitch-navbar__link ${location.pathname === '/ar' ? 'stitch-navbar__link--active' : ''}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>inventory_2</span>
                            {t('navbar.ar')}
                        </Link>
                        <Link to="/vr" className={`stitch-navbar__link ${location.pathname === '/vr' ? 'stitch-navbar__link--active' : ''}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>vrpano</span>
                            {t('navbar.vr')}
                        </Link>
                        <Link to="/where-to-go" className={`stitch-navbar__link ${location.pathname === '/where-to-go' ? 'stitch-navbar__link--active' : ''}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>location_on</span>
                            {t('navbar.where_to_go') || 'Where to Go'}
                        </Link>
                    </div>

                    {/* Actions */}
                    <div className="stitch-navbar__actions">
                        {/* Language Dropdown */}
                        <div className="stitch-navbar__lang-wrapper">
                            <select
                                className="stitch-navbar__lang-select"
                                onChange={(e) => changeLanguage(e.target.value)}
                                value={i18n.language.split('-')[0]}
                            >
                                {languages.map(lang => (
                                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                                ))}
                            </select>
                            <span className="material-symbols-outlined stitch-navbar__lang-icon">expand_more</span>
                        </div>

                        {/* Hamburger for mobile */}
                        <button
                            className={`stitch-navbar__hamburger ${sidebarOpen ? 'open' : ''}`}
                            onClick={toggleSidebar}
                            aria-label="Toggle navigation"
                        >
                            <div className="stitch-navbar__hamburger-bar"></div>
                            <div className="stitch-navbar__hamburger-bar"></div>
                            <div className="stitch-navbar__hamburger-bar"></div>
                        </button>

                        {/* Desktop Profile / Auth */}
                        <div className="stitch-navbar__auth-buttons">
                            {user ? (
                                <button
                                    onClick={toggleSidebar}
                                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.8rem', color: '#810000', display: 'flex', alignItems: 'center' }}
                                >
                                    <i className="fa-solid fa-circle-user"></i>
                                </button>
                            ) : (
                                <>
                                    <button
                                        className="stitch-navbar__btn stitch-navbar__btn--login"
                                        onClick={() => navigate('/login')}
                                    >
                                        Login
                                    </button>
                                    <button
                                        className="stitch-navbar__btn stitch-navbar__btn--signup"
                                        onClick={() => navigate('/signup')}
                                    >
                                        Signup
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Slide-in Panel */}
            <nav className={`stitch-panel ${sidebarOpen ? 'open' : ''}`} aria-hidden={!sidebarOpen}>
                <div className="stitch-panel__header">
                    <div className="stitch-panel__avatar">
                        <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>person</span>
                    </div>
                    {user ? (
                        <>
                            <h3 className="stitch-panel__name">{profile?.name || 'User'}</h3>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', margin: '4px 0' }}>@{profile?.username || 'username'}</p>
                            {profile?.location && (
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', marginTop: '5px' }}>
                                    <i className="fa-solid fa-location-dot" style={{ marginRight: '5px' }}></i>
                                    {profile.location}
                                </p>
                            )}
                        </>
                    ) : (
                        <h3 className="stitch-panel__name">Guest Traveller</h3>
                    )}
                </div>

                <div className="stitch-panel__divider-label">{t('navbar.menu')}</div>

                <Link to="/home" onClick={closeSidebar} className="stitch-panel__link">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>home</span> {t('navbar.home')}
                </Link>
                <Link to="/plan-trip" onClick={closeSidebar} className="stitch-panel__link">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>map</span> {t('navbar.plan_trip')}
                </Link>
                <Link to="/booking" onClick={closeSidebar} className="stitch-panel__link">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>hotel</span> {t('navbar.hotel_booking')}
                </Link>
                <Link to="/guide" onClick={closeSidebar} className="stitch-panel__link">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>support_agent</span> {t('navbar.guide_booking')}
                </Link>

                <div className="stitch-panel__divider"></div>
                <div className="stitch-panel__divider-label">Account</div>

                <Link to="/trip-history" onClick={closeSidebar} className="stitch-panel__link">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>history</span> Trip History
                </Link>
                <Link to="/wallet" onClick={closeSidebar} className="stitch-panel__link">
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>account_balance_wallet</span> Travel Wallet
                </Link>

                <div className="stitch-panel__auth" style={{ marginTop: '20px' }}>
                    {user ? (
                        <button
                            className="stitch-panel__btn stitch-panel__btn--login"
                            onClick={handleLogout}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>logout</span> Logout
                        </button>
                    ) : (
                        <>
                            <button
                                className="stitch-panel__btn stitch-panel__btn--login"
                                onClick={() => { closeSidebar(); navigate('/login'); }}
                            >
                                Login
                            </button>
                            <button
                                className="stitch-panel__btn stitch-panel__btn--signup"
                                onClick={() => { closeSidebar(); navigate('/signup'); }}
                            >
                                Signup
                            </button>
                        </>
                    )}
                </div>
            </nav>

            {/* Overlay */}
            {sidebarOpen && (
                <div className="stitch-panel__overlay" onClick={closeSidebar} />
            )}
        </>
    );
};

export default Navbar;
