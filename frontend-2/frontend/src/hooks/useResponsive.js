import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design
 * Returns screen size breakpoints and utility functions
 */
export const useResponsive = () => {
  const [screenSize, setScreenSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });

  useEffect(() => {
    const handleResize = () => {
      setScreenSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Set initial size

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const breakpoints = {
    isMobile: screenSize.width < 768,
    isTablet: screenSize.width >= 768 && screenSize.width < 1024,
    isDesktop: screenSize.width >= 1024,
    isLargeDesktop: screenSize.width >= 1440,
  };

  return {
    ...screenSize,
    ...breakpoints,
  };
};

/**
 * Responsive style helper
 * Returns different styles based on screen size
 */
export const getResponsiveStyle = (mobileStyle, tabletStyle, desktopStyle, screenSize) => {
  if (screenSize < 768) {
    return mobileStyle;
  } else if (screenSize < 1024) {
    return tabletStyle || mobileStyle;
  } else {
    return desktopStyle || tabletStyle || mobileStyle;
  }
};

