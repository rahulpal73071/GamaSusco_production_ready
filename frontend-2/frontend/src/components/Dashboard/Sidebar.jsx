import { useState, useEffect } from 'react';
import LOGO from '../Auth/gaamasusco-logo.png';
import { useNavigate, useLocation } from 'react-router-dom';
import { useResponsive } from '../../hooks/useResponsive';
import { useAuth } from '../../context/AuthContext';
import { reportsAPI } from '../../services/api';

function Sidebar({ isOpen, onToggle, width = 280, onResizeStart, isMobile: isMobileProp }) {
  const { isMobile: isMobileFromHook } = useResponsive();
  const isMobile = isMobileProp !== undefined ? isMobileProp : isMobileFromHook;
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [companyName, setCompanyName] = useState('Gamasusco');
  const [companySubtitle, setCompanySubtitle] = useState('AI Powered Carbon Accounting');

  useEffect(() => {
    fetchCompanyName();
  }, [user]);

  const fetchCompanyName = async () => {
    try {
      const response = await reportsAPI.getCompanyProfile();
      if (response.data && response.data.company_name) {
        setCompanyName(response.data.company_name);
        // Optionally set subtitle to industry or keep it as is
        if (response.data.industry) {
          setCompanySubtitle(response.data.industry);
        }
      }
    } catch (error) {
      console.error('Error fetching company name:', error);
      // Keep default values on error
    }
  };


  const menuItems = [
    { id: 'dashboard', path: '/dashboard', icon: '🏠', label: 'Dashboard' },
    { id: 'import', path: '/import', icon: '🧾', label: 'Import Workspace' },
    { id: 'activities', path: '/activities', icon: '📋', label: 'Activities' },
    { id: 'water', path: '/water', icon: '💧', label: 'Water Management' },
    { id: 'waste', path: '/waste', icon: '🗑️', label: 'Waste Management' },
    { id: 'scope3', path: '/scope3', icon: '📊', label: 'Scope 3 Tracking' },
    { id: 'analytics', path: '/analytics', icon: '📈', label: 'Analytics' },
    { id: 'reports', path: '/reports', icon: '📄', label: 'Reports' },
    { id: 'goals', path: '/goals', icon: '🎯', label: 'Goals & Targets' },
    { id: 'recommendations', path: '/recommendations', icon: '🤖', label: 'AI Recommendations' },
    // { id: 'benchmarks', path: '/benchmarks', icon: '📊', label: 'Benchmarks' },

  ];


  return (
    <>
      <div
        style={{
          ...styles.sidebar,
          ...(isMobile ? styles.sidebarMobile : {}),
          width: isMobile ? '260px' : `${width}px`,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          zIndex: isMobile ? 2000 : 1000,
          transition: 'transform 0.3s ease',
        }}
      >
      {/* Header */}
      <div style={{
        ...styles.header,
        ...(isMobile ? styles.headerMobile : {}),
      }}>
        <div style={styles.logoContainer}>
          <img 
            src={LOGO} 
            alt="Logo" 
            style={{
              ...styles.logoImage,
              ...(isMobile ? styles.logoImageMobile : {}),
            }} 
          />
          <div style={styles.logoText}>
            <div style={styles.logoTitle}>{companyName}</div>
            <div style={styles.logoSubtitle}>{companySubtitle}</div>
          </div>
        </div>
        <button onClick={onToggle} style={styles.closeBtn}>✕</button>
      </div>

      {/* Menu */}
      <nav style={{
        ...styles.nav,
        ...(isMobile ? styles.navMobile : {}),
      }}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.id}
              onClick={() => {
                navigate(item.path);
                if (isMobile) {
                  onToggle(); // Close sidebar on mobile after navigation
                }
              }}
              style={{
                ...styles.menuItem,
                ...(isMobile ? styles.menuItemMobile : {}),
                ...(isActive ? styles.menuItemActive : {}),
              }}
            >
              <span style={styles.menuIcon}>{item.icon}</span>
              <span style={styles.menuLabel}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Settings Button */}
      <div style={styles.footer}>
        <button 
          onClick={() => navigate('/settings')} 
          style={styles.settingsBtn}
        >
          ⚙️ Settings
        </button>
      </div>
      </div>
      {/* Resize Handle */}
      {!isMobile && isOpen && (
        <div
          onMouseDown={onResizeStart}
          style={{
            ...styles.resizeHandle,
            left: `${width}px`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
          }}
        />
      )}
    </>
  );
}

const styles = {
  sidebar: {
    width: '280px',
    height: '100vh',
    background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0,
    top: 0,
    padding: '0',
    transition: 'transform 0.3s ease',
    boxShadow: '4px 0 20px rgba(0,0,0,0.3)',
    zIndex: 1000,
    borderRight: '1px solid rgba(255,255,255,0.05)',
    overflowY: 'auto',
  },
  sidebarMobile: {
    width: '260px',
    boxShadow: '4px 0 30px rgba(0,0,0,0.5)',
  },
  header: {
    padding: '30px 24px 20px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    position: 'relative',
  },
  headerMobile: {
    padding: '20px 16px 16px',
  },
  logoContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '10px',
  },
  logoImage: {
    width: '160px',
    height: '130px',
    objectFit: 'contain',
    filter: 'brightness(0) invert(1)',
  },
  logoText: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  logoTitle: {
    color: 'white',
    fontSize: '18px',
    fontWeight: '800',
    letterSpacing: '0.5px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
    textAlign: 'center',
  },
  logoSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: '11px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    fontWeight: '500',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '100%',
    textAlign: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    background: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    transition: 'all 0.2s ease',
  },
  nav: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 16px',
    gap: '4px',
    overflowY: 'auto',
  },
  navMobile: {
    padding: '16px 12px',
    gap: '2px',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '12px 20px',
    border: 'none',
    borderRadius: '12px',
    background: 'transparent',
    color: 'rgba(255,255,255,0.7)',
    fontSize: '14px',
    fontWeight: '500',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative',
    marginBottom: '2px',
  },
  menuItemMobile: {
    padding: '10px 16px',
    fontSize: '13px',
    gap: '12px',
  },
  menuItemActive: {
    background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(147,51,234,0.2))',
    color: '#ffffff',
    boxShadow: '0 4px 12px rgba(59,130,246,0.15)',
    border: '1px solid rgba(59,130,246,0.3)',
  },
  menuIcon: {
    fontSize: '18px',
    minWidth: '24px',
    textAlign: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: '14px',
  },
  footer: {
    borderTop: '1px solid rgba(255,255,255,0.08)',
    padding: '24px 16px',
    background: 'rgba(0,0,0,0.1)',
  },
  settingsBtn: {
    width: '100%',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    padding: '12px 16px',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 8px rgba(102,126,234,0.3)',
  },
  logoImageMobile: {
    width: '110px',
    height: '95px',
  },
  resizeHandle: {
    position: 'fixed',
    top: 0,
    width: '4px',
    height: '100vh',
    background: 'transparent',
    cursor: 'col-resize',
    zIndex: 1001,
    transition: 'background 0.2s ease',
  },
};

export default Sidebar;
