import { createContext, useState, useContext, useEffect } from 'react';
import { getThemeColors } from '../utils/theme';

const ThemeContext = createContext(null);

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Get theme from localStorage or default to 'light'
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });

  useEffect(() => {
    // Apply theme to document root
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    // Apply theme colors to document root CSS variables
    const colors = getThemeColors(theme === 'dark');
    const root = document.documentElement;
    Object.keys(colors).forEach(key => {
      const cssKey = `--theme-${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssKey, colors[key]);
    });
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const isDark = theme === 'dark';
  const colors = getThemeColors(isDark);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isDark, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

ThemeProvider.displayName = 'ThemeProvider';

export { ThemeProvider };

// Hook export - Fast Refresh compatible
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}


