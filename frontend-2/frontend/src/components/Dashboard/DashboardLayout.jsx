import { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import Footer from '../Layout/Footer';
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme } from '../../context/ThemeContext';

function DashboardLayout({ children }) {
  const { isMobile, isTablet } = useResponsive();
  const { isDark } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile); // Closed on mobile by default
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    // Load from localStorage or use default
    const saved = localStorage.getItem('sidebarWidth');
    return saved ? parseInt(saved, 10) : 280;
  });
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef(null);

  // Save sidebar width to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarWidth', sidebarWidth.toString());
  }, [sidebarWidth]);

  // Auto-close sidebar on mobile when navigating
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      // Keep sidebar closed on mobile initially
      setSidebarOpen(false);
    } else if (!isMobile && !sidebarOpen) {
      // Auto-open on desktop
      setSidebarOpen(true);
    }
  }, [isMobile]);

  // Handle resizing
  const handleMouseDown = (e) => {
    if (isMobile) return; // Disable resizing on mobile
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      const newWidth = e.clientX;
      const minWidth = 200;
      const maxWidth = 600;
      
      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  // Close sidebar when clicking outside on mobile
  const handleOverlayClick = () => {
    if (isMobile && sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  const styles = getStyles(isDark);

  return (
    <div style={styles.appContainer}>
      {/* Overlay for mobile */}
      {isMobile && sidebarOpen && (
        <div style={styles.overlay} onClick={handleOverlayClick} />
      )}

      <Sidebar 
        isOpen={sidebarOpen} 
        onToggle={() => setSidebarOpen((prev) => !prev)}
        width={sidebarWidth}
        onResizeStart={handleMouseDown}
        isMobile={isMobile}
      />

      {/* Hamburger toggle button - always show on mobile, only when closed on tablet/desktop */}
      {(isMobile || !sidebarOpen) && (
        <button 
          onClick={() => setSidebarOpen((prev) => !prev)} 
          style={{
            ...styles.hamburgerBtn,
            ...(isMobile ? styles.hamburgerBtnMobile : {}),
          }}
        >
          <div style={styles.bar} />
          <div style={{ ...styles.bar, margin: '6px 0' }} />
          <div style={styles.bar} />
        </button>
      )}

      <main
        style={{
          ...styles.mainContent,
          marginLeft: (!isMobile && sidebarOpen) ? `${sidebarWidth}px` : '0px',
          padding: isMobile ? '12px' : isTablet ? '16px' : '20px',
          transition: isResizing ? 'none' : 'margin-left 0.3s ease, padding 0.3s ease',
        }}
      >
        <div style={{
          ...styles.contentWrapper,
          maxWidth: '100%',
          padding: '0',
        }}>
          {children}
        </div>
        <Footer />
      </main>
    </div>
  );
}

const getStyles = (isDark) => ({
  appContainer: {
    display: 'flex',
    minHeight: '100vh',
    background: isDark ? '#0f172a' : '#ffffff',
    position: 'relative',
    transition: 'background 0.3s ease',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
    transition: 'opacity 0.3s ease',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transition: 'margin-left 0.3s ease, padding 0.3s ease',
    width: '100%',
  },
  contentWrapper: {
    width: '100%',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
  },
  hamburgerBtn: {
    position: 'fixed',
    top: '20px',
    left: '20px',
    zIndex: 3000,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: '36px',
    height: '28px',
    background: isDark ? '#1e293b' : 'white',
    border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
    borderRadius: '6px',
    cursor: 'pointer',
    padding: '6px',
    boxShadow: isDark ? '0 4px 12px rgba(0,0,0,0.5)' : '0 4px 12px rgba(0,0,0,0.3)',
    transition: 'all 0.3s',
  },
  hamburgerBtnMobile: {
    top: '16px',
    left: '16px',
    width: '40px',
    height: '32px',
  },
  bar: {
    height: '3px',
    width: '100%',
    backgroundColor: isDark ? '#cbd5e1' : '#0d3278',
    borderRadius: '3px',
    transition: 'all 0.3s',
  },
});

export default DashboardLayout;
