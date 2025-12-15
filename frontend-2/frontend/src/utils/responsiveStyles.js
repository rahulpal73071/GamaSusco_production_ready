/**
 * Responsive style utilities
 * Provides common responsive style patterns
 */

export const getResponsiveGrid = (isMobile, isTablet, columns = { mobile: 1, tablet: 2, desktop: 3 }) => {
  if (isMobile) {
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${columns.mobile}, 1fr)`,
      gap: '16px',
    };
  } else if (isTablet) {
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${columns.tablet}, 1fr)`,
      gap: '20px',
    };
  } else {
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(${columns.desktop}, 1fr)`,
      gap: '24px',
    };
  }
};

export const getResponsivePadding = (isMobile, isTablet) => {
  if (isMobile) {
    return { padding: '16px' };
  } else if (isTablet) {
    return { padding: '24px' };
  } else {
    return { padding: '32px' };
  }
};

export const getResponsiveFontSize = (isMobile, isTablet, sizes = { mobile: 16, tablet: 18, desktop: 24 }) => {
  if (isMobile) {
    return { fontSize: `${sizes.mobile}px` };
  } else if (isTablet) {
    return { fontSize: `${sizes.tablet}px` };
  } else {
    return { fontSize: `${sizes.desktop}px` };
  }
};

export const getResponsiveWidth = (isMobile, isTablet, widths = { mobile: '100%', tablet: '95%', desktop: '90%' }) => {
  if (isMobile) {
    return { width: widths.mobile, maxWidth: widths.mobile };
  } else if (isTablet) {
    return { width: widths.tablet, maxWidth: widths.tablet };
  } else {
    return { width: widths.desktop, maxWidth: widths.desktop };
  }
};

