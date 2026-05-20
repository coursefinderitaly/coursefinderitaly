import React, { useRef, useState, useEffect } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const MagneticSignature = () => {
    const ref = useRef(null);
    const [isHovered, setIsHovered] = useState(false);
    
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    
    // Smooth, snappy spring for the magnetic pull
    const springConfig = { damping: 15, stiffness: 200, mass: 0.5 };
    const springX = useSpring(x, springConfig);
    const springY = useSpring(y, springConfig);

    const handleMouseMove = (e) => {
        if (!ref.current) return;
        const { clientX, clientY } = e;
        const rect = ref.current.getBoundingClientRect();
        
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const distanceX = clientX - centerX;
        const distanceY = clientY - centerY;
        const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);
        
        // 100px magnetic radius
        if (distance < 100) {
            setIsHovered(true);
            x.set(distanceX * 0.3);
            y.set(distanceY * 0.3);
        } else {
            setIsHovered(false);
            x.set(0);
            y.set(0);
        }
    };

    const handleMouseLeave = () => {
        setIsHovered(false);
        x.set(0);
        y.set(0);
    };

    // Global listener so it detects mouse within 100px even when outside the component bounding box bounds
    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div 
            className="magnetic-signature-wrapper"
            onMouseLeave={handleMouseLeave}
        >
            <motion.div
                ref={ref}
                style={{ x: springX, y: springY }}
                // ScrollTrigger-like Entrance Animation
                initial={{ opacity: 0, rotateX: -60, y: 30, filter: 'blur(12px)' }}
                whileInView={{ opacity: 1, rotateX: 0, y: 0, filter: 'blur(0px)' }}
                viewport={{ once: false, margin: "-20px" }} // Triggers when scrolling near the element
                transition={{ duration: 0.9, type: 'spring', bounce: 0.4 }}
                className={`magnetic-glass-badge ${isHovered ? 'is-magnetic' : ''}`}
            >
                <div className="magnetic-glow"></div>
                <span className="magnetic-text">
                    Designer <span className="magnetic-highlight">@NEET</span>
                </span>
            </motion.div>
        </div>
    );
};

export default MagneticSignature;
