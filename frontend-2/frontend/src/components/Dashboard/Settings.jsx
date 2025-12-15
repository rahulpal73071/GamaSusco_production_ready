import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import DashboardLayout from './DashboardLayout';
import { useResponsive } from '../../hooks/useResponsive';
import { reportsAPI } from '../../services/api';

function Settings() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { isMobile, isTablet } = useResponsive();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const fetchCompanyInfo = async () => {
    try {
      const response = await reportsAPI.getCompanyProfile();
      if (response.data) {
        // Transform the company profile data to match our structure
        setCompany({
          name: response.data.company_name,
          industry: response.data.industry,
          address: response.data.address,
          phone: response.data.phone,
          website: response.data.website,
          id: user?.company_id,
        });
      }
    } catch (error) {
      console.error('Error fetching company info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    const confirmLogout = window.confirm("Are you sure you want to log out?");
    if (!confirmLogout) return;

    try {
      logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const colorPalette = isDark ? {
    bg: '#1a1a1a',
    surface: '#2d2d2d',
    surfaceHover: '#3a3a3a',
    text: '#e5e5e5',
    textSecondary: '#a0a0a0',
    border: '#404040',
    accent: '#00d4ff',
    accentHover: '#00b8e6',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    cardBg: '#252525',
    inputBg: '#1f1f1f',
    inputBorder: '#404040',
  } : {
    bg: '#f8f9fa',
    surface: '#ffffff',
    surfaceHover: '#f5f5f5',
    text: '#1f2937',
    textSecondary: '#6b7280',
    border: '#e5e7eb',
    accent: '#3b82f6',
    accentHover: '#2563eb',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    cardBg: '#ffffff',
    inputBg: '#ffffff',
    inputBorder: '#d1d5db',
  };

  const styles = {
    container: {
      padding: isMobile ? '20px' : isTablet ? '32px' : '40px',
      maxWidth: '900px',
      margin: '0 auto',
      width: '100%',
    },
    header: {
      marginBottom: isMobile ? '24px' : '32px',
    },
    title: {
      fontSize: isMobile ? '28px' : isTablet ? '32px' : '36px',
      fontWeight: '800',
      color: colorPalette.text,
      margin: '0 0 8px 0',
      letterSpacing: '-0.025em',
    },
    subtitle: {
      fontSize: isMobile ? '14px' : '16px',
      color: colorPalette.textSecondary,
      margin: 0,
    },
    section: {
      background: colorPalette.cardBg,
      borderRadius: '16px',
      padding: isMobile ? '20px' : '24px',
      marginBottom: '24px',
      border: `1px solid ${colorPalette.border}`,
      boxShadow: isDark ? '0 4px 6px rgba(0,0,0,0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
    },
    sectionTitle: {
      fontSize: isMobile ? '18px' : '20px',
      fontWeight: '700',
      color: colorPalette.text,
      margin: '0 0 16px 0',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    settingRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px 0',
      borderBottom: `1px solid ${colorPalette.border}`,
    },
    settingRowLast: {
      borderBottom: 'none',
    },
    settingLabel: {
      display: 'flex',
      flexDirection: 'column',
      gap: '4px',
      flex: 1,
    },
    settingName: {
      fontSize: '15px',
      fontWeight: '600',
      color: colorPalette.text,
    },
    settingDescription: {
      fontSize: '13px',
      color: colorPalette.textSecondary,
    },
    toggleContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    toggle: {
      position: 'relative',
      width: '52px',
      height: '28px',
      borderRadius: '14px',
      background: isDark ? '#4a5568' : '#cbd5e1',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      border: 'none',
      outline: 'none',
    },
    toggleActive: {
      background: colorPalette.gradient,
    },
    toggleSlider: {
      position: 'absolute',
      top: '3px',
      left: isDark ? '25px' : '3px',
      width: '22px',
      height: '22px',
      borderRadius: '50%',
      background: '#ffffff',
      transition: 'all 0.3s ease',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    },
    infoCard: {
      background: colorPalette.surface,
      borderRadius: '12px',
      padding: '20px',
      border: `1px solid ${colorPalette.border}`,
    },
    infoRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 0',
      borderBottom: `1px solid ${colorPalette.border}`,
    },
    infoRowLast: {
      borderBottom: 'none',
    },
    infoLabel: {
      fontSize: '14px',
      fontWeight: '600',
      color: colorPalette.textSecondary,
    },
    infoValue: {
      fontSize: '15px',
      fontWeight: '500',
      color: colorPalette.text,
      textAlign: 'right',
    },
    avatar: {
      width: isMobile ? '60px' : '80px',
      height: isMobile ? '60px' : '80px',
      borderRadius: '50%',
      background: colorPalette.gradient,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: isMobile ? '24px' : '32px',
      fontWeight: 'bold',
      marginBottom: '16px',
    },
    logoutButton: {
      width: '100%',
      padding: '14px 24px',
      background: isDark 
        ? 'linear-gradient(135deg, #dc2626, #b91c1c)' 
        : 'linear-gradient(135deg, #ef4444, #dc2626)',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      boxShadow: isDark 
        ? '0 4px 12px rgba(220, 38, 38, 0.3)' 
        : '0 4px 12px rgba(239, 68, 68, 0.2)',
    },
    divider: {
      height: '1px',
      background: colorPalette.border,
      margin: '24px 0',
    },
  };

  return (
    <DashboardLayout>
      <div style={{
        ...styles.container,
        background: colorPalette.bg,
        minHeight: '100vh',
      }}>
        <div style={styles.header}>
          <h1 style={styles.title}>⚙️ Settings</h1>
          <p style={styles.subtitle}>Manage your account preferences and application settings</p>
        </div>

        {/* Theme Toggle */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <span>🎨</span>
            Appearance
          </h2>
          <div style={{
            ...styles.settingRow,
            ...styles.settingRowLast,
          }}>
            <div style={styles.settingLabel}>
              <span style={styles.settingName}>Dark Mode</span>
              <span style={styles.settingDescription}>
                Switch between light and dark theme
              </span>
            </div>
            <div style={styles.toggleContainer}>
              <button
                onClick={toggleTheme}
                style={{
                  ...styles.toggle,
                  ...(isDark ? styles.toggleActive : {}),
                }}
                aria-label="Toggle theme"
              >
                <div style={{
                  ...styles.toggleSlider,
                  left: isDark ? '25px' : '3px',
                }} />
              </button>
              <span style={{
                fontSize: '14px',
                fontWeight: '600',
                color: colorPalette.text,
                minWidth: '60px',
                textAlign: 'right',
              }}>
                {isDark ? '🌙 Dark' : '☀️ Light'}
              </span>
            </div>
          </div>
        </div>

        {/* User Information */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <span>👤</span>
            User Information
          </h2>
          <div style={styles.infoCard}>
            <div style={styles.avatar}>
              {user?.username?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Username</span>
              <span style={styles.infoValue}>{user?.username || 'N/A'}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Email</span>
              <span style={styles.infoValue}>{user?.email || 'N/A'}</span>
            </div>
            <div style={styles.infoRow}>
              <span style={styles.infoLabel}>Full Name</span>
              <span style={styles.infoValue}>{user?.full_name || user?.username || 'N/A'}</span>
            </div>
            <div style={{
              ...styles.infoRow,
              ...styles.infoRowLast,
            }}>
              <span style={styles.infoLabel}>User ID</span>
              <span style={styles.infoValue}>#{user?.id || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Company Information */}
        {company && (
          <div style={styles.section}>
            <h2 style={styles.sectionTitle}>
              <span>🏢</span>
              Company Information
            </h2>
            <div style={styles.infoCard}>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Company Name</span>
                <span style={styles.infoValue}>{company.name || 'N/A'}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Industry</span>
                <span style={styles.infoValue}>{company.industry || 'N/A'}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Address</span>
                <span style={styles.infoValue}>{company.address || 'N/A'}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Phone</span>
                <span style={styles.infoValue}>{company.phone || 'N/A'}</span>
              </div>
              <div style={styles.infoRow}>
                <span style={styles.infoLabel}>Website</span>
                <span style={styles.infoValue}>
                  {company.website ? (
                    <a 
                      href={company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: colorPalette.accent, textDecoration: 'none' }}
                    >
                      {company.website}
                    </a>
                  ) : 'N/A'}
                </span>
              </div>
              <div style={{
                ...styles.infoRow,
                ...styles.infoRowLast,
              }}>
                <span style={styles.infoLabel}>Company ID</span>
                <span style={styles.infoValue}>#{company.id || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Application Settings */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <span>🔧</span>
            Application Settings
          </h2>
          <div style={styles.settingRow}>
            <div style={styles.settingLabel}>
              <span style={styles.settingName}>Notifications</span>
              <span style={styles.settingDescription}>
                Receive email notifications for important updates
              </span>
            </div>
            <div style={styles.toggleContainer}>
              <button
                style={{
                  ...styles.toggle,
                  background: '#10b981',
                }}
                onClick={() => alert('Notifications toggle - Feature coming soon')}
              >
                <div style={{
                  ...styles.toggleSlider,
                  left: '25px',
                }} />
              </button>
            </div>
          </div>
          <div style={styles.settingRow}>
            <div style={styles.settingLabel}>
              <span style={styles.settingName}>Auto-save</span>
              <span style={styles.settingDescription}>
                Automatically save your work
              </span>
            </div>
            <div style={styles.toggleContainer}>
              <button
                style={{
                  ...styles.toggle,
                  background: '#10b981',
                }}
                onClick={() => alert('Auto-save toggle - Feature coming soon')}
              >
                <div style={{
                  ...styles.toggleSlider,
                  left: '25px',
                }} />
              </button>
            </div>
          </div>
          <div style={{
            ...styles.settingRow,
            ...styles.settingRowLast,
          }}>
            <div style={styles.settingLabel}>
              <span style={styles.settingName}>Data Export</span>
              <span style={styles.settingDescription}>
                Allow automatic data export
              </span>
            </div>
            <div style={styles.toggleContainer}>
              <button
                style={{
                  ...styles.toggle,
                  background: '#10b981',
                }}
                onClick={() => alert('Data export toggle - Feature coming soon')}
              >
                <div style={{
                  ...styles.toggleSlider,
                  left: '25px',
                }} />
              </button>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>
            <span>🔐</span>
            Account Actions
          </h2>
          <button
            onClick={handleLogout}
            style={styles.logoutButton}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = isDark 
                ? '0 6px 16px rgba(220, 38, 38, 0.4)' 
                : '0 6px 16px rgba(239, 68, 68, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = isDark 
                ? '0 4px 12px rgba(220, 38, 38, 0.3)' 
                : '0 4px 12px rgba(239, 68, 68, 0.2)';
            }}
          >
            🚪 Logout
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default Settings;

