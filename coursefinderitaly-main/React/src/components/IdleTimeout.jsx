import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const IdleTimeout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const timeoutRef = useRef(null);
  
  // Set idle time limit to 30 minutes (30 * 60 * 1000)
  const IDLE_TIMEOUT_MS = 30 * 60 * 1000; 

  const handleLogout = async () => {
    try {
      // Hit the backend logout endpoint to destroy the HTTPOnly cookie
      await fetch(`${API_BASE_URL}/auth/logout`, { 
        method: "POST", 
        credentials: "include" 
      });
      // Force redirect to login
      navigate('/');
    } catch (err) {
      console.error("Failed to execute idle logout", err);
    }
  };

  const resetTimer = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    // Only run the timeout if the user is NOT on the login page (root path)
    if (location.pathname !== '/') {
      timeoutRef.current = setTimeout(handleLogout, IDLE_TIMEOUT_MS);
    }
  };

  useEffect(() => {
    // List of standard DOM events implying user activity
    const events = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => window.addEventListener(event, resetTimer));
    
    // Start the timer initially
    resetTimer();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [location.pathname]); // Re-attach or reset if path changes

  return <>{children}</>;
};

export default IdleTimeout;
