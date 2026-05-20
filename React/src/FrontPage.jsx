import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Auth from './Auth';
import DashGallery from './components/DashGallery';
import ModernFeatures from './components/ModernFeatures';
import MagneticSignature from './components/MagneticSignature';
import { useTheme } from './ThemeContext';
import { API_BASE_URL } from './config';
import './FrontPage.css';

/* ── Page Loader ── */

// =========================================================
// ✈️ PLANE CONTROL PANEL - TWEAK THESE TO CHANGE THE FLIGHT
// =========================================================
// 💡 HOW IT WORKS:
// The screen's center is perfectly at 0vw (X) and 0vh (Y).
// 'vw' means percentage of screen width. 'vh' means percentage of screen height.
// Examples:
//    startX: '-100vw' -> Starts 1 full screen to the left
//    endX: '100vw'    -> Ends 1 full screen to the right
//    startY: '50vh'   -> Starts at the bottom of the screen
//    endY: '-50vh'    -> Ends at the top of the screen (negative is UP)

const PLANE_CONFIG = {
    // ⏱️ 1. SPEED / TIME
    duration: 5,       // Total seconds the flight takes. Lower = Faster, Higher = Slower.
    delay: 0,          // Seconds to wait before starting. (Keep 0 usually)

    // 🗺️ 2. START POSITION (Where does it fly FROM?)
    startX: '-120vw',  // Fly in from the left (off-screen)
    startY: '40vh',    // Fly in from the bottom

    // 🎯 3. END POSITION (Where does it fly TO?)
    endX: '120vw',     // Fly out to the right (off-screen)
    endY: '-40vh',     // Fly out towards the top

    // 🔍 4. SIZE & TILT
    startScale: 0.9,   // Starting size
    midScale: 1.4,     // Size in the middle of the screen
    endScale: 1.9,     // Final size before it disappears
    rotate: -10,       // Tilt angle (-10 means nose pointed slightly up)
};

// =========================================================
// 🎨 LOADER TEXT STYLE PANEL - TWEAK TEXT SIZE HERE!
// =========================================================
const LOADER_CONFIG = {
    textSize: 'clamp(1rem, 8vw, 15rem)', // Change this value to make the text bigger or smaller!
};

const PageLoader = ({ onDone }) => {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        window.scrollTo(0, 0);
        // Trigger exit instantly as the plane flies off the screen (at approx 82% of duration)
        const total = (PLANE_CONFIG.duration * 0.82 + PLANE_CONFIG.delay) * 1000;
        const t = setTimeout(() => {
            document.body.style.overflow = '';
            onDone();
        }, total);
        return () => clearTimeout(t);
    }, [onDone]);

    return (
        <motion.div
            className="page-loader"
            exit={{ clipPath: 'inset(0 0 100% 0)', transition: { duration: 0.45, ease: [0.76, 0, 0.24, 1] } }}
        >
            {/* Corner brackets */}
            <div className="loader-corner lc-tl" />
            <div className="loader-corner lc-tr" />
            <div className="loader-corner lc-bl" />
            <div className="loader-corner lc-br" />

            {/* Dotted route trail */}
            <div className="loader-trail" />

            {/* Airplane — pure CSS @keyframe for 120fps, NO JS per-frame work */}
            <div
                className="loader-airplane-wrap"
                style={{
                    '--plane-duration': `${PLANE_CONFIG.duration}s`,
                    '--plane-sx': PLANE_CONFIG.startX,
                    '--plane-sy': PLANE_CONFIG.startY,
                    '--plane-ex': PLANE_CONFIG.endX,
                    '--plane-ey': PLANE_CONFIG.endY,
                    '--plane-s0': PLANE_CONFIG.startScale,
                    '--plane-sm': PLANE_CONFIG.midScale,
                    '--plane-s1': PLANE_CONFIG.endScale,
                    '--plane-rot': `${PLANE_CONFIG.rotate}deg`,
                }}
            >
                <img src="/realistic_jet_v2.png" alt="3D Plane" className="real-3d-plane" />
            </div>

            {/* Main content */}
            <div className="loader-center">
                {/* Pulsing globe icon */}
                <motion.div
                    className="loader-globe"
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                >
                    🌍
                </motion.div>

                <motion.div
                    className="loader-tagline"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.15 }}
                >
                    FREE ABROAD EDUCATION AWAITS
                </motion.div>

                {/* Two-line staggered cursive word reveal */}
                <motion.div
                    className="loader-word"
                    initial="hidden"
                    animate="visible"
                    variants={{ visible: { transition: { staggerChildren: 0.22, delayChildren: 0.15 } } }}
                    style={{ '--loader-text-size': LOADER_CONFIG.textSize }}
                >
                    <div className="loader-line-1">
                        <motion.span
                            className="loader-cursive-word"
                            variants={{
                                hidden: { opacity: 0, y: 20, scale: 0.95 },
                                visible: {
                                    opacity: 1, y: 0, scale: 1,
                                    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
                                }
                            }}
                        >
                            Free Abroad
                        </motion.span>
                    </div>
                    <div className="loader-line-2">
                        <motion.span
                            className="loader-cursive-word"
                            variants={{
                                hidden: { opacity: 0, y: 20, scale: 0.95 },
                                visible: {
                                    opacity: 1, y: 0, scale: 1,
                                    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
                                }
                            }}
                        >
                            Education
                        </motion.span>
                    </div>
                </motion.div>

                {/* Destination badge */}
                <motion.div
                    className="loader-dest-badge"
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, delay: 0.6 }}
                >
                    <span className="dest-dot" />
                    <span>Italy · Germany · Abroad</span>
                </motion.div>

                {/* Progress bar */}
                <div className="loader-bar-track">
                    <motion.div
                        className="loader-bar-fill"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ duration: PLANE_CONFIG.duration * 0.82 - 0.2, delay: PLANE_CONFIG.delay, ease: [0.22, 1, 0.36, 1] }}
                        style={{ originX: 0 }}
                    />
                </div>

                <motion.div
                    className="loader-counter"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.3 }}
                >
                    <CountUp duration={(PLANE_CONFIG.duration * 0.82 - 0.2) * 1000} delay={PLANE_CONFIG.delay * 1000} />
                </motion.div>
            </div>
        </motion.div>
    );
};

