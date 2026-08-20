import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
    return (
        <footer className="main-footer">
            <div className="footer-content">
                <div className="footer-section">
                    <h3 className="footer-logo">TN<span>Verse</span></h3>
                    <p>Exploring the unseen beauty of Tamil Nadu. Your journey, our passion.</p>
                </div>

                <div className="footer-links">
                    <div className="link-group">
                        <h4>Platform</h4>
                        <Link to="/home">Home</Link>
                        <Link to="/plan-trip">Plan Trip</Link>
                        <Link to="/trip-history">Adventures</Link>
                        <Link to="/wallet">Wallet</Link>
                    </div>
                    <div className="link-group">
                        <h4>Experiences</h4>
                        <Link to="/where-to-go">Where to Go</Link>
                        <Link to="/ar">AR Experience</Link>
                        <Link to="/vr">Virtual Reality</Link>
                        <Link to="/booking">Hotel Booking</Link>
                    </div>
                </div>

                <div className="footer-social">
                    <div className="social-icons">
                        <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram"><i className="fa-brands fa-instagram"></i></a>
                        <a href="https://twitter.com" target="_blank" rel="noreferrer" aria-label="Twitter"><i className="fa-brands fa-twitter"></i></a>
                        <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="Facebook"><i className="fa-brands fa-facebook"></i></a>
                        <a href="https://youtube.com" target="_blank" rel="noreferrer" aria-label="YouTube"><i className="fa-brands fa-youtube"></i></a>
                    </div>
                    <p className="copyright">&copy; 2026 TNVerse. All rights reserved.</p>
                </div>
            </div>
            <div className="footer-bottom-line"></div>
        </footer>
    );
};

export default Footer;
