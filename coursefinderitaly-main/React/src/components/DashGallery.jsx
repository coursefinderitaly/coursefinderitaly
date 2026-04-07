import React, { useRef, useEffect, useState, useCallback } from 'react';
import gsap from 'gsap';
import './DashGallery.css';

const ITEMS = [
    { id: 1, src: '/dash-1.png', label: 'B2B Partner Dashboard' },
    { id: 2, src: '/dash-2.png', label: 'Partner Dark Mode' },
    { id: 3, src: '/dash-3.png', label: 'Student Dashboard' },
    { id: 4, src: '/dash-4.png', label: 'University Search' },
    { id: 5, src: '/dash-5.png', label: 'Search Dark' },
    { id: 6, src: '/dash-6.png', label: 'Student Directory Dark' },
    { id: 7, src: '/dash-7.png', label: 'Student Directory' },
    { id: 8, src: '/dash-8.png', label: 'Application Submission' },
    { id: 9, src: '/dash-9.png', label: 'Success Confirmation' },
];

/* ─── Lightbox ──────────────────────────────── */
const Lightbox = ({ item, onClose }) => {
    const backdropRef = useRef(null);
    const boxRef      = useRef(null);

    useEffect(() => {
        gsap.fromTo(backdropRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: 'power2.out' });
        gsap.fromTo(boxRef.current,
            { opacity: 0, scale: 0.84, y: 40 },
            { opacity: 1, scale: 1,    y: 0,  duration: 0.42, ease: 'back.out(1.6)' }
        );
        const onKey = (e) => { if (e.key === 'Escape') animClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    const animClose = () => {
        gsap.to(backdropRef.current, { opacity: 0, duration: 0.22 });
        gsap.to(boxRef.current, { opacity: 0, scale: 0.88, y: 20, duration: 0.28, onComplete: onClose });
    };

    return (
        <div ref={backdropRef} className="lb-backdrop" onClick={animClose}>
            <div ref={boxRef} className="lb-box" onClick={(e) => e.stopPropagation()}>
                <button className="lb-close" onClick={animClose} aria-label="Close">✕</button>
                <img src={item.src} alt={item.label} className="lb-img" />
            </div>
        </div>
    );
};

/* ─── 3D Carousel Gallery ──────────────────── */
const DashGallery = () => {
    const [centerIdx, setCenterIdx] = useState(0);
    const [expanded, setExpanded]   = useState(null);
    const cardsRef = useRef([]);
    const isAnimating = useRef(false);

    // How many visible cards on each side of center. 4 means all 9 objects exist physically seamlessly
    const VISIBLE_SIDE = 4;

    const getCardStyle = useCallback((itemIndex) => {
        const total = ITEMS.length;
        // Compute offset from center, wrapping around
        let offset = itemIndex - centerIdx;
        if (offset > total / 2) offset -= total;
        if (offset < -total / 2) offset += total;

        const absOffset = Math.abs(offset);

        if (absOffset > VISIBLE_SIDE) {
            return { opacity: 0, scale: 0.5, x: offset > 0 ? 600 : -600, z: -400, rotateY: 0, zIndex: 0, display: 'none' };
        }

        const xSpacing = 230;
        const x = offset * xSpacing;
        const z = -absOffset * 120;
        const rotateY = offset * -15;
        const scale = 1 - absOffset * 0.1;
        const opacity = 1;
        const zIndex = VISIBLE_SIDE + 1 - absOffset;

        return { opacity, scale, x, z, rotateY, zIndex, display: 'block' };
    }, [centerIdx]);

    // Animate all cards to their positions
    const animateCards = useCallback(() => {
        ITEMS.forEach((_, i) => {
            const el = cardsRef.current[i];
            if (!el) return;

            const style = getCardStyle(i);

            if (style.display === 'none') {
                gsap.to(el, { opacity: 0, duration: 0.25, onComplete: () => { el.style.display = 'none'; } });
                gsap.to(el, { pointerEvents: 'none', duration: 0 });
            } else {
                el.style.display = 'block';
                gsap.to(el, {
                    x: style.x,
                    z: style.z,
                    rotateY: style.rotateY,
                    scale: style.scale,
                    opacity: style.opacity,
                    zIndex: style.zIndex,
                    duration: 0.55,
                    ease: 'power3.out',
                    pointerEvents: 'auto',
                });
            }
        });
    }, [getCardStyle]);

    useEffect(() => {
        animateCards();
    }, [centerIdx, animateCards]);

    // Init on mount
    useEffect(() => {
        ITEMS.forEach((_, i) => {
            const el = cardsRef.current[i];
            if (!el) return;
            const style = getCardStyle(i);
            if (style.display === 'none') {
                el.style.display = 'none';
                el.style.opacity = 0;
            } else {
                gsap.set(el, {
                    x: style.x, z: style.z, rotateY: style.rotateY,
                    scale: style.scale, opacity: style.opacity, zIndex: style.zIndex,
                });
            }
        });
    }, []);

    const navigate = (dir) => {
        if (isAnimating.current) return;
        isAnimating.current = true;
        setCenterIdx(prev => {
            let next = prev + dir;
            if (next < 0) next = ITEMS.length - 1;
            if (next >= ITEMS.length) next = 0;
            return next;
        });
        setTimeout(() => { isAnimating.current = false; }, 500);
    };

    // --- Drag to Scroll State ---
    const dragStart = useRef(0);
    const initialPointerDownX = useRef(0);
    const isDragging = useRef(false);
    const dragDistance = useRef(0);

    const handlePointerDown = (e) => {
        if (expanded) return;
        isDragging.current = true;
        dragStart.current = e.clientX;
        initialPointerDownX.current = e.clientX;
        dragDistance.current = 0;
    };

    const handlePointerMove = (e) => {
        if (!isDragging.current || expanded) return;
        const deltaX = e.clientX - dragStart.current;
        dragDistance.current += Math.abs(e.movementX || 0);

        // Infinite continuous scroll: shift index mid-drag and reset anchor
        const threshold = 120;
        if (deltaX > threshold) {
            setCenterIdx(prev => (prev - 1 < 0 ? ITEMS.length - 1 : prev - 1));
            dragStart.current = e.clientX;
            return;
        } else if (deltaX < -threshold) {
             setCenterIdx(prev => (prev + 1 >= ITEMS.length ? 0 : prev + 1));
             dragStart.current = e.clientX;
             return;
        }

        // Apply smooth 1:1 physical dragging along X axis without extra tilt
        cardsRef.current.forEach((el, i) => {
            if (!el) return;
            const style = getCardStyle(i);
            if (style.display !== 'none') {
                gsap.to(el, {
                    x: style.x + deltaX,
                    rotateY: style.rotateY, // Retain original 3D rotation, no tilt additions
                    duration: 0.2, // Quick duration for locked-in feel
                    ease: 'power1.out',
                    overwrite: 'auto'
                });
            }
        });
    };

    const handlePointerUp = (e) => {
        if (!isDragging.current || expanded) return;
        isDragging.current = false;
        
        const deltaX = e.clientX - dragStart.current;
        const snapThreshold = 40;
        
        // If let go between thresholds, snap to nearest
        if (deltaX > snapThreshold) {
            setCenterIdx(prev => (prev - 1 < 0 ? ITEMS.length - 1 : prev - 1));
        } else if (deltaX < -snapThreshold) {
            setCenterIdx(prev => (prev + 1 >= ITEMS.length ? 0 : prev + 1));
        } else {
            animateCards();
        }
    };


    // Keyboard nav
    useEffect(() => {
        const onKey = (e) => {
            if (expanded) return;
            if (e.key === 'ArrowLeft') navigate(-1);
            if (e.key === 'ArrowRight') navigate(1);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [expanded]);

    const handleCardClick = (e, item, itemIndex) => {
        // Prevent click if the initial point and click point differ (meaning they dragged!)
        if (Math.abs(e.clientX - initialPointerDownX.current) > 15) return; 
        
        if (itemIndex === centerIdx) {
            setExpanded(item);
        } else {
            setCenterIdx(itemIndex);
        }
    };

    const handleHoverIn = (i) => {
        const el = cardsRef.current[i];
        if (!el) return;
        const style = getCardStyle(i);
        gsap.to(el, {
            scale: style.scale * 1.15,
            y: -15,
            zIndex: 20,
            duration: 0.35,
            ease: 'power2.out',
            overwrite: 'auto',
        });
    };

    const handleHoverOut = (i) => {
        const el = cardsRef.current[i];
        if (!el) return;
        const style = getCardStyle(i);
        gsap.to(el, {
            scale: style.scale,
            y: 0,
            zIndex: style.zIndex,
            duration: 0.35,
            ease: 'power2.out',
            overwrite: 'auto',
        });
    };

    return (
        <>
            <div 
                className="dgc-carousel-wrap"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
                style={{ touchAction: 'none' }} // Prevent native scrolling on mobile when dragging sideways
            >
                {/* Left arrow */}
                <button className="dgc-arrow dgc-arrow-left" onClick={() => navigate(-1)} aria-label="Previous">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6" />
                    </svg>
                </button>

                {/* 3D Scene */}
                <div className="dgc-scene">
                    {ITEMS.map((item, i) => (
                        <div
                            key={item.id}
                            ref={el => cardsRef.current[i] = el}
                            className={`dgc-card ${i === centerIdx ? 'dgc-center' : ''}`}
                            onClick={(e) => handleCardClick(e, item, i)}
                            onMouseEnter={() => handleHoverIn(i)}
                            onMouseLeave={() => handleHoverOut(i)}
                            title={i === centerIdx ? `Click to enlarge — ${item.label}` : item.label}
                        >
                            <div className="dgc-inner">
                                <img src={item.src} alt={item.label} className="dgc-img" draggable={false} />
                                <div className="dgc-overlay">
                                    <div className="dgc-label">
                                        <span className="dgc-zoom">⤢</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Right arrow */}
                <button className="dgc-arrow dgc-arrow-right" onClick={() => navigate(1)} aria-label="Next">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="9 18 15 12 9 6" />
                    </svg>
                </button>
            </div>

            {/* Dot indicators */}
            <div className="dgc-dots">
                {ITEMS.map((_, i) => (
                    <button
                        key={i}
                        className={`dgc-dot ${i === centerIdx ? 'dgc-dot-active' : ''}`}
                        onClick={() => setCenterIdx(i)}
                        aria-label={`Go to slide ${i + 1}`}
                    />
                ))}
            </div>

            {expanded && (
                <Lightbox item={expanded} onClose={() => setExpanded(null)} />
            )}
        </>
    );
};

export default DashGallery;
