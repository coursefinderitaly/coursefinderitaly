import React from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import {
    GraduationCap, BookOpen, Layers, Search,
    UploadCloud, CheckCircle, Save, Briefcase,
    Users, PieChart, Send, Download, Target,
    Globe, Star
} from 'lucide-react';
import './ModernFeatures.css';

// Full 8 Student Features
const studentFeatures = [
    { icon: <Layers size={16} />, title: "One Profile", desc: "Apply to multiple universities from a single form.", color: "#3b82f6" },
    { icon: <Search size={16} />, title: "Smart Course Finder", desc: "Filter courses by Italy, deadlines, and eligibility.", color: "#8b5cf6" },
    { icon: <CheckCircle size={16} />, title: "Multi-Select", desc: "Track each university separately from one view.", color: "#10b981" },
    { icon: <Briefcase size={16} />, title: "Student Dashboard", desc: "Track applications and progress simply.", color: "#f59e0b" },
    { icon: <UploadCloud size={16} />, title: "Doc Management", desc: "Upload central documents once and reuse.", color: "#ec4899" },
    { icon: <Target size={16} />, title: "Track Progress", desc: "Stay informed on under-review statuses.", color: "#06b6d4" },
    { icon: <Save size={16} />, title: "Save & Resume", desc: "Auto-track and save your application journey.", color: "#6366f1" },
    { icon: <GraduationCap size={16} />, title: "Simplified Workflow", desc: "No more repeated form filling.", color: "#14b8a6" }
];

// Full 8 Partner Features
const partnerFeatures = [
    { icon: <PieChart size={16} />, title: "Partner Dashboard", desc: "Applications, active counsellors & offers.", color: "#f43f5e" },
    { icon: <Target size={16} />, title: "Gmail Integration", desc: "unified students details.", color: "#8b5cf6" },
    { icon: <Users size={16} />, title: "Student Management", desc: "Filter students and track centrally.", color: "#3b82f6" },
    { icon: <Send size={16} />, title: "Track Submissions", desc: "Monitor submissions and offers sequentially.", color: "#10b981" },
    { icon: <Briefcase size={16} />, title: "Counselor Control", desc: "Assign workloads and track sub-accounts.", color: "#f59e0b" },
    { icon: <BookOpen size={16} />, title: "Course Engine", desc: "Search and compare programs for students.", color: "#ec4899" },
    { icon: <Send size={16} />, title: "Email Notifications", desc: "Automated alerts (Coming Soon).", color: "#06b6d4" },
    { icon: <Layers size={16} />, title: "Multi-App System", desc: "Scale business via faster workflows.", color: "#6366f1" }
];

// Full 8 USP Features
const uspFeatures = [
    { icon: <CheckCircle size={20} />, title: "Single Application", desc: "Apply simultaneously without redundant typing." },
    { icon: <Users size={20} />, title: "Dual Portals", desc: "Interfaces exclusively for students and partners." },
    { icon: <Briefcase size={20} />, title: "Counselor Hierarchy", desc: "Advanced management for multiple counselors." },
    { icon: <Search size={20} />, title: "Smart Course Finder", desc: "Engine to discover programs instantly." },
    { icon: <Send size={20} />, title: "Automated Emailing", desc: "Course delivery system (Coming Soon)." },
    { icon: <Target size={20} />, title: "Live Tracking", desc: "Updates on processing, missing docs & offers." },
    { icon: <Layers size={20} />, title: "Comprehensive CRM", desc: "Unified system strictly for study abroad." },
    { icon: <Star size={20} />, title: "Italy Optimized", desc: "Tailored for Italian admission workflows." }
];

