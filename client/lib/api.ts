// --- 🔧 SMART URL CONFIGURATION ---
// Automatically selects the correct backend URL based on the current environment.
// If valid HTTPS (Tunnel/Prod) -> Use Tunnel URL.
// If valid HTTP (Localhost) -> Use Local IPv4.

const API_BASE = (typeof window !== 'undefined' && window.location.protocol === 'https:')
    ? 'https://5p5zt9vh-5000.inc1.devtunnels.ms'
    : 'http://127.0.0.1:5000';

export default API_BASE;
