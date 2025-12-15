import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useResponsive } from '../../hooks/useResponsive';
import LOGO from '../Auth/gaamasusco-logo.png';

const ContactPage = () => {
  const { isMobile } = useResponsive();
  const [formData, setFormData] = useState({
    name: '',
    organisation: '',
    email: '',
    phone: '',
    lookingFor: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send the form data to your backend
    console.log('Form submitted:', formData);
    setSubmitted(true);
  };

  const lookingForOptions = [
    "Platform demo",
    "Pilot for one plant / unit",
    "BRSR / ESG support",
    "Scope 3 / value-chain accounting",
    "Partnership / collaboration",
    "Other"
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
                    color: item === 'Contact' ? '#00A86B' : '#374151',
                    textDecoration: 'none',
                    fontWeight: item === 'Contact' ? '600' : '500',
                    fontSize: '15px',
                    borderRadius: '8px',
                    background: item === 'Contact' ? 'rgba(0,168,107,0.08)' : 'transparent',
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
            background: 'rgba(0,168,107,0.15)',
            borderRadius: '50px',
            fontSize: '13px',
            fontWeight: '600',
            color: '#34d399',
            marginBottom: '24px',
          }}>
            📞 Contact GamaSusCo
          </span>
          <h1 style={{
            fontSize: isMobile ? '32px' : '46px',
            fontWeight: '800',
            color: 'white',
            marginBottom: '20px',
            lineHeight: '1.2',
          }}>
            Let's start a conversation
          </h1>
          <p style={{
            fontSize: '17px',
            color: 'rgba(255,255,255,0.75)',
            lineHeight: '1.7',
          }}>
            Whether you're exploring a pilot, looking to replace spreadsheets, or need support with BRSR 
            and carbon accounting, we'd be happy to talk. Share a few details and we'll get back to you.
          </p>
        </div>
      </section>

      {/* Contact Form Section */}
      <section style={{
        padding: '60px 5% 100px',
        background: 'linear-gradient(180deg, #0a1628 0%, #111827 100%)',
      }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          {submitted ? (
            <div style={{
              padding: '60px 40px',
              background: 'rgba(0,168,107,0.1)',
              borderRadius: '24px',
              border: '1px solid rgba(0,168,107,0.3)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '64px', marginBottom: '24px' }}>✅</div>
              <h2 style={{
                fontSize: '28px',
                fontWeight: '700',
                color: '#34d399',
                marginBottom: '16px',
              }}>
                Thank you for reaching out!
              </h2>
              <p style={{
                fontSize: '16px',
                color: 'rgba(255,255,255,0.8)',
                marginBottom: '32px',
              }}>
                We've received your message and will get back to you within 24-48 hours.
              </p>
              <Link to="/" style={{
                padding: '14px 28px',
                background: 'linear-gradient(135deg, #00A86B, #059669)',
                color: 'white',
                borderRadius: '10px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '15px',
              }}>
                Back to Home
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{
              padding: '48px',
              background: 'rgba(255,255,255,0.05)',
              borderRadius: '24px',
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <div style={{ display: 'grid', gap: '24px' }}>
                {/* Name */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'rgba(255,255,255,0.9)',
                    marginBottom: '8px',
                  }}>
                    Your full name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#00A86B';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    }}
                  />
                </div>

                {/* Organisation */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'rgba(255,255,255,0.9)',
                    marginBottom: '8px',
                  }}>
                    Company / Institute name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="organisation"
                    value={formData.organisation}
                    onChange={handleChange}
                    required
                    placeholder="Acme Corporation"
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#00A86B';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    }}
                  />
                </div>

                {/* Email */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'rgba(255,255,255,0.9)',
                    marginBottom: '8px',
                  }}>
                    Work email <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="name@organisation.com"
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#00A86B';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    }}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'rgba(255,255,255,0.9)',
                    marginBottom: '8px',
                  }}>
                    Phone (optional)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#00A86B';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    }}
                  />
                </div>

                {/* Looking For */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'rgba(255,255,255,0.9)',
                    marginBottom: '8px',
                  }}>
                    What are you looking for? <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    name="lookingFor"
                    value={formData.lookingFor}
                    onChange={handleChange}
                    required
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '10px',
                      color: formData.lookingFor ? 'white' : 'rgba(255,255,255,0.5)',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#00A86B';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    }}
                  >
                    <option value="" disabled>Select an option...</option>
                    {lookingForOptions.map((option) => (
                      <option key={option} value={option} style={{ background: '#1e293b', color: 'white' }}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'rgba(255,255,255,0.9)',
                    marginBottom: '8px',
                  }}>
                    Message
                  </label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows={5}
                    placeholder="Share a bit about your organisation, current challenges, and timelines..."
                    style={{
                      width: '100%',
                      padding: '14px 18px',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      borderRadius: '10px',
                      color: 'white',
                      fontSize: '15px',
                      outline: 'none',
                      transition: 'all 0.2s ease',
                      resize: 'vertical',
                      minHeight: '120px',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#00A86B';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    }}
                  />
                </div>

                {/* Privacy Note */}
                <p style={{
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.5)',
                  lineHeight: '1.6',
                  margin: 0,
                }}>
                  🔒 By submitting this form, you agree to be contacted by GamaSusCo regarding your enquiry. 
                  We will not spam you or share your details with third parties.
                </p>

                {/* Submit Button */}
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    padding: '16px 32px',
                    background: 'linear-gradient(135deg, #00A86B, #059669)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '700',
                    fontSize: '16px',
                    cursor: 'pointer',
                    boxShadow: '0 8px 30px rgba(0,168,107,0.4)',
                    transition: 'all 0.3s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,168,107,0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,168,107,0.4)';
                  }}
                >
                  Send Message →
                </button>
              </div>
            </form>
          )}

          {/* Direct Contact */}
          <div style={{
            marginTop: '40px',
            padding: '32px',
            background: 'rgba(255,255,255,0.03)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.08)',
            textAlign: 'center',
          }}>
            <p style={{
              fontSize: '15px',
              color: 'rgba(255,255,255,0.7)',
              margin: 0,
            }}>
              You can also reach us at:{' '}
              <a href="mailto:info@gamasusco.com" style={{
                color: '#34d399',
                textDecoration: 'none',
                fontWeight: '600',
              }}>
                info@gamasusco.com
              </a>
            </p>
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

export default ContactPage;