const TiltCard = ({ children, glowColor }) => {
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
    const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

    const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["3deg", "-3deg"]); // Reduced tilt degree so the large card doesn't skew too much
    const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-3deg", "3deg"]);

    const handleMouseMove = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const width = rect.width;
        const height = rect.height;
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        const xPct = mouseX / width - 0.5;
        const yPct = mouseY / height - 0.5;
        x.set(xPct);
        y.set(yPct);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            style={{ rotateX, rotateY }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="tilt-card-wrapper"
        >
            <div className="tilt-glow" style={{ background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 60%)` }}></div>
            <div className="tilt-card-content">
                {children}
            </div>
        </motion.div>
    );
};

const CompactFeatureItem = ({ feature, index }) => (
    <motion.div 
        className="compact-feature-item"
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-10px" }}
        transition={{ duration: 0.4, delay: index * 0.05 + 0.1, ease: "easeOut" }}
    >
        <div className="cfi-icon" style={{ color: feature.color, backgroundColor: `${feature.color}15` }}>
            {feature.icon}
        </div>
        <div className="cfi-text">
            <h4>{feature.title}</h4>
            <p>{feature.desc}</p>
        </div>
    </motion.div>
);

const ModernFeatures = ({ openAuth }) => {
    return (
        <div className="modern-features-wrapper">

            {/* Split Section: Students & Partners side-by-side */}
            <div className="features-container split-view-container">
                <TiltCard glowColor="rgba(244, 63, 94, 0.25)">
                    <div className="split-card partner-card">
                        <div className="split-header">
                            <div className="header-badge" style={{ color: '#f43f5e', background: 'rgba(244, 63, 94, 0.1)' }}>
                                <Briefcase size={16} />
                                <span>For Partners</span>
                            </div>
                            <h3>Scale Your <span>Business</span></h3>
                        </div>
                        <div className="split-body">
                            {partnerFeatures.map((f, i) => <CompactFeatureItem key={i} index={i} feature={f} />)}
                        </div>
                        <button className="split-cta partner-cta" onClick={() => openAuth('signup', 'partner')}>Partner Registration</button>
                    </div>
                </TiltCard>

                <TiltCard glowColor="rgba(59, 130, 246, 0.25)">
                    <div className="split-card student-card">
                        <div className="split-header">
                            <div className="header-badge" style={{ color: '#3b82f6', background: 'rgba(59, 130, 246, 0.1)' }}>
                                <GraduationCap size={16} />
                                <span>For Students</span>
                            </div>
                            <h3>Empowering Your <span>Journey</span></h3>
                        </div>
                        <div className="split-body">
                            {studentFeatures.map((f, i) => <CompactFeatureItem key={i} index={i} feature={f} />)}
                        </div>
                        <button className="split-cta student-cta" onClick={() => openAuth('signup', 'student')}>Create Student Account</button>
                    </div>
                </TiltCard>
            </div>

            {/* horizontal USP Grid */}
            <div className="features-container usp-container">
                <div className="features-header usp-header-compact">
                    <div className="header-badge" style={{ color: '#eab308', background: 'rgba(234, 179, 8, 0.1)' }}>
                        <Star size={16} />
                        <span>Why Choose Us</span>
                    </div>
                    <h2 className="modern-title" style={{ marginBottom: '0.2rem' }}>The CounselFlow <span>Advantage</span></h2>
                </div>

                <div className="usp-horizontal-grid">
                    {uspFeatures.map((usp, i) => (
                        <motion.div
                            key={i}
                            className="usp-grid-card"
                            initial={{ opacity: 0, y: 30, scale: 0.9, filter: 'blur(8px)' }}
                            whileInView={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                            viewport={{ once: true, margin: "-40px" }}
                            transition={{ duration: 0.5, delay: i * 0.1, type: "spring", stiffness: 100, damping: 15 }}
                            whileHover={{ y: -5, scale: 1.02, transition: { duration: 0.2 } }}
                        >
                            <div className="usp-icon-wrap-compact">
                                {usp.icon}
                            </div>
                            <div className="usp-text-compact">
                                <h4>{usp.title}</h4>
                                <p>{usp.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

        </div>
    );
};

export default ModernFeatures;
