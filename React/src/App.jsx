import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import FrontPage from './FrontPage';
import Dashboard from './Dashboard';
import AdminPortal from './components/AdminPortal';
import IdleTimeout from './components/IdleTimeout';
import StrictSessionManager from './components/StrictSessionManager';
import { ThemeProvider } from './ThemeContext';
import './index.css';

function App() {
  // Authentication is now fully cookie-based and handled per-route

  return (
    <ThemeProvider>
      <Router>
        <IdleTimeout>
          <Routes>
            <Route path="/" element={<FrontPage />} />
            <Route path="/dashboard" element={
              <StrictSessionManager>
                <Dashboard />
              </StrictSessionManager>
            } />
            <Route path="/admin" element={
              <StrictSessionManager>
                <AdminPortal />
              </StrictSessionManager>
            } />
            {/* Redirect unknown routes */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </IdleTimeout>
      </Router>
    </ThemeProvider>

  );
}

export default App;
