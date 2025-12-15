// Theme color palettes for light and dark modes

export const lightTheme = {
  // Background colors
  bg: '#ffffff',
  bgSecondary: '#f8f9fa',
  bgTertiary: '#f1f5f9',
  
  // Surface colors
  surface: '#ffffff',
  surfaceHover: '#f8f9fa',
  surfaceActive: '#e9ecef',
  
  // Text colors
  text: '#1f2937',
  textSecondary: '#6b7280',
  textTertiary: '#9ca3af',
  textInverse: '#ffffff',
  
  // Border colors
  border: '#e5e7eb',
  borderLight: '#f3f4f6',
  borderDark: '#d1d5db',
  
  // Accent colors
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  primaryLight: '#dbeafe',
  secondary: '#8b5cf6',
  secondaryHover: '#7c3aed',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#06b6d4',
  
  // Gradient colors
  gradientPrimary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  gradientSecondary: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
  gradientSuccess: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  gradientWarning: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
  gradientError: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  
  // Card colors
  cardBg: '#ffffff',
  cardBorder: '#e5e7eb',
  cardShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)',
  cardShadowHover: '0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)',
  
  // Input colors
  inputBg: '#ffffff',
  inputBorder: '#d1d5db',
  inputFocus: '#3b82f6',
  inputPlaceholder: '#9ca3af',
  
  // Chart colors
  chartGrid: '#e5e7eb',
  chartText: '#6b7280',
};

export const darkTheme = {
  // Background colors
  bg: '#0f172a',
  bgSecondary: '#1e293b',
  bgTertiary: '#334155',
  
  // Surface colors
  surface: '#1e293b',
  surfaceHover: '#334155',
  surfaceActive: '#475569',
  
  // Text colors
  text: '#f1f5f9',
  textSecondary: '#cbd5e1',
  textTertiary: '#94a3b8',
  textInverse: '#0f172a',
  
  // Border colors
  border: '#334155',
  borderLight: '#475569',
  borderDark: '#1e293b',
  
  // Accent colors
  primary: '#60a5fa',
  primaryHover: '#3b82f6',
  primaryLight: '#1e3a8a',
  secondary: '#a78bfa',
  secondaryHover: '#8b5cf6',
  success: '#34d399',
  warning: '#fbbf24',
  error: '#f87171',
  info: '#22d3ee',
  
  // Gradient colors
  gradientPrimary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  gradientSecondary: 'linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%)',
  gradientSuccess: 'linear-gradient(135deg, #34d399 0%, #10b981 100%)',
  gradientWarning: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
  gradientError: 'linear-gradient(135deg, #f87171 0%, #ef4444 100%)',
  
  // Card colors
  cardBg: '#1e293b',
  cardBorder: '#334155',
  cardShadow: '0 4px 6px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2)',
  cardShadowHover: '0 10px 15px rgba(0,0,0,0.4), 0 4px 6px rgba(0,0,0,0.3)',
  
  // Input colors
  inputBg: '#1e293b',
  inputBorder: '#475569',
  inputFocus: '#60a5fa',
  inputPlaceholder: '#64748b',
  
  // Chart colors
  chartGrid: '#334155',
  chartText: '#94a3b8',
};

// Get theme colors based on mode
export const getThemeColors = (isDark) => {
  return isDark ? darkTheme : lightTheme;
};

