import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Auth from './Auth';
import DashGallery from './components/DashGallery';
import ModernFeatures from './components/ModernFeatures';
import { useTheme } from './ThemeContext';
import { API_BASE_URL } from './config';
import './FrontPage.css';

/* Sun SVG icon */
const SunIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
);

/* Moon SVG icon */
const MoonIcon = () => (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
);

const FrontPage = () => {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const [authRole, setAuthRole] = useState('student');
    const { activeTheme, setTheme } = useTheme();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        fetch(`${API_BASE_URL}/auth/me`, { credentials: 'include' })
            .then(res => setIsLoggedIn(res.ok))
            .catch(() => setIsLoggedIn(false));
    }, []);



    const openAuth = (mode, role = 'student') => {
        setAuthMode(mode);
        setAuthRole(role);
        setShowAuthModal(true);
    };

    const toggleTheme = () => setTheme(activeTheme === 'dark' ? 'light' : 'dark');

    const handleMouseMove = (e) => {
        const x = (e.clientX / window.innerWidth) * 100;
        const y = (e.clientY / window.innerHeight) * 100;
        document.documentElement.style.setProperty('--mouse-x', `${x}%`);
        document.documentElement.style.setProperty('--mouse-y', `${y}%`);
    };

    return (
        <div className="front-page-universe" onMouseMove={handleMouseMove}>
            {/* Animated blurry orb background */}
            <div className="fp-bg-glow">
                <div className="fp-glow-orb fp-glow-orb-1" />
                <div className="fp-glow-orb fp-glow-orb-2" />
            </div>

            {/* ── NAV ── */}
            <nav className="front-nav">
                <div className="front-logo-wrap">
                    <img src="/logo.png" alt="CounselFlow Logo" className="front-logo" />
                </div>

                <div className="front-nav-buttons">
                    <button className="btn-theme-toggle" onClick={toggleTheme}
                        aria-label={`Switch to ${activeTheme === 'dark' ? 'light' : 'dark'} mode`}>
                        {activeTheme === 'dark' ? <SunIcon /> : <MoonIcon />}
                    </button>
                    <button onClick={() => openAuth('login')} className="btn-ghost">Login</button>
                    <button onClick={() => openAuth('signup')} className="btn-primary-glow">Register</button>


                </div>
            </nav>

            {/* ── MAIN ── */}
            <main className="front-main-content">

                {/* HERO */}
                <motion.section
                    className="hero-section"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="hero-brand-heading"
                    >
                        The Study Abroad CRM Ecosystem
                    </motion.div>
                    <h1 className="main-title">
                        Course Finder <span className="title-gradient">Italy</span>
                    </h1>
                    <p className="main-subtitle">
                        A powerful, all‑in‑one management platform for educational consultants
                        and students traveling to Italy. Streamline workflows, manage
                        applications, and track success with precision.
                    </p>
                </motion.section>

                {/* DASHBOARD GALLERY */}
                <motion.section
                    className="dashboard-grid-section"
                    initial={{ opacity: 0, y: 60 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.9, ease: "easeOut", delay: 0.1 }}
                >
                    <h2 className="section-title-alt">
                        Powerful Dashboards for <span className="title-gradient">Total Control</span>
                    </h2>
                    <DashGallery />
                </motion.section>

                <ModernFeatures openAuth={openAuth} />
            </main>

            {/* ── FOOTER ── */}
            <motion.footer
                className="front-footer"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
            >
                <div className="footer-content">
                    <div className="footer-logo-section">
                        <div className="front-logo-wrap footer-logo-wrap">
                            <img src="/logo.png" alt="CounselFlow Logo" className="front-logo" />
                        </div>
                        <p>Simplifying study abroad applications from start to finish.</p>
                    </div>
                    <div className="footer-links-group">
                        <div className="footer-col">
                            <h4>Platform</h4>
                            <a href="#">Feature Overview</a>
                            <a href="#">For Students</a>
                            <a href="#">For Partners</a>
                        </div>
                        <div className="footer-col">
                            <h4>Resources</h4>
                            <a href="#">Help Center</a>
                            <a href="#">Contact Support</a>
                            <a href="#">System Status</a>
                        </div>
                        <div className="footer-col">
                            <h4>Legal</h4>
                            <a href="#">Privacy Policy</a>
                            <a href="#">Terms of Service</a>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; {new Date().getFullYear()} CounselFlow. All rights reserved.</p>
                    <p className="designer-credit">Designer @NEET</p>
                </div>
            </motion.footer>

            {/* ── AUTH MODAL ── */}
            {showAuthModal && (
                <div className="auth-modal-overlay" onClick={() => setShowAuthModal(false)}>
                    <div className="auth-modal-box" onClick={e => e.stopPropagation()}>
                        <Auth isModal initialMode={authMode} initialRole={authRole} onClose={() => setShowAuthModal(false)} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default FrontPage;
