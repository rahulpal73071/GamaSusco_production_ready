import { Link } from 'react-router-dom';
import { useResponsive } from '../../hooks/useResponsive';
import LOGO from '../Auth/gaamasusco-logo.png';

const ModulesPage = () => {
  const { isMobile } = useResponsive();

  const modules = [
    {
      title: "Carbon Accounting Engine",
      description: "Scope 1, 2, and 3 calculations with category-wise logic, factor libraries, and audit-ready outputs. Supports both activity-based and spend-based methods.",
      icon: "🌍",
      color: "#00A86B",
      features: [
        "Automated Scope 1, 2, and 3 calculations",
        "Multi-facility, multi-entity support",
        "Factor libraries for fuels, electricity, transport, materials",
        "Audit-ready documentation and reports"
      ]
    },
    {
      title: "ESG & BRSR Reporting",
      description: "Structure and export data for BRSR and ESG disclosures, aligned with ISO 14064 and GRI standards. Generate compliance-ready reports.",
      icon: "📋",
      color: "#1E88E5",
      features: [
        "BRSR-aligned reporting structure",
        "GRI Standards compatibility",
        "ISO 14064-1 compliant outputs",
        "Automated disclosure mapping"
      ]
    },
    {
      title: "Circularity & Scrap (ScrapX)",
      description: "Quantify scrap flows, recycling benefits, and CO₂ savings. Link to scrap trading value and circular economy metrics.",
      icon: "♻️",
      color: "#14B8A6",
      features: [
        "Material flow analysis",
        "Recycling benefit calculations",
        "Scrap value optimization",
        "Circular economy indicators"
      ]
    },
    {
      title: "LCA & Project Evaluation",
      description: "Evaluate low-carbon projects and technology alternatives using LCA-informed indicators. Compare scenarios and investment options.",
      icon: "🔬",
      color: "#8B5CF6",
      features: [
        "Life cycle assessment tools",
        "Technology comparison",
        "Scenario modelling",
        "Investment impact analysis"
      ]
    },
    {
      title: "Carbon Credits & EPR",
      description: "Model baselines, reductions, and link them to EPR obligations and carbon credit mechanisms. Track monetization opportunities.",
      icon: "💳",
      color: "#F59E0B",
      features: [
        "Baseline and reduction tracking",
        "EPR obligation management",
        "Carbon credit quantification",
        "CCTS integration ready"
      ]
    },
    {
      title: "Event Footprint Tools",
      description: "Quick calculators for events, trainings, and workshops. Useful as a training and outreach base for sustainability awareness.",
      icon: "🎯",
      color: "#EC4899",
      features: [
        "Event carbon calculators",
        "Training workshop tools",
        "Quick assessments",
        "Awareness reporting"
      ]
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
                    color: item === 'Modules' ? '#00A86B' : '#374151',
                    textDecoration: 'none',
                    fontWeight: item === 'Modules' ? '600' : '500',
                    fontSize: '15px',
                    borderRadius: '8px',
                    background: item === 'Modules' ? 'rgba(0,168,107,0.08)' : 'transparent',
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
          maxWidth: '900px',
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
            🧩 Platform Modules
          </span>
          <h1 style={{
            fontSize: isMobile ? '32px' : '46px',
            fontWeight: '800',
            color: 'white',
            marginBottom: '20px',
            lineHeight: '1.2',
          }}>
            Everything you need for carbon management
          </h1>
          <p style={{
            fontSize: '17px',
            color: 'rgba(255,255,255,0.75)',
            lineHeight: '1.7',
            maxWidth: '700px',
            margin: '0 auto',
          }}>
            GamaSusCo's modular platform lets you start with what you need and expand as you grow. 
            Each module integrates seamlessly with the others.
          </p>
        </div>
      </section>

      {/* Modules Grid */}
      <section style={{
        padding: '60px 5% 100px',
        background: 'linear-gradient(180deg, #0a1628 0%, #111827 100%)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '24px',
          }}>
            {modules.map((module, idx) => (
              <div key={idx} style={{
                padding: '36px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '24px',
                border: `1px solid ${module.color}30`,
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.borderColor = `${module.color}60`;
                e.currentTarget.style.boxShadow = `0 25px 50px ${module.color}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = `${module.color}30`;
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{
                  width: '70px',
                  height: '70px',
                  background: `${module.color}20`,
                  borderRadius: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '32px',
                  marginBottom: '24px',
                }}>
                  {module.icon}
                </div>
                <h3 style={{
                  fontSize: '22px',
                  fontWeight: '700',
                  color: module.color,
                  marginBottom: '14px',
                }}>
                  {module.title}
                </h3>
                <p style={{
                  fontSize: '15px',
                  color: 'rgba(255,255,255,0.75)',
                  lineHeight: '1.7',
                  marginBottom: '24px',
                }}>
                  {module.description}
                </p>
                <ul style={{
                  margin: 0,
                  padding: 0,
                  listStyle: 'none',
                }}>
                  {module.features.map((feature, fidx) => (
                    <li key={fidx} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '14px',
                      color: 'rgba(255,255,255,0.7)',
                      marginBottom: '10px',
                    }}>
                      <span style={{ color: module.color }}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Integration Banner */}
          <div style={{
            marginTop: '60px',
            padding: '48px',
            background: 'linear-gradient(135deg, rgba(0,168,107,0.08), rgba(30,136,229,0.08))',
            borderRadius: '24px',
            border: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '32px',
          }}>
            <div style={{ flex: 1 }}>
              <h2 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: 'white',
                marginBottom: '12px',
              }}>
                Seamless Integration
              </h2>
              <p style={{
                fontSize: '16px',
                color: 'rgba(255,255,255,0.7)',
                margin: 0,
              }}>
                All modules share a common data layer, ensuring consistency across your sustainability stack. 
                Start with one and expand as needed.
              </p>
            </div>
            <Link to="/contact" style={{
              padding: '16px 32px',
              background: 'linear-gradient(135deg, #00A86B, #059669)',
              color: 'white',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '15px',
              boxShadow: '0 8px 30px rgba(0,168,107,0.4)',
              transition: 'all 0.3s ease',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
            }}>
              See a Demo
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

export default ModulesPage;

