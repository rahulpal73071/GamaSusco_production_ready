import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  DocumentTextIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

function Footer() {
  const { isDark, colors } = useTheme();
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = `
      @media (max-width: 768px) {
        .footer-grid {
          grid-template-columns: 1fr !important;
          gap: 24px !important;
        }
        .footer-bottom {
          flex-direction: column !important;
          text-align: center !important;
        }
        .footer-legal {
          justify-content: center !important;
        }
      }
      .footer-link:hover {
        color: #00FFB0 !important;
        transform: translateX(4px);
      }
      .footer-social-link:hover {
        color: #00FFB0 !important;
        background: rgba(0, 255, 176, 0.1);
        transform: translateY(-2px);
      }
      .footer-legal-link:hover {
        color: #60a5fa !important;
      }
    `;
    document.head.appendChild(styleSheet);
    return () => {
      if (document.head.contains(styleSheet)) {
        document.head.removeChild(styleSheet);
      }
    };
  }, []);

  const styles = {
    footer: {
      background: isDark 
        ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)'
        : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      color: isDark ? '#ffffff' : '#1f2937',
      padding: '48px 24px 24px',
      marginTop: 'auto',
      borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
      width: '100%',
    },
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '32px',
      marginBottom: '32px',
    },
    section: {
      display: 'flex',
      flexDirection: 'column',
    },
    title: {
      fontSize: '22px',
      fontWeight: '800',
      marginBottom: '16px',
      background: 'linear-gradient(135deg, #00A86B, #1E88E5)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    description: {
      fontSize: '14px',
      color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
      lineHeight: '1.7',
      marginBottom: '20px',
    },
    socialLinks: {
      display: 'flex',
      gap: '12px',
    },
    socialLink: {
      color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
      transition: 'all 0.3s ease',
      padding: '10px',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      width: '40px',
      height: '40px',
    },
    sectionTitle: {
      fontSize: '16px',
      fontWeight: '700',
      marginBottom: '16px',
      color: isDark ? '#ffffff' : '#1f2937',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    linkList: {
      listStyle: 'none',
      padding: 0,
      margin: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    },
    link: {
      color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
      textDecoration: 'none',
      fontSize: '14px',
      transition: 'all 0.3s ease',
      display: 'inline-block',
    },
    contactItem: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    contactIcon: {
      display: 'inline',
      marginRight: '5px',
      verticalAlign: 'middle',
      height: '18px',
      width: '18px',
      color: isDark ? '#60a5fa' : '#3b82f6',
    },
    bottomBar: {
      borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
      paddingTop: '24px',
    },
    bottomContent: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '16px',
    },
    copyright: {
      fontSize: '14px',
      color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
      margin: 0,
    },
    legalLinks: {
      display: 'flex',
      gap: '24px',
      flexWrap: 'wrap',
    },
    legalLink: {
      color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
      textDecoration: 'none',
      fontSize: '13px',
      transition: 'all 0.3s ease',
      display: 'flex',
      alignItems: 'center',
    },
    legalIcon: {
      display: 'inline',
      marginRight: '4px',
      verticalAlign: 'middle',
      height: '16px',
      width: '16px',
    },
    badge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 10px',
      background: isDark 
        ? 'linear-gradient(135deg, rgba(0, 168, 107, 0.2), rgba(30, 136, 229, 0.2))' 
        : 'linear-gradient(135deg, rgba(0, 168, 107, 0.1), rgba(30, 136, 229, 0.1))',
      borderRadius: '20px',
      fontSize: '11px',
      fontWeight: '600',
      color: isDark ? '#34d399' : '#059669',
      marginBottom: '12px',
    },
  };

  return (
    <footer style={styles.footer}>
      <div style={styles.container}>
        
        {/* Main Footer Content */}
        <div style={styles.grid} className="footer-grid">
          
          {/* Company Info */}
          <div style={styles.section}>
            <div style={styles.badge}>
              🌱 AI-Powered Platform
            </div>
            <h3 style={styles.title}>Gamasusco</h3>
            <p style={styles.description}>
              AI-Powered Carbon Accounting Platform. Track, analyze, and reduce your organization's carbon footprint with intelligent insights and real-time monitoring.
            </p>
            <div style={styles.socialLinks}>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" style={styles.socialLink} className="footer-social-link">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" style={styles.socialLink} className="footer-social-link">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={styles.socialLink} className="footer-social-link">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>
              <span>🚀</span> Quick Links
            </h4>
            <ul style={styles.linkList}>
              <li><Link to="/dashboard" style={styles.link} className="footer-link">Dashboard</Link></li>
              <li><Link to="/activities" style={styles.link} className="footer-link">Activities</Link></li>
              <li><Link to="/analytics" style={styles.link} className="footer-link">Analytics</Link></li>
              <li><Link to="/reports" style={styles.link} className="footer-link">Reports</Link></li>
              <li><Link to="/goals" style={styles.link} className="footer-link">Goals & Targets</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>
              <span>📚</span> Resources
            </h4>
            <ul style={styles.linkList}>
              <li><Link to="/import" style={styles.link} className="footer-link">Import Workspace</Link></li>
              <li><Link to="/water" style={styles.link} className="footer-link">Water Management</Link></li>
              <li><Link to="/waste" style={styles.link} className="footer-link">Waste Management</Link></li>
              <li><Link to="/recommendations" style={styles.link} className="footer-link">AI Recommendations</Link></li>
              <li><Link to="/scope3" style={styles.link} className="footer-link">Scope 3 Tracking</Link></li>
            </ul>
          </div>

          {/* Support Section */}
          <div style={styles.section}>
            <h4 style={styles.sectionTitle}>
              <span>💬</span> Contact Us
            </h4>
            <ul style={styles.linkList}>
              <li style={styles.contactItem}>
                <EnvelopeIcon style={styles.contactIcon} />
                <a href="mailto:support@gamasusco.com" style={styles.link} className="footer-link">info@gamasusco.com</a>
              </li>
              <li style={styles.contactItem}>
                <PhoneIcon style={styles.contactIcon} />
                <a href="tel:+1234567890" style={styles.link} className="footer-link">+91 8329038702</a>
              </li>
              <li style={styles.contactItem}>
                <MapPinIcon style={styles.contactIcon} />
                <span style={styles.link}>7th floor, RBTIC SINE IIT Bombay Mumbai 400076 , India</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div style={styles.bottomBar}>
          <div style={styles.bottomContent} className="footer-bottom">
            <p style={styles.copyright}>
              © {currentYear} Gamasusco. All rights reserved. Built with 💚 for a sustainable future.
            </p>
            <div style={styles.legalLinks} className="footer-legal">
              <Link to="/privacy" style={styles.legalLink} className="footer-legal-link">
                <ShieldCheckIcon style={styles.legalIcon} />
                Privacy Policy
              </Link>
              <Link to="/terms" style={styles.legalLink} className="footer-legal-link">
                <DocumentTextIcon style={styles.legalIcon} />
                Terms of Service
              </Link>
              <Link to="/about" style={styles.legalLink} className="footer-legal-link">
                <InformationCircleIcon style={styles.legalIcon} />
                About Us
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

