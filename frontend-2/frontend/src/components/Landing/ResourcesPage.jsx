import { Link } from 'react-router-dom';
import { useResponsive } from '../../hooks/useResponsive';
import LOGO from '../Auth/gaamasusco-logo.png';

const ResourcesPage = () => {
  const { isMobile } = useResponsive();

  const resources = [
    {
      title: "Platform Overview (PDF)",
      description: "A concise summary of modules, architecture, and a typical deployment roadmap for internal decision-makers.",
      icon: "📑",
      type: "PDF",
      color: "#00A86B",
      downloadLink: "#"
    },
    {
      title: "Carbon Accounting Methodology",
      description: "A short document explaining how GamaSusCo handles scopes, emission factors, uncertainty, and data quality, aligned with GHG Protocol, ISO 14064, and Indian regulations.",
      icon: "📊",
      type: "PDF",
      color: "#1E88E5",
      downloadLink: "#"
    },
    {
      title: "Sample Pilot Results",
      description: "Example of how we quantified emissions, hotspots, and reduction options for a manufacturing or infrastructure client.",
      icon: "📈",
      type: "Case Study",
      color: "#14B8A6",
      downloadLink: "#"
    },
    {
      title: "Knowledge Articles & FAQs",
      description: "Short explainers on common questions around Scope 3, EPR, circular economy, and carbon credits.",
      icon: "📚",
      type: "Articles",
      color: "#F59E0B",
      downloadLink: "#"
    },
    {
      title: "BRSR Compliance Guide",
      description: "Detailed guide on Business Responsibility and Sustainability Reporting requirements and how GamaSusCo helps you comply.",
      icon: "📋",
      type: "Guide",
      color: "#8B5CF6",
      downloadLink: "#"
    },
    {
      title: "Scope 3 Deep Dive",
      description: "Comprehensive overview of Scope 3 categories, calculation methodologies, and best practices for value chain emissions.",
      icon: "🔍",
      type: "Whitepaper",
      color: "#EC4899",
      downloadLink: "#"
    }
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #000000 0%, #0a0a0a 100%)' }}>
      {/* Navigation Header */}
      <nav style={{
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        position: 'fixed',
        width: '100%',
        top: 0,
        zIndex: 1000,
        boxShadow: '0 2px 20px rgba(0,0,0,0.08)',
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 24px',
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <Link to="/" style={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            gap: '12px'
          }}>
            <img alt="GamaSusCo Logo" src={LOGO} style={{
              width: '60px',
              height: '50px',
              objectFit: 'contain',
              borderRadius: '8px',
            }} />
            <div>
              <div style={{
                fontSize: '22px',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #00A86B, #1E88E5)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>GamaSusCo</div>
              <div style={{
                fontSize: '10px',
                color: '#64748b',
                letterSpacing: '0.5px',
                fontWeight: '500'
              }}>AI-powered carbon intelligence</div>
            </div>
          </Link>

          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {['About', 'Modules', 'Resources', 'FAQ', 'Contact'].map((item) => (
                <Link
                  key={item}
                  to={`/${item.toLowerCase()}`}
                  style={{
                    padding: '10px 18px',
                    color: item === 'Resources' ? '#00A86B' : '#374151',
                    textDecoration: 'none',
                    fontWeight: item === 'Resources' ? '600' : '500',
                    fontSize: '15px',
                    borderRadius: '8px',
                    background: item === 'Resources' ? 'rgba(0,168,107,0.08)' : 'transparent',
                  }}
                >
                  {item}
                </Link>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link to="/login" style={{
              padding: '10px 24px',
              color: '#374151',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '14px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
            }}>
              Sign In
            </Link>
            <Link to="/register" style={{
              padding: '10px 24px',
              color: '#1E88E5',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '14px',
              borderRadius: '8px',
              border: '1px solid #1E88E5',
            }}>
              👤 User
            </Link>
            <Link to="/company-register" style={{
              padding: '10px 24px',
              background: 'linear-gradient(135deg, #00A86B, #059669)',
              color: 'white',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '14px',
              borderRadius: '8px',
              boxShadow: '0 4px 14px rgba(0,168,107,0.35)',
            }}>
              🏢 Company
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        padding: '160px 5% 60px',
        background: 'linear-gradient(135deg, #03121a 0%, #0a1628 50%, #03121a 100%)',
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          textAlign: 'center',
        }}>
          <span style={{
            display: 'inline-block',
            padding: '8px 20px',
            background: 'rgba(20,184,166,0.15)',
            borderRadius: '50px',
            fontSize: '13px',
            fontWeight: '600',
            color: '#2dd4bf',
            marginBottom: '24px',
          }}>
            📚 Resources
          </span>
          <h1 style={{
            fontSize: isMobile ? '32px' : '46px',
            fontWeight: '800',
            color: 'white',
            marginBottom: '20px',
            lineHeight: '1.2',
          }}>
            Learn how the platform works
          </h1>
          <p style={{
            fontSize: '17px',
            color: 'rgba(255,255,255,0.75)',
            lineHeight: '1.7',
          }}>
            Explore methodology notes, case studies, and explainers you can share with your team and leadership.
          </p>
        </div>
      </section>

      {/* Resources Grid */}
      <section style={{
        padding: '60px 5% 100px',
        background: 'linear-gradient(180deg, #0a1628 0%, #111827 100%)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '24px',
          }}>
            {resources.map((resource, idx) => (
              <div key={idx} style={{
                padding: '32px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '20px',
                border: `1px solid ${resource.color}25`,
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.borderColor = `${resource.color}50`;
                e.currentTarget.style.boxShadow = `0 20px 40px ${resource.color}15`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = `${resource.color}25`;
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '20px',
                }}>
                  <div style={{
                    width: '56px',
                    height: '56px',
                    background: `${resource.color}20`,
                    borderRadius: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '26px',
                  }}>
                    {resource.icon}
                  </div>
                  <span style={{
                    padding: '6px 12px',
                    background: `${resource.color}20`,
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                    color: resource.color,
                  }}>
                    {resource.type}
                  </span>
                </div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: 'white',
                  marginBottom: '12px',
                }}>
                  {resource.title}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.7)',
                  lineHeight: '1.7',
                  marginBottom: '24px',
                  flex: 1,
                }}>
                  {resource.description}
                </p>
                <a
                  href={resource.downloadLink}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 20px',
                    background: `${resource.color}15`,
                    borderRadius: '10px',
                    color: resource.color,
                    textDecoration: 'none',
                    fontWeight: '600',
                    fontSize: '14px',
                    transition: 'all 0.2s ease',
                    border: `1px solid ${resource.color}30`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${resource.color}25`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = `${resource.color}15`;
                  }}
                >
                  <span>Download</span>
                  <span>↓</span>
                </a>
              </div>
            ))}
          </div>

          {/* Request Custom Resources */}
          <div style={{
            marginTop: '60px',
            padding: '48px',
            background: 'linear-gradient(135deg, rgba(0,168,107,0.1), rgba(30,136,229,0.1))',
            borderRadius: '24px',
            border: '1px solid rgba(0,168,107,0.2)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>📧</div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: 'white',
              marginBottom: '12px',
            }}>
              Need something specific?
            </h2>
            <p style={{
              fontSize: '16px',
              color: 'rgba(255,255,255,0.7)',
              marginBottom: '24px',
              maxWidth: '500px',
              margin: '0 auto 24px',
            }}>
              Looking for industry-specific case studies or custom documentation? Let us know and we'll help.
            </p>
            <Link to="/contact" style={{
              display: 'inline-block',
              padding: '14px 32px',
              background: 'linear-gradient(135deg, #00A86B, #059669)',
              color: 'white',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '15px',
              boxShadow: '0 8px 30px rgba(0,168,107,0.4)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
              Request Resources
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '40px 5%',
        background: '#020b11',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        textAlign: 'center',
      }}>
        <p style={{
          fontSize: '14px',
          color: 'rgba(255,255,255,0.5)',
          margin: 0,
        }}>
          © {new Date().getFullYear()} GamaSusCo Private Limited. All rights reserved.
        </p>
      </footer>
    </div>
  );
};

export default ResourcesPage;

