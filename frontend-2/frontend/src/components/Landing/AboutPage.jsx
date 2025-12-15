import { Link } from 'react-router-dom';
import { useResponsive } from '../../hooks/useResponsive';
import LOGO from '../Auth/gaamasusco-logo.png';

const AboutPage = () => {
  const { isMobile } = useResponsive();

  const highlights = [
    {
      title: "Research roots",
      description: "Originated from PhD-level research on circular economy, PET transitions, and integrated planetary models.",
      icon: "🎓",
      color: "#00A86B"
    },
    {
      title: "Industry grounded",
      description: "Experience across industrial projects in Scope 3 accounting, scrap systems, refinery decarbonisation, and LCA studies.",
      icon: "🏭",
      color: "#1E88E5"
    },
    {
      title: "India-first, global-ready",
      description: "Designed around BRSR, EPR, and India's Carbon Credit Trading Scheme (CCTS), while compatible with GRI, ISO 14064, and CBAM.",
      icon: "🌏",
      color: "#F59E0B"
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
                    color: item === 'About' ? '#00A86B' : '#374151',
                    textDecoration: 'none',
                    fontWeight: item === 'About' ? '600' : '500',
                    fontSize: '15px',
                    borderRadius: '8px',
                    background: item === 'About' ? 'rgba(0,168,107,0.08)' : 'transparent',
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
        padding: '160px 5% 80px',
        background: 'linear-gradient(135deg, #03121a 0%, #0a1628 50%, #03121a 100%)',
      }}>
        <div style={{
          maxWidth: '1000px',
          margin: '0 auto',
          textAlign: 'center',
        }}>
          <span style={{
            display: 'inline-block',
            padding: '8px 20px',
            background: 'rgba(0,168,107,0.15)',
            borderRadius: '50px',
            fontSize: '13px',
            fontWeight: '600',
            color: '#34d399',
            marginBottom: '24px',
          }}>
            🌱 About GamaSusCo
          </span>
          <h1 style={{
            fontSize: isMobile ? '36px' : '52px',
            fontWeight: '800',
            color: 'white',
            marginBottom: '24px',
            lineHeight: '1.2',
          }}>
            Built by sustainability practitioners,{' '}
            <span style={{
              background: 'linear-gradient(135deg, #00A86B, #1E88E5)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>for industry</span>
          </h1>
        </div>
      </section>

      {/* About Content */}
      <section style={{
        padding: '80px 5%',
        background: 'linear-gradient(180deg, #0a1628 0%, #111827 100%)',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{
            padding: '48px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.1)',
            marginBottom: '60px',
          }}>
            <p style={{
              fontSize: '18px',
              color: 'rgba(255,255,255,0.9)',
              lineHeight: '1.8',
              marginBottom: '24px',
            }}>
              <strong style={{ color: '#34d399' }}>GamaSusCo</strong> is a climate-tech company founded by sustainability 
              researchers and engineers who have worked extensively on circular economy, life cycle assessment (LCA), 
              and greenhouse gas accounting across sectors such as plastics, refineries, and infrastructure.
            </p>
            <p style={{
              fontSize: '18px',
              color: 'rgba(255,255,255,0.85)',
              lineHeight: '1.8',
              margin: 0,
            }}>
              We built this platform because most carbon tools either oversimplify reality or disappear into spreadsheets. 
              Our mission is to provide a <strong style={{ color: '#60a5fa' }}>scientifically sound</strong>, 
              <strong style={{ color: '#fbbf24' }}> India-aware</strong>, and 
              <strong style={{ color: '#a78bfa' }}> AI-enabled</strong> way for organisations to measure, manage, and 
              monetise their environmental performance—without drowning in manual data handling.
            </p>
          </div>

          {/* Highlight Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}>
            {highlights.map((highlight, idx) => (
              <div key={idx} style={{
                padding: '32px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '20px',
                border: `1px solid ${highlight.color}30`,
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.borderColor = `${highlight.color}60`;
                e.currentTarget.style.boxShadow = `0 20px 40px ${highlight.color}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = `${highlight.color}30`;
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: `${highlight.color}20`,
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  marginBottom: '20px',
                }}>
                  {highlight.icon}
                </div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: highlight.color,
                  marginBottom: '12px',
                }}>
                  {highlight.title}
                </h3>
                <p style={{
                  fontSize: '15px',
                  color: 'rgba(255,255,255,0.75)',
                  lineHeight: '1.7',
                  margin: 0,
                }}>
                  {highlight.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Mission */}
      <section style={{
        padding: '80px 5%',
        background: 'linear-gradient(180deg, #111827 0%, #0f172a 100%)',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
          <span style={{
            display: 'inline-block',
            padding: '8px 16px',
            background: 'rgba(30,136,229,0.15)',
            borderRadius: '50px',
            fontSize: '13px',
            fontWeight: '600',
            color: '#60a5fa',
            marginBottom: '20px',
          }}>
            🎯 Our Mission
          </span>
          <h2 style={{
            fontSize: isMobile ? '28px' : '36px',
            fontWeight: '700',
            color: 'white',
            marginBottom: '24px',
          }}>
            Democratising carbon intelligence
          </h2>
          <p style={{
            fontSize: '18px',
            color: 'rgba(255,255,255,0.8)',
            lineHeight: '1.8',
            maxWidth: '700px',
            margin: '0 auto',
          }}>
            We believe every organisation—regardless of size or sector—should have access to world-class 
            carbon accounting tools. Our platform brings research-grade methodology to practical, everyday 
            sustainability management, helping companies make the transition from compliance-driven reporting 
            to genuine decarbonisation.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '100px 5%',
        background: 'linear-gradient(135deg, #03121a 0%, #062436 50%, #03121a 100%)',
      }}>
        <div style={{
          maxWidth: '700px',
          margin: '0 auto',
          textAlign: 'center',
        }}>
          <h2 style={{
            fontSize: isMobile ? '28px' : '36px',
            fontWeight: '700',
            color: 'white',
            marginBottom: '24px',
          }}>
            Ready to work with us?
          </h2>
          <p style={{
            fontSize: '17px',
            color: 'rgba(255,255,255,0.75)',
            marginBottom: '32px',
          }}>
            Whether you're exploring a pilot or ready to scale, we'd love to hear from you.
          </p>
          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            <Link to="/contact" style={{
              padding: '16px 32px',
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
              e.currentTarget.style.transform = 'translateY(-3px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
              Contact Us
            </Link>
            <Link to="/" style={{
              padding: '16px 32px',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              borderRadius: '10px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '15px',
              border: '1px solid rgba(255,255,255,0.2)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
            }}>
              Back to Home
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

export default AboutPage;

