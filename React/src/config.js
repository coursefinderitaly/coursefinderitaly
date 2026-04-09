// Runtime domain evaluation natively bypasses Vite environment bugs
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname === '192.168.29.234';

export const API_BASE_URL = isLocal
    ? 'http://localhost:5000/api'   // Local Next.js custom server
    : window.location.origin + '/api'; // Current Domain Backend API

