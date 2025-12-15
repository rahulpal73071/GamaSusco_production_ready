import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useResponsive } from '../../hooks/useResponsive';
import ShinyText from '../animations/ShinyText';
import RotatingText from '../animations/RotatingText';
import StarBorder from '../animations/StarBorder';
import LightRays from '../animations/Lightrays';
import LOGO from '../Auth/gaamasusco-logo.png';

const LandingPage = () => {
  const { isMobile, isTablet } = useResponsive();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState(null);

  // FAQ Data
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
    }
  ];

  // Four Pillars Data
  const pillars = [
    {
      title: "Measure",
      icon: "📊",
      color: "#00A86B",
      features: [
        "Automated Scope 1, 2, and 3 calculations using activity- and spend-based methods",
        "Multi-facility, multi-entity support with consistent boundaries and methodologies",
        "Factor libraries mapped to fuels, electricity, transport, materials, waste, and services"
      ]
    },
    {
      title: "Manage",
      icon: "⚙️",
      color: "#1E88E5",
      features: [
        "Dashboards for energy, water, waste, and materials",
        "Intensity metrics per product, revenue, floor area, or other business KPIs",
        "Benchmarking across sites, time periods, and industry references"
      ]
    },
    {
      title: "Reduce",
      icon: "📉",
      color: "#14B8A6",
      features: [
        "Identify emission hotspots and resource-inefficient operations in minutes",
        "Simulate reduce–reuse–recycle strategies and technology shifts",
        "Support decision-making for process changes, retrofits, and circularity initiatives"
      ]
    },
    {
      title: "Monetize",
      icon: "💰",
      color: "#F59E0B",
      features: [
        "Translate reductions into EPR credits, carbon credits, and scrap/circularity value",
        "Evaluate project-level opportunities such as biochar, agroforestry, or low-carbon process routes",
        "Connect footprint results to financial impact and business cases"
      ]
    }
  ];

  // Process Steps
  const processSteps = [
    {
      step: "01",
      title: "Capture activity data",
      description: "Import fuel consumption, electricity use, production volumes, travel, logistics, waste, and spend data. Support for Excel/CSV uploads, ERP exports, invoices, meter readings, and manual logs.",
      icon: "📥"
    },
    {
      step: "02",
      title: "Map and classify",
      description: "AI and rule-based mapping assign each line item to the correct scope, category, and emission factor source. Standardised treatment of Scope 1, Scope 2 (location- and market-based), and Scope 3 categories.",
      icon: "🗂️"
    },
    {
      step: "03",
      title: "Calculate and validate",
      description: "The engine applies approved emission factors to calculate CO₂e. Anomaly checks flag unusually high or low values, missing data, and inconsistent units. Intensity metrics are automatically computed.",
      icon: "🔢"
    },
    {
      step: "04",
      title: "Visualise and act",
      description: "Dashboards break down emissions by source, facility, business unit, and value-chain segment. Hotspot analysis highlights where reductions will have the most impact.",
      icon: "📈"
    }
  ];

  // Platform Modules
  const modules = [
    { title: "Carbon Accounting Engine", description: "Scope 1, 2, and 3 with category-wise logic, factor libraries, and audit-ready outputs", icon: "🌍" },
    { title: "ESG & BRSR Reporting", description: "Structure and export data for BRSR and ESG disclosures, aligned with ISO 14064 and GRI", icon: "📋" },
    { title: "Circularity & Scrap (ScrapX)", description: "Quantify scrap flows, recycling benefits, and CO₂ savings, and link to scrap trading value", icon: "♻️" },
    { title: "LCA & Project Evaluation", description: "Evaluate low-carbon projects and technology alternatives using LCA-informed indicators", icon: "🔬" },
    { title: "Carbon Credits & EPR", description: "Model baselines, reductions, and link them to EPR obligations and carbon credit mechanisms", icon: "💳" },
    { title: "Event Footprint Tools", description: "Quick calculators for events, trainings, and workshops, useful as a training and outreach base", icon: "🎯" }
  ];

  // Target Users
  const targetUsers = [
    { title: "Manufacturing & Process Industries", description: "Chemicals, plastics, cement, metals, etc.", icon: "🏭" },
    { title: "Refineries & Energy-Intensive Industries", description: "Oil & gas, power generation", icon: "⚡" },
    { title: "FMCG & Packaging", description: "Plastics value chains and consumer goods", icon: "📦" },
    { title: "Infrastructure & Mobility", description: "Metros, transport operators, logistics", icon: "🚆" },
    { title: "IT/ITES & Services", description: "Large Scope 3 footprints and supply chains", icon: "💻" }
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
          {/* Logo */}
          <Link to="/" style={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            gap: '12px'
          }}>
            <img alt="GamaSusCo Logo" src={LOGO} style={{
              width: '80px',
              height: '65px',
              objectFit: 'contain',
              borderRadius: '10px',
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

          {/* Desktop Navigation */}
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {['About', 'Modules', 'Resources', 'FAQ', 'Contact'].map((item) => (
                <Link
                  key={item}
                  to={`/${item.toLowerCase()}`}
                  style={{
                    padding: '10px 18px',
                    color: '#374151',
                    textDecoration: 'none',
                    fontWeight: '500',
                    fontSize: '15px',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0,168,107,0.08)';
                    e.currentTarget.style.color = '#00A86B';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = '#374151';
                  }}
                >
                  {item}
                </Link>
              ))}
            </div>
          )}

          {/* CTA Buttons */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {!isMobile && (
              <>
                <Link to="/login" style={{
                  padding: '10px 24px',
                  color: '#374151',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '14px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#00A86B';
                  e.currentTarget.style.color = '#00A86B';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.color = '#374151';
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
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(30,136,229,0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
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
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,168,107,0.45)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,168,107,0.35)';
                }}>
                  🏢 Company
                </Link>
              </>
            )}

            {/* Mobile Menu Button */}
            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  padding: '8px',
                }}
              >
                {mobileMenuOpen ? '✕' : '☰'}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobile && mobileMenuOpen && (
          <div style={{
            background: 'white',
            padding: '20px',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            {['About', 'Modules', 'Resources', 'FAQ', 'Contact'].map((item) => (
              <Link
                key={item}
                to={`/${item.toLowerCase()}`}
                onClick={() => setMobileMenuOpen(false)}
                style={{
                  padding: '12px 16px',
                  color: '#374151',
                  textDecoration: 'none',
                  fontWeight: '500',
                  borderRadius: '8px',
                  background: '#f9fafb',
                }}
              >
                {item}
              </Link>
            ))}
            <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px', marginTop: '4px' }}>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '8px', fontWeight: '600' }}>
                GET STARTED
              </p>
            </div>
            <Link to="/login" style={{
              padding: '12px 16px',
              color: '#374151',
              textDecoration: 'none',
              fontWeight: '600',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              textAlign: 'center',
            }}
            onClick={() => setMobileMenuOpen(false)}>
              Sign In
            </Link>
            <Link to="/register" style={{
              padding: '12px 16px',
              color: '#1E88E5',
              textDecoration: 'none',
              fontWeight: '600',
              borderRadius: '8px',
              border: '1px solid #1E88E5',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            onClick={() => setMobileMenuOpen(false)}>
              👤 User Register
            </Link>
            <Link to="/company-register" style={{
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #00A86B, #059669)',
              color: 'white',
              textDecoration: 'none',
              fontWeight: '600',
              borderRadius: '8px',
              textAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
            onClick={() => setMobileMenuOpen(false)}>
              🏢 Company Register
            </Link>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '120px 5% 80px',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #03121a 0%, #0a1628 50%, #03121a 100%)',
      }}>
        {/* Animated background particles */}
        <div style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          zIndex: 0,
        }}>
          {/* Floating orbs */}
          <div style={{
            position: 'absolute',
            top: '10%',
            left: '10%',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(0,168,107,0.15) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'floatOrb1 15s ease-in-out infinite',
            filter: 'blur(40px)',
          }} />
          <div style={{
            position: 'absolute',
            top: '60%',
            right: '5%',
            width: '400px',
            height: '400px',
            background: 'radial-gradient(circle, rgba(30,136,229,0.12) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'floatOrb2 18s ease-in-out infinite',
            filter: 'blur(50px)',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '20%',
            left: '20%',
            width: '250px',
            height: '250px',
            background: 'radial-gradient(circle, rgba(20,184,166,0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'floatOrb3 12s ease-in-out infinite',
            filter: 'blur(35px)',
          }} />
          {/* Animated grid lines */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(0,168,107,0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0,168,107,0.03) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
            animation: 'gridMove 20s linear infinite',
          }} />
        </div>

        <div style={{ position: 'absolute', inset: 0, zIndex: 1, opacity: 0.6 }}>
          <LightRays
            raysOrigin='top-center'
            raysColor="#00ffaa"
            raysSpeed={0.8}
            lightSpread={5}
            rayLength={3}
            followMouse={true}
            mouseInfluence={0.08}
            noiseAmount={0.05}
            distortion={0.03}
          />
        </div>

        <div style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: '1000px',
          textAlign: 'center',
        }}>
          {/* Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 24px',
            borderRadius: '50px',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '32px',
            background: 'rgba(0,168,107,0.15)',
            border: '1px solid rgba(0,168,107,0.3)',
            color: '#34d399',
            animation: 'fadeInDown 0.8s ease-out forwards',
            backdropFilter: 'blur(10px)',
          }}>
            <span style={{ animation: 'pulse 2s ease-in-out infinite' }}>🌱</span>
            <span>AI-powered carbon intelligence for real-world operations</span>
          </div>

          {/* Main Headline */}
          <h1 style={{
            fontSize: isMobile ? '36px' : '60px',
            fontWeight: '800',
            marginBottom: '24px',
            lineHeight: '1.1',
            color: 'white',
            animation: 'fadeInUp 0.8s ease-out 0.2s backwards',
          }}>
            AI-powered carbon accounting for{' '}
            <span style={{
              background: 'linear-gradient(135deg, #00A86B, #14B8A6, #1E88E5)',
              backgroundSize: '200% 200%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'gradientShift 4s ease infinite',
            }}>
              real-world operations
            </span>
          </h1>

          {/* Subheadline */}
          <p style={{
            fontSize: isMobile ? '17px' : '20px',
            color: 'rgba(255,255,255,0.85)',
            marginBottom: '20px',
            lineHeight: '1.7',
            maxWidth: '800px',
            margin: '0 auto 20px',
            animation: 'fadeInUp 0.8s ease-out 0.4s backwards',
          }}>
            GamaSusCo's platform turns messy operational data into audit-ready Scope 1, 2, and 3 emissions, 
            ESG reports, and reduction pathways — aligned with Indian and global standards.
          </p>

          {/* Supporting Line */}
          <p style={{
            fontSize: '15px',
            color: 'rgba(255,255,255,0.6)',
            marginBottom: '40px',
            fontStyle: 'italic',
            animation: 'fadeInUp 0.8s ease-out 0.5s backwards',
          }}>
            Built for organisations serious about decarbonisation, compliance, and circular economy implementation.
          </p>

          {/* CTA Buttons */}
          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '48px',
            animation: 'fadeInUp 0.8s ease-out 0.6s backwards',
          }}>
            <Link to="/contact" style={{
              padding: '18px 36px',
              background: 'linear-gradient(135deg, #00A86B, #059669)',
              color: 'white',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '700',
              fontSize: '16px',
              boxShadow: '0 8px 30px rgba(0,168,107,0.4)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,168,107,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,168,107,0.4)';
            }}>
              <span>Book a live walkthrough</span>
              <span>→</span>
            </Link>
            <Link to="/resources" style={{
              padding: '18px 36px',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '16px',
              border: '1px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
            }}>
              <span>📄</span>
              <span>Download product one-pager</span>
            </Link>
          </div>

          {/* Trust Line */}
          <div style={{
            padding: '20px 28px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '16px',
            border: '1px solid rgba(255,255,255,0.1)',
            maxWidth: '700px',
            margin: '0 auto',
            animation: 'fadeInUp 0.8s ease-out 0.8s backwards',
            backdropFilter: 'blur(10px)',
          }}>
            <p style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.7)',
              margin: 0,
              lineHeight: '1.6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              flexWrap: 'wrap',
            }}>
              <span style={{ fontSize: '18px' }}>🎓</span>
              <span>Built by sustainability researchers and practitioners with hands-on experience in LCA, ISO 14064, 
              BRSR, Scope 3 accounting, and circular economy projects.</span>
            </p>
          </div>

          {/* Floating Stats */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: isMobile ? '16px' : '40px',
            marginTop: '48px',
            flexWrap: 'wrap',
            animation: 'fadeInUp 0.8s ease-out 1s backwards',
          }}>
            {[
              { value: '50+', label: 'Emission Factors', delay: '1.1s' },
              { value: '3', label: 'Scopes Covered', delay: '1.2s' },
              { value: '100%', label: 'India Ready', delay: '1.3s' },
            ].map((stat, idx) => (
              <div key={idx} style={{
                textAlign: 'center',
                padding: '16px 24px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.08)',
                minWidth: '100px',
                animation: `fadeInUp 0.6s ease-out ${stat.delay} backwards`,
              }}>
                <div style={{
                  fontSize: '28px',
                  fontWeight: '800',
                  background: 'linear-gradient(135deg, #00A86B, #1E88E5)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  marginBottom: '4px',
                }}>
                  {stat.value}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: 'rgba(255,255,255,0.6)',
                  fontWeight: '500',
                }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Get Started - Registration Cards Section */}
      <section id="get-started" style={{
        padding: '100px 5%',
        background: 'linear-gradient(180deg, #0a1628 0%, #0f172a 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 25% 50%, rgba(30,136,229,0.08) 0%, transparent 50%), radial-gradient(circle at 75% 50%, rgba(0,168,107,0.08) 0%, transparent 50%)',
        }} />

        <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <span style={{
              display: 'inline-block',
              padding: '8px 20px',
              background: 'rgba(0,168,107,0.15)',
              borderRadius: '50px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#34d399',
              marginBottom: '20px',
            }}>
              🚀 Get Started
            </span>
            <h2 style={{
              fontSize: isMobile ? '32px' : '42px',
              fontWeight: '700',
              color: 'white',
              marginBottom: '16px',
            }}>
              Choose your account type
            </h2>
            <p style={{
              fontSize: '17px',
              color: 'rgba(255,255,255,0.7)',
              maxWidth: '600px',
              margin: '0 auto',
            }}>
              Whether you're an individual professional or representing a company, we have the right solution for you.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
            gap: '32px',
            maxWidth: '900px',
            margin: '0 auto',
          }}>
            {/* User Registration Card */}
            <Link to="/register" style={{
              textDecoration: 'none',
              padding: '40px 32px',
              background: 'rgba(30,136,229,0.08)',
              borderRadius: '24px',
              border: '1px solid rgba(30,136,229,0.25)',
              transition: 'all 0.4s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.borderColor = 'rgba(30,136,229,0.5)';
              e.currentTarget.style.boxShadow = '0 25px 50px rgba(30,136,229,0.2)';
              e.currentTarget.style.background = 'rgba(30,136,229,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(30,136,229,0.25)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.background = 'rgba(30,136,229,0.08)';
            }}>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, rgba(30,136,229,0.2), rgba(30,136,229,0.1))',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
                marginBottom: '24px',
                border: '1px solid rgba(30,136,229,0.3)',
              }}>
                👤
              </div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#60a5fa',
                marginBottom: '12px',
              }}>
                Individual Account
              </h3>
              <p style={{
                fontSize: '15px',
                color: 'rgba(255,255,255,0.7)',
                lineHeight: '1.7',
                marginBottom: '24px',
              }}>
                Perfect for sustainability consultants, researchers, students, and professionals tracking personal or project-level emissions.
              </p>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: '0 0 24px 0',
                width: '100%',
              }}>
                {['Personal carbon tracking', 'Access to emission factors', 'Basic reporting tools', 'Learning resources'].map((feature, idx) => (
                  <li key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '14px',
                    color: 'rgba(255,255,255,0.65)',
                    marginBottom: '10px',
                    justifyContent: 'center',
                  }}>
                    <span style={{ color: '#60a5fa' }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <div style={{
                padding: '14px 32px',
                background: 'linear-gradient(135deg, #1E88E5, #2563eb)',
                color: 'white',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span>Create User Account</span>
                <span>→</span>
              </div>
            </Link>

            {/* Company Registration Card */}
            <Link to="/company-register" style={{
              textDecoration: 'none',
              padding: '40px 32px',
              background: 'rgba(0,168,107,0.08)',
              borderRadius: '24px',
              border: '1px solid rgba(0,168,107,0.25)',
              transition: 'all 0.4s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.borderColor = 'rgba(0,168,107,0.5)';
              e.currentTarget.style.boxShadow = '0 25px 50px rgba(0,168,107,0.2)';
              e.currentTarget.style.background = 'rgba(0,168,107,0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = 'rgba(0,168,107,0.25)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.background = 'rgba(0,168,107,0.08)';
            }}>
              {/* Recommended Badge */}
              <div style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                padding: '6px 12px',
                background: 'linear-gradient(135deg, #00A86B, #059669)',
                borderRadius: '20px',
                fontSize: '11px',
                fontWeight: '700',
                color: 'white',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>
                Recommended
              </div>
              <div style={{
                width: '80px',
                height: '80px',
                background: 'linear-gradient(135deg, rgba(0,168,107,0.2), rgba(0,168,107,0.1))',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '40px',
                marginBottom: '24px',
                border: '1px solid rgba(0,168,107,0.3)',
              }}>
                🏢
              </div>
              <h3 style={{
                fontSize: '24px',
                fontWeight: '700',
                color: '#34d399',
                marginBottom: '12px',
              }}>
                Company Account
              </h3>
              <p style={{
                fontSize: '15px',
                color: 'rgba(255,255,255,0.7)',
                lineHeight: '1.7',
                marginBottom: '24px',
              }}>
                Enterprise-grade solution for organizations needing comprehensive carbon accounting, BRSR compliance, and multi-facility tracking.
              </p>
              <ul style={{
                listStyle: 'none',
                padding: 0,
                margin: '0 0 24px 0',
                width: '100%',
              }}>
                {['Multi-facility management', 'Scope 1, 2 & 3 tracking', 'BRSR & ESG reporting', 'AI recommendations'].map((feature, idx) => (
                  <li key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '14px',
                    color: 'rgba(255,255,255,0.65)',
                    marginBottom: '10px',
                    justifyContent: 'center',
                  }}>
                    <span style={{ color: '#34d399' }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <div style={{
                padding: '14px 32px',
                background: 'linear-gradient(135deg, #00A86B, #059669)',
                color: 'white',
                borderRadius: '12px',
                fontWeight: '600',
                fontSize: '15px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 20px rgba(0,168,107,0.3)',
              }}>
                <span>Create Company Account</span>
                <span>→</span>
              </div>
            </Link>
          </div>

          {/* Already have an account */}
          <div style={{
            textAlign: 'center',
            marginTop: '40px',
          }}>
            <p style={{
              fontSize: '15px',
              color: 'rgba(255,255,255,0.6)',
            }}>
              Already have an account?{' '}
              <Link to="/login" style={{
                color: '#34d399',
                textDecoration: 'none',
                fontWeight: '600',
              }}
              onMouseEnter={(e) => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.currentTarget.style.textDecoration = 'none'}>
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* The Problem Section */}
      <section style={{
        padding: '100px 5%',
        background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <span style={{
              display: 'inline-block',
              padding: '8px 16px',
              background: 'rgba(239,68,68,0.15)',
              borderRadius: '50px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#f87171',
              marginBottom: '20px',
            }}>
              ⚠️ The Challenge Today
            </span>
            <h2 style={{
              fontSize: isMobile ? '32px' : '42px',
              fontWeight: '700',
              color: 'white',
              marginBottom: '24px',
            }}>
              Why organisations struggle with carbon accounting
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}>
            {[
              { icon: "📊", text: "Environmental data is scattered across Excel sheets, ERPs, invoices, and manual logs" },
              { icon: "📋", text: "Reporting frameworks like BRSR, GRI, ISO 14064, and CBAM are evolving and complex" },
              { icon: "❓", text: "Most tools stop at carbon numbers and do not tell you what to do next to actually reduce emissions" },
              { icon: "⏰", text: "Teams spend more time chasing data and formatting reports than analysing hotspots and planning action" },
            ].map((item, idx) => (
              <div key={idx} style={{
                padding: '28px',
                background: 'rgba(239,68,68,0.08)',
                borderRadius: '16px',
                border: '1px solid rgba(239,68,68,0.2)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)';
              }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>{item.icon}</div>
                <p style={{
                  fontSize: '16px',
                  color: 'rgba(255,255,255,0.85)',
                  lineHeight: '1.6',
                  margin: 0,
                }}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section style={{
        padding: '100px 5%',
        background: 'linear-gradient(180deg, #111827 0%, #0f172a 100%)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            textAlign: 'center',
            padding: '48px',
            background: 'linear-gradient(135deg, rgba(0,168,107,0.15), rgba(30,136,229,0.15))',
            borderRadius: '24px',
            border: '1px solid rgba(0,168,107,0.3)',
            marginBottom: '80px',
          }}>
            <span style={{
              display: 'inline-block',
              padding: '8px 16px',
              background: 'rgba(0,168,107,0.2)',
              borderRadius: '50px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#34d399',
              marginBottom: '20px',
            }}>
              ✨ Our Solution
            </span>
            <p style={{
              fontSize: isMobile ? '18px' : '22px',
              color: 'white',
              lineHeight: '1.7',
              maxWidth: '900px',
              margin: '0 auto',
              fontWeight: '500',
            }}>
              A unified AI-powered sustainability platform that collects, cleans, calculates, and converts your 
              operational data into <strong style={{ color: '#34d399' }}>decisions</strong>, <strong style={{ color: '#60a5fa' }}>reports</strong>, and <strong style={{ color: '#fbbf24' }}>monetisable opportunities</strong> such 
              as EPR credits, carbon credits, and circularity projects.
            </p>
          </div>

          {/* Four Pillars */}
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 style={{
              fontSize: isMobile ? '32px' : '42px',
              fontWeight: '700',
              color: 'white',
              marginBottom: '16px',
            }}>
              From numbers to decisions
            </h2>
            <p style={{
              fontSize: '17px',
              color: 'rgba(255,255,255,0.7)',
              maxWidth: '700px',
              margin: '0 auto',
            }}>
              GamaSusCo unifies your activity data, applies the right emission factors, and layers AI-driven insights 
              on top so you can move from carbon accounting to real decarbonisation.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}>
            {pillars.map((pillar, idx) => (
              <div key={idx} style={{
                padding: '32px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '20px',
                border: `1px solid ${pillar.color}30`,
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)';
                e.currentTarget.style.borderColor = `${pillar.color}60`;
                e.currentTarget.style.boxShadow = `0 20px 40px ${pillar.color}20`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = `${pillar.color}30`;
                e.currentTarget.style.boxShadow = 'none';
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  background: `${pillar.color}20`,
                  borderRadius: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  marginBottom: '20px',
                }}>
                  {pillar.icon}
                </div>
                <h3 style={{
                  fontSize: '24px',
                  fontWeight: '700',
                  color: pillar.color,
                  marginBottom: '20px',
                }}>
                  {pillar.title}
                </h3>
                <ul style={{
                  margin: 0,
                  padding: '0 0 0 20px',
                  listStyle: 'disc',
                }}>
                  {pillar.features.map((feature, fidx) => (
                    <li key={fidx} style={{
                      fontSize: '14px',
                      color: 'rgba(255,255,255,0.75)',
                      lineHeight: '1.6',
                      marginBottom: '12px',
                    }}>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Flow Section */}
      <section style={{
        padding: '100px 5%',
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
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
              🔄 How We Track Your Emissions
            </span>
            <h2 style={{
              fontSize: isMobile ? '32px' : '42px',
              fontWeight: '700',
              color: 'white',
              marginBottom: '16px',
            }}>
              Transparent, auditable, standards-aligned
            </h2>
            <p style={{
              fontSize: '17px',
              color: 'rgba(255,255,255,0.7)',
              maxWidth: '700px',
              margin: '0 auto',
            }}>
              The platform builds a clear chain of evidence from your raw activity data to each tonne of CO₂e. 
              Every step is transparent, auditable, and aligned with recognised accounting standards.
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '24px',
          }}>
            {processSteps.map((step, idx) => (
              <div key={idx} style={{
                padding: '32px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '20px',
                border: '1px solid rgba(30,136,229,0.2)',
                position: 'relative',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'rgba(30,136,229,0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(30,136,229,0.2)';
              }}>
                <div style={{
                  position: 'absolute',
                  top: '-16px',
                  left: '24px',
                  background: 'linear-gradient(135deg, #1E88E5, #0ea5e9)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '700',
                  color: 'white',
                }}>
                  Step {step.step}
                </div>
                <div style={{
                  fontSize: '40px',
                  marginBottom: '16px',
                  marginTop: '12px',
                }}>
                  {step.icon}
                </div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: 'white',
                  marginBottom: '12px',
                }}>
                  {step.title}
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: 'rgba(255,255,255,0.7)',
                  lineHeight: '1.7',
                  margin: 0,
                }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Modules Section */}
      <section style={{
        padding: '100px 5%',
        background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <span style={{
              display: 'inline-block',
              padding: '8px 16px',
              background: 'rgba(20,184,166,0.15)',
              borderRadius: '50px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#2dd4bf',
              marginBottom: '20px',
            }}>
              🧩 Key Modules
            </span>
            <h2 style={{
              fontSize: isMobile ? '32px' : '42px',
              fontWeight: '700',
              color: 'white',
            }}>
              Key modules in the platform
            </h2>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '20px',
          }}>
            {modules.map((module, idx) => (
              <div key={idx} style={{
                padding: '28px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                gap: '20px',
                alignItems: 'flex-start',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateX(8px)';
                e.currentTarget.style.borderColor = 'rgba(20,184,166,0.4)';
                e.currentTarget.style.background = 'rgba(20,184,166,0.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateX(0)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              }}>
                <div style={{
                  width: '50px',
                  height: '50px',
                  background: 'rgba(20,184,166,0.2)',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  flexShrink: 0,
                }}>
                  {module.icon}
                </div>
                <div>
                  <h3 style={{
                    fontSize: '18px',
                    fontWeight: '700',
                    color: 'white',
                    marginBottom: '8px',
                  }}>
                    {module.title}
                  </h3>
                  <p style={{
                    fontSize: '14px',
                    color: 'rgba(255,255,255,0.7)',
                    lineHeight: '1.6',
                    margin: 0,
                  }}>
                    {module.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who We Work With Section */}
      <section style={{
        padding: '100px 5%',
        background: 'linear-gradient(180deg, #0f172a 0%, #111827 100%)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <span style={{
              display: 'inline-block',
              padding: '8px 16px',
              background: 'rgba(251,191,36,0.15)',
              borderRadius: '50px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#fbbf24',
              marginBottom: '20px',
            }}>
              🏢 Who We Work With
            </span>
            <h2 style={{
              fontSize: isMobile ? '32px' : '42px',
              fontWeight: '700',
              color: 'white',
            }}>
              Built for industry leaders
            </h2>
          </div>

          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            justifyContent: 'center',
          }}>
            {targetUsers.map((user, idx) => (
              <div key={idx} style={{
                padding: '20px 28px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.borderColor = 'rgba(251,191,36,0.4)';
                e.currentTarget.style.background = 'rgba(251,191,36,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
              }}>
                <span style={{ fontSize: '28px' }}>{user.icon}</span>
                <div>
                  <div style={{
                    fontSize: '16px',
                    fontWeight: '600',
                    color: 'white',
                  }}>
                    {user.title}
                  </div>
                  <div style={{
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.6)',
                  }}>
                    {user.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Strip */}
      <section style={{
        padding: '40px 5%',
        background: 'linear-gradient(90deg, #00A86B15, #1E88E515, #00A86B15)',
        borderTop: '1px solid rgba(0,168,107,0.2)',
        borderBottom: '1px solid rgba(0,168,107,0.2)',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: '16px',
            color: 'rgba(255,255,255,0.85)',
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '8px',
          }}>
            <span style={{ fontSize: '20px' }}>✅</span>
            <span>Built to support <strong style={{ color: '#34d399' }}>ISO 14064</strong>-aligned inventories, 
            <strong style={{ color: '#60a5fa' }}> BRSR</strong> disclosures, <strong style={{ color: '#a78bfa' }}>GRI</strong> reporting, 
            and integration with India's <strong style={{ color: '#fbbf24' }}>CCTS</strong> and <strong style={{ color: '#f472b6' }}>EPR</strong> frameworks.</span>
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" style={{
        padding: '100px 5%',
        background: 'linear-gradient(180deg, #111827 0%, #0f172a 100%)',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <span style={{
              display: 'inline-block',
              padding: '8px 16px',
              background: 'rgba(167,139,250,0.15)',
              borderRadius: '50px',
              fontSize: '13px',
              fontWeight: '600',
              color: '#a78bfa',
              marginBottom: '20px',
            }}>
              ❓ FAQ
            </span>
            <h2 style={{
              fontSize: isMobile ? '32px' : '42px',
              fontWeight: '700',
              color: 'white',
            }}>
              Frequently Asked Questions
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {faqData.map((faq, idx) => (
              <div key={idx} style={{
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '16px',
                border: '1px solid rgba(255,255,255,0.1)',
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
                  }}
                >
                  <span style={{
                    fontSize: '17px',
                    fontWeight: '600',
                    color: 'white',
                  }}>
                    {faq.question}
                  </span>
                  <span style={{
                    fontSize: '24px',
                    color: '#a78bfa',
                    transform: activeAccordion === idx ? 'rotate(45deg)' : 'rotate(0)',
                    transition: 'transform 0.3s ease',
                  }}>
                    +
                  </span>
                </button>
                {activeAccordion === idx && (
                  <div style={{
                    padding: '0 24px 24px',
                    animation: 'fadeIn 0.3s ease',
                  }}>
                    <p style={{
                      fontSize: '15px',
                      color: 'rgba(255,255,255,0.75)',
                      lineHeight: '1.7',
                      margin: 0,
                    }}>
                      {faq.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section style={{
        padding: '120px 5%',
        background: 'linear-gradient(135deg, #03121a 0%, #062436 50%, #03121a 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 30% 50%, rgba(0,168,107,0.15) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(30,136,229,0.15) 0%, transparent 50%)',
        }} />
        
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}>
          <div style={{ fontSize: '56px', marginBottom: '24px' }}>🌱</div>
          <h2 style={{
            fontSize: isMobile ? '32px' : '46px',
            fontWeight: '800',
            color: 'white',
            marginBottom: '20px',
            lineHeight: '1.2',
          }}>
            Ready to turn your carbon data into decisions?
          </h2>
          <p style={{
            fontSize: '18px',
            color: 'rgba(255,255,255,0.8)',
            marginBottom: '40px',
            lineHeight: '1.7',
            maxWidth: '600px',
            margin: '0 auto 40px',
          }}>
            Let's start with one facility, one module, or one pilot—and build your full sustainability stack from there. 
            GamaSusCo helps you move from compliance-driven reporting to proactive, data-driven decarbonisation.
          </p>

          <div style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}>
            <Link to="/contact" style={{
              padding: '18px 40px',
              background: 'linear-gradient(135deg, #00A86B, #059669)',
              color: 'white',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '700',
              fontSize: '16px',
              boxShadow: '0 8px 30px rgba(0,168,107,0.4)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-3px)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,168,107,0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,168,107,0.4)';
            }}>
              Book a demo
            </Link>
            <Link to="/contact" style={{
              padding: '18px 40px',
              background: 'rgba(255,255,255,0.1)',
              color: 'white',
              borderRadius: '12px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '16px',
              border: '1px solid rgba(255,255,255,0.2)',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)';
            }}>
              Talk to us about a pilot
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '80px 5% 40px',
        background: '#020b11',
        borderTop: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '40px',
            marginBottom: '60px',
          }}>
            {/* Company Info */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px',
              }}>
                <img alt="GamaSusCo Logo" src={LOGO} style={{
                  width: '50px',
                  height: '40px',
                  objectFit: 'contain',
                  filter: 'brightness(0) invert(1)',
                }} />
                <div style={{
                  fontSize: '20px',
                  fontWeight: '700',
                  color: 'white',
                }}>GamaSusCo</div>
              </div>
              <p style={{
                fontSize: '14px',
                color: 'rgba(255,255,255,0.6)',
                lineHeight: '1.7',
                marginBottom: '20px',
              }}>
                GamaSusCo Private Limited
                <br />
                AI-powered carbon intelligence for real-world operations
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: 'white',
                marginBottom: '20px',
              }}>Platform</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['Modules', 'Resources', 'FAQ'].map((link) => (
                  <Link key={link} to={`/${link.toLowerCase()}`} style={{
                    fontSize: '14px',
                    color: 'rgba(255,255,255,0.6)',
                    textDecoration: 'none',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#34d399'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}>
                    {link}
                  </Link>
                ))}
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: 'white',
                marginBottom: '20px',
              }}>Company</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['About', 'Contact'].map((link) => (
                  <Link key={link} to={`/${link.toLowerCase()}`} style={{
                    fontSize: '14px',
                    color: 'rgba(255,255,255,0.6)',
                    textDecoration: 'none',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#34d399'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}>
                    {link}
                  </Link>
                ))}
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: 'white',
                marginBottom: '20px',
              }}>Legal</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['Privacy Policy', 'Terms of Service'].map((link) => (
                  <Link key={link} to={`/${link.toLowerCase().replace(' ', '-')}`} style={{
                    fontSize: '14px',
                    color: 'rgba(255,255,255,0.6)',
                    textDecoration: 'none',
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = '#34d399'}
                  onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.6)'}>
                    {link}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div style={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '30px',
            textAlign: 'center',
          }}>
            <p style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.5)',
              margin: 0,
            }}>
              © {new Date().getFullYear()} GamaSusCo Private Limited. All rights reserved. Built with 💚 for a sustainable future.
            </p>
          </div>
        </div>
      </footer>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInUp {
          from { 
            opacity: 0; 
            transform: translateY(30px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        @keyframes fadeInDown {
          from { 
            opacity: 0; 
            transform: translateY(-20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }
        @keyframes floatOrb1 {
          0%, 100% { 
            transform: translate(0, 0) scale(1); 
            opacity: 0.6;
          }
          33% { 
            transform: translate(50px, -30px) scale(1.1); 
            opacity: 0.8;
          }
          66% { 
            transform: translate(-30px, 50px) scale(0.9); 
            opacity: 0.5;
          }
        }
        @keyframes floatOrb2 {
          0%, 100% { 
            transform: translate(0, 0) scale(1); 
            opacity: 0.5;
          }
          33% { 
            transform: translate(-60px, 40px) scale(1.2); 
            opacity: 0.7;
          }
          66% { 
            transform: translate(40px, -60px) scale(0.8); 
            opacity: 0.4;
          }
        }
        @keyframes floatOrb3 {
          0%, 100% { 
            transform: translate(0, 0) scale(1); 
            opacity: 0.4;
          }
          50% { 
            transform: translate(70px, 30px) scale(1.15); 
            opacity: 0.6;
          }
        }
        @keyframes gridMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
        @keyframes glow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(0,168,107,0.3), 0 0 40px rgba(0,168,107,0.1);
          }
          50% { 
            box-shadow: 0 0 30px rgba(0,168,107,0.5), 0 0 60px rgba(0,168,107,0.2);
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
