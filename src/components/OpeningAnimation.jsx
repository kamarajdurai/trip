import React, { useState, useEffect, useRef } from 'react';
import './OpeningAnimation.css';

const OpeningAnimation = ({ onComplete }) => {
    // Shows on every new visit or page refresh
    const [isVisible, setIsVisible] = useState(true);
    const [isExiting, setIsExiting] = useState(false);
    const videoRef = useRef(null);
    const exitTimerRef = useRef(null);

    // Smooth exit animation & reveal website
    const handleExit = () => {
        if (isExiting) return;
        setIsExiting(true);

        // Allow 700ms for cinematic zoom & fade out
        exitTimerRef.current = setTimeout(() => {
            setIsVisible(false);
            if (onComplete) onComplete();
        }, 700);
    };

    // Play video on mount
    useEffect(() => {
        if (!isVisible) return;

        const video = videoRef.current;
        if (video) {
            video.currentTime = 0;
            video.play().catch((err) => {
                console.warn('Autoplay prevented by browser:', err);
                video.muted = true;
                video.play();
            });
        }

        // Keyboard handler: ESC or Space to skip immediately
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' || e.key === ' ') {
                handleExit();
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        // Lock body scrolling while intro is visible
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = prevOverflow;
            if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
        };
    }, [isVisible]);

    if (!isVisible) return null;

    return (
        <div 
            className={`opening-anim-overlay ${isExiting ? 'is-exiting' : ''}`}
            onClick={handleExit}
            title="Click anywhere to skip"
        >
            {/* Pure Clean Fullscreen Video Element */}
            <div className="opening-video-wrapper">
                <video
                    ref={videoRef}
                    className="opening-video-media"
                    src="/trip.mp4"
                    autoPlay
                    playsInline
                    muted
                    preload="auto"
                    onEnded={handleExit}
                />
            </div>
        </div>
    );
};

export default OpeningAnimation;
