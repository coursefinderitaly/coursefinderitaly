import { useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const StrictSessionManager = ({ children }) => {
  useEffect(() => {
    // If Tab Session Data is missing, it means the browser was just freshly launched
    // or the tab was closed and a new one was opened. 
    // This perfectly mimics sessionStorage tab isolation and browser-close destruction,
    // while keeping the master JWT completely safe inside the backend HTTPOnly cookie!
    if (!sessionStorage.getItem('tab_session')) {
      // Don't kill the session if they explicitly checked "Keep me signed in"
      if (localStorage.getItem('keepSignedIn') !== 'true') {
        fetch(`${API_BASE_URL}/auth/logout`, { 
          method: "POST", 
          credentials: "include" 
        }).catch(() => {});
      }
    }
  }, []);

  return <>{children}</>;
};

export default StrictSessionManager;
