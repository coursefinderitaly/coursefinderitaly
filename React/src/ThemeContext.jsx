import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Default to dark mode if no preference is saved
    return localStorage.getItem('app-theme') || 'dark';
  });

  const [activeTheme, setActiveTheme] = useState('dark'); // Default to dark on first mount

  useEffect(() => {
    const applyTheme = () => {
      const root = document.documentElement;
      let resolvedTheme = theme;

      if (theme === 'system') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        resolvedTheme = prefersDark ? 'dark' : 'light';
      }

      if (resolvedTheme === 'light') {
        root.setAttribute('data-theme', 'light');
      } else {
        root.removeAttribute('data-theme');
      }

      setActiveTheme(resolvedTheme);
      localStorage.setItem('app-theme', theme);
    };

    if (document.startViewTransition) {
      document.startViewTransition(() => {
        applyTheme();
      });
    } else {
      applyTheme();
    }
  }, [theme]);

  // Listen for system theme changes if set to system
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      const newActive = e.matches ? 'dark' : 'light';
      setActiveTheme(newActive);
      if (newActive === 'light') {
        document.documentElement.setAttribute('data-theme', 'light');
      } else {
        document.documentElement.removeAttribute('data-theme');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const value = {
    theme,
    setTheme,
    activeTheme, // The actual resolved theme currently showing ('light' or 'dark')
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
