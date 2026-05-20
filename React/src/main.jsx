import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Global Fetch Interceptor to inject custom CSRF protection header into all mutating requests.
// This works because standard browsers enforce CORS preflight blocks if an illegitimate third-party origin
// attempts to set custom headers like "x-csrf-protected", providing 100% CSRF immunity on JSON APIs.
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  
  // If config exists and method is mutating, inject the header
  if (config && config.method && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method.toUpperCase())) {
    const headers = new Headers(config.headers || {});
    headers.set('x-csrf-protected', '1');
    config.headers = headers;
  }
  
  return originalFetch(resource, config);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