/* Simple CSS counter via keyframes — no dependency */
const CountUp = ({ duration, delay }) => {
    const [n, setN] = React.useState(0);
    useEffect(() => {
        const start = Date.now();
        const raf = () => {
            const p = Math.min((Date.now() - start) / duration, 1);
            setN(Math.floor(p * 100));
            if (p < 1) requestAnimationFrame(raf);
        };
        const id = setTimeout(() => requestAnimationFrame(raf), delay);
        return () => clearTimeout(id);
    }, [duration, delay]);
    return <span className="loader-counter-num">{n}%</span>;
};



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
    const [loading, setLoading] = useState(true);
    // `revealed` becomes true only AFTER the loader exit animation completes (0.9s)
    const [revealed, setRevealed] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        fetch(`${API_BASE_URL}/auth/me`, { credentials: 'include' })
            .then(res => setIsLoggedIn(res.ok))
            .catch(() => setIsLoggedIn(false));
    }, []);

    // Silent visitor tracking — fire-and-forget, never blocks the page
    useEffect(() => {
        try {
            fetch(`${API_BASE_URL}/visitors/track`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-csrf-protected': '1' },
                body: JSON.stringify({
                    referrer: document.referrer || 'Direct',
                    page: window.location.pathname || '/',
                }),
                keepalive: true,
            }).catch(() => {}); // silently ignore any network errors
        } catch (_) {}
    }, []);

    // Scroll reset on mount
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'instant' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
    }, []);

    // When loader finishes, wait for its exit animation (0.6s) THEN reveal content
    useEffect(() => {
        if (!loading) {
            const t = setTimeout(() => {
                setRevealed(true);
                window.scrollTo({ top: 0, behavior: 'instant' });
                document.documentElement.scrollTop = 0;
                document.body.scrollTop = 0;
            }, 600); // Wait for the faster loader exit to finish
            return () => clearTimeout(t);
        }
    }, [loading]);

    const openAuth = (mode, role = 'partner') => {
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
        <>
            <AnimatePresence mode="wait">
                {loading && <PageLoader key="loader" onDone={() => setLoading(false)} />}
            </AnimatePresence>

            <motion.div
                className="front-page-universe"
                onMouseMove={handleMouseMove}
                initial={{ opacity: 0 }}
                animate={!loading ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
            >
                {/* Animated blurry orb background */}
                <div className="fp-bg-glow">
                    <div className="fp-glow-orb fp-glow-orb-1" />
                    <div className="fp-glow-orb fp-glow-orb-2" />
                </div>

                {/* ── NAV ── */}
                <motion.nav
                    className="front-nav"
                    initial={{ opacity: 0, y: -20 }}
                    animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                >
                    <div className="front-logo-wrap">
                        <img src="/logo.png" alt="CounselFlow Logo" className="front-logo" />
                    </div>

                    <button
                        className={`mobile-menu-btn ${mobileMenuOpen ? 'open' : ''}`}
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        <span className="burger-bar"></span>
                        <span className="burger-bar"></span>
                        <span className="burger-bar"></span>
                    </button>

                    <motion.div
                        className={`front-nav-buttons ${mobileMenuOpen ? 'open' : ''}`}
                        initial={{ opacity: 0 }}
                        animate={revealed ? { opacity: 1 } : { opacity: 0 }}
                        transition={{ duration: 0.4, delay: 0.15 }}
                    >
                        <button className="btn-theme-toggle" onClick={() => { toggleTheme(); setMobileMenuOpen(false); }}
                            aria-label={`Switch to ${activeTheme === 'dark' ? 'light' : 'dark'} mode`}>
                            {activeTheme === 'dark' ? <SunIcon /> : <MoonIcon />}
                        </button>
                        <button onClick={() => { openAuth('login'); setMobileMenuOpen(false); }} className="btn-ghost">Login</button>
                        <button onClick={() => { openAuth('signup'); setMobileMenuOpen(false); }} className="btn-primary-glow">Register</button>
                    </motion.div>
                </motion.nav>

                {/* ── MAIN ── */}
                <main className="front-main-content">

                    {/* HERO — animates AFTER loader exit completes */}
                    <motion.section
                        className="hero-section"
                        initial={{ opacity: 0, y: 30 }}
                        animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                        transition={{ duration: 0.6, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={revealed ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.5, delay: 0.15 }}
                            className="hero-brand-heading"
                        >
                            The Study Abroad CRM Ecosystem
                        </motion.div>
                        <motion.h1
                            className="main-title"
                            initial={{ opacity: 0, y: 20 }}
                            animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                            transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
                        >
                            Course Finder <span className="title-gradient">Italy</span>
                        </motion.h1>
                        <motion.p
                            className="main-subtitle"
                            initial={{ opacity: 0, y: 15 }}
                            animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                            transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
                        >
                            A powerful, all‑in‑one management platform for educational consultants and students traveling to Italy. Streamline workflows, manage applications, and track success with precision.
                        </motion.p>
                    </motion.section>

                    {/* DASHBOARD GALLERY — animates in after page reveals */}
                    <motion.section
                        className="dashboard-grid-section"
                        initial={{ opacity: 0, y: 40 }}
                        animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
                        transition={{ duration: 0.7, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <motion.h2
                            className="section-title-alt"
                            initial={{ opacity: 0, y: 15 }}
                            animate={revealed ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                            transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
                        >
                            Powerful Dashboards for <span className="title-gradient">Total Control</span>
                        </motion.h2>
                        <DashGallery />
                    </motion.section>

                    {/* BENEFITS SECTION — Split Layout */}
                    <motion.section
                        className="benefits-education-section"
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-80px" }}
                        variants={{ visible: { transition: { staggerChildren: 0.1 } }, hidden: {} }}
                    >
                        <div className="benefits-split">
                            {/* LEFT — 100% Scholarship Hero */}
                            <motion.div
                                className="bs-left-hero"
                                variants={{
                                    hidden: { opacity: 0, x: -30 },
                                    visible: { opacity: 1, x: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
                                }}
                                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                            >
                                <div className="bs-hero-icon">🎓</div>
                                <div className="bs-hero-badge">FULLY FUNDED</div>
                                <div className="bs-hero-value loop-text">100%<br />Scholarship</div>
                                <div className="bs-hero-sub">Study in Italy. Zero tuition.<br />Full government support.</div>
                                <div className="bs-loop-sheen" />
                            </motion.div>

                            {/* RIGHT — Title & List */}
                            <div className="bs-right-content">
                                <motion.h3
                                    className="bs-right-title"
                                    variants={{
                                        hidden: { opacity: 0, y: -10 },
                                        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
                                    }}
                                >
                                    Benefits of Study in Italy
                                </motion.h3>

                                <div className="bs-right-grid">
                                    {[
                                        { icon: '💰', value: '₹0', label: 'Tuition Fee', sub: 'Zero cost', accent: '#8b5cf6' },
                                        { icon: '💶', value: '₹8L', label: 'Stipend', sub: 'Paid annually', accent: '#06b6d4' },
                                        { icon: '🏠', value: 'FREE', label: 'Accommodation*', sub: 'Fully covered', accent: '#10b981' }
                                    ].map(({ icon, value, label, sub, accent }, i) => (
                                        <motion.div
                                            key={label}
                                            className="bs-mini-card"
                                            style={{ '--c': accent }}
                                            variants={{
                                                hidden: { opacity: 0, y: 20 },
                                                visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 + 0.1 * i } }
                                            }}
                                            whileHover={{ y: -4, transition: { duration: 0.2 } }}
                                        >
                                            <div className="bs-mc-icon">{icon}</div>
                                            <div className="bs-mc-text-group">
                                                <div className="bs-mc-value" style={{ color: accent }}>{value}</div>
                                                <div className="bs-mc-label">{label}</div>
                                                <div className="bs-mc-sub">{sub}</div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.section>

                    <div style={{ marginTop: '-30px', width: '100%' }}>
                        <ModernFeatures openAuth={openAuth} />
                    </div>
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
                            <p>Simplifying study abroad applications platform.</p>
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
                        <MagneticSignature />
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
            </motion.div>
        </>
    );
};

export default FrontPage;
