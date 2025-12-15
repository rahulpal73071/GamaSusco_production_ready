import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useResponsive } from '../../hooks/useResponsive';
import LOGO from '../Auth/gaamasusco-logo.png';

const FAQPage = () => {
  const { isMobile } = useResponsive();
  const [activeAccordion, setActiveAccordion] = useState(null);

  const faqData = [
    {
      question: "Is this a consulting service or a software platform?",
      answer: "GamaSusCo is first a software platform, backed by domain expertise. We provide implementation support and advisory to help you get value quickly, but the core offering is a scalable, configurable digital platform."
    },
    {
      question: "Can you work with our existing Excel-based systems?",
      answer: "Yes. We start from your existing spreadsheets, ERP exports, invoices, and manual logs, and gradually move towards a structured, automated data pipeline. You do not need to change everything on day one."
    },
    {
      question: "Do you support multiple plants and locations?",
      answer: "The platform is designed for multi-entity, multi-site organisations. You can view consolidated results as well as facility-level details and comparisons."
    },
    {
      question: "Can we start small?",
      answer: "Absolutely. Many clients start with one plant or one module—for example, Scope 1 and 2—and then expand to Scope 3, ESG, and advanced analytics as they mature."
    },
    {
      question: "What emission factors do you use?",
      answer: "We use a combination of India-specific emission factors (from sources like CEA, IPCC, and industry databases) and international references (GHG Protocol, DEFRA, EPA). The factor library is continuously updated and can be customized for your specific needs."
    },
    {
      question: "How does the AI component work?",
      answer: "Our AI layer helps with automatic classification of activity data, anomaly detection, hotspot identification, and generating actionable recommendations. It learns from your data patterns while maintaining full transparency in calculations."
    },
    {
      question: "Is my data secure?",
      answer: "Yes. We follow enterprise-grade security practices including encrypted data storage, secure transmission (HTTPS/TLS), role-based access controls, and regular security audits. Your data is never shared with third parties."
    },
    {
      question: "What reporting frameworks do you support?",
      answer: "We support BRSR (Business Responsibility and Sustainability Reporting), GRI Standards, ISO 14064-1, CDP disclosures, and can adapt to CBAM requirements. Reports can be exported in multiple formats."
    },
    {
      question: "How long does implementation take?",
      answer: "A basic pilot for one facility typically takes 2-4 weeks. Full enterprise deployment depends on scope but usually ranges from 2-3 months. We provide dedicated onboarding support throughout."
    },
    {
      question: "Do you provide training?",
      answer: "Yes, we provide comprehensive training for your team covering platform usage, carbon accounting fundamentals, and best practices. Training can be conducted online or on-site."
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
                    color: item === 'FAQ' ? '#00A86B' : '#374151',
                    textDecoration: 'none',
                    fontWeight: item === 'FAQ' ? '600' : '500',
                    fontSize: '15px',
                    borderRadius: '8px',
                    background: item === 'FAQ' ? 'rgba(0,168,107,0.08)' : 'transparent',
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
            background: 'rgba(167,139,250,0.15)',
            borderRadius: '50px',
            fontSize: '13px',
            fontWeight: '600',
            color: '#a78bfa',
            marginBottom: '24px',
          }}>
            ❓ Frequently Asked Questions
          </span>
          <h1 style={{
            fontSize: isMobile ? '32px' : '46px',
            fontWeight: '800',
            color: 'white',
            marginBottom: '20px',
            lineHeight: '1.2',
          }}>
            Got questions? We've got answers
          </h1>
          <p style={{
            fontSize: '17px',
            color: 'rgba(255,255,255,0.75)',
            lineHeight: '1.7',
          }}>
            Everything you need to know about GamaSusCo and our carbon accounting platform.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section style={{
        padding: '60px 5% 100px',
        background: 'linear-gradient(180deg, #0a1628 0%, #111827 100%)',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {faqData.map((faq, idx) => (
              <div key={idx} style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '16px',
                border: activeAccordion === idx 
                  ? '1px solid rgba(167,139,250,0.4)' 
                  : '1px solid rgba(255,255,255,0.1)',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
              }}>
                <button
                  onClick={() => setActiveAccordion(activeAccordion === idx ? null : idx)}
                  style={{
                    width: '100%',
                    padding: '24px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    textAlign: 'left',
                    gap: '16px',
                  }}
                >
                  <span style={{
                    fontSize: '17px',
                    fontWeight: '600',
                    color: 'white',
                    flex: 1,
                  }}>
                    {faq.question}
                  </span>
                  <span style={{
                    fontSize: '24px',
                    color: '#a78bfa',
                    transform: activeAccordion === idx ? 'rotate(45deg)' : 'rotate(0)',
                    transition: 'transform 0.3s ease',
                    flexShrink: 0,
                  }}>
                    +
                  </span>
                </button>
                <div style={{
                  maxHeight: activeAccordion === idx ? '500px' : '0',
                  overflow: 'hidden',
                  transition: 'max-height 0.3s ease',
                }}>
                  <div style={{ padding: '0 24px 24px' }}>
                    <p style={{
                      fontSize: '15px',
                      color: 'rgba(255,255,255,0.75)',
                      lineHeight: '1.7',
                      margin: 0,
                    }}>
                      {faq.answer}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Still have questions */}
          <div style={{
            marginTop: '60px',
            padding: '48px',
            background: 'linear-gradient(135deg, rgba(0,168,107,0.1), rgba(30,136,229,0.1))',
            borderRadius: '24px',
            border: '1px solid rgba(0,168,107,0.2)',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>💬</div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: 'white',
              marginBottom: '12px',
            }}>
              Still have questions?
            </h2>
            <p style={{
              fontSize: '16px',
              color: 'rgba(255,255,255,0.7)',
              marginBottom: '24px',
            }}>
              Can't find what you're looking for? Reach out to our team.
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
              Contact Us
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

export default FAQPage;

