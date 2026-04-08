// Runtime domain evaluation natively bypasses Vite environment bugs
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const API_BASE_URL = isLocal
    ? 'http://localhost:5000/api'   // Local Next.js custom server
    : 'https://coursefinder2-0.onrender.com/api'; // Render Backend API

