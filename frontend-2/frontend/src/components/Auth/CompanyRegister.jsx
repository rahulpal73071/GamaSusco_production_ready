import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import bgImage from './grass.jpg';

const CompanyRegister = () => {
  const [formData, setFormData] = useState({
    company_name: '',
    industry: '',
    size: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const industries = [
    'Technology', 'Manufacturing', 'Healthcare', 'Finance', 'Retail',
    'Energy', 'Transportation', 'Construction', 'Agriculture', 'Education',
    'Government', 'Other'
  ];

  const companySizes = [
    '1-10 employees', '11-50 employees', '51-200 employees',
    '201-1000 employees', '1000+ employees'
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      await authAPI.registerCompany({
        company_name: formData.company_name,
        industry: formData.industry,
        size: formData.size,
        email: formData.email,
        password: formData.password
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={styles.container}>
        <div style={styles.successCard}>
          <div style={styles.successIcon}>✅</div>
          <h2 style={styles.successTitle}>Company Registered Successfully!</h2>
          <p style={styles.successText}>
            Your company has been created and the admin account is ready.
            You’ll be redirected to the login page shortly.
          </p>
          <Link to="/login" style={styles.loginLink}>Go to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card} className="fadeInUp">
        <div style={styles.header}>
          <h1 style={styles.title}>Register Your Company</h1>
          <p style={styles.subtitle}>Create your company profile and admin account</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formColumns}>
            {/* Company Info */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Company Information</h3>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Company Name *</label>
                <input
                  type="text"
                  name="company_name"
                  value={formData.company_name}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Enter your company name"
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Industry *</label>
                <select
                  name="industry"
                  value={formData.industry}
                  onChange={handleChange}
                  style={styles.select}
                  required
                >
                  <option value="">Select industry</option>
                  {industries.map(industry => (
                    <option key={industry} value={industry}>{industry}</option>
                  ))}
                </select>
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Company Size *</label>
                <select
                  name="size"
                  value={formData.size}
                  onChange={handleChange}
                  style={styles.select}
                  required
                >
                  <option value="">Select company size</option>
                  {companySizes.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Admin Account */}
            <div style={styles.section}>
              <h3 style={styles.sectionTitle}>Admin Account</h3>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Admin Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="admin@company.com"
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Password *</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Minimum 8 characters"
                  required
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Confirm Password *</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  style={styles.input}
                  placeholder="Confirm your password"
                  required
                />
              </div>
            </div>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <span style={styles.errorIcon}>❌</span>
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            style={{
              ...styles.submitBtn,
              ...(loading ? styles.submitBtnDisabled : {})
            }}
            disabled={loading}
          >
            {loading ? 'Creating Company...' : 'Register Company'}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Already have a company account?{' '}
            <Link to="/login" style={styles.link}>Sign in here</Link>
          </p>
          <p style={styles.footerText}>
            Looking for personal account?{' '}
            <Link to="/register" style={styles.link}>User registration</Link>
          </p>
        </div>
      </div>

      {/* Animation CSS */}
      <style>
        {`
          @keyframes fadeInUp {
            0% { opacity: 0; transform: translateY(20px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          .fadeInUp {
            animation: fadeInUp 0.8s ease-out;
          }
          input:focus, select:focus {
            border-color: #764ba2;
            box-shadow: 0 0 6px rgba(118, 75, 162, 0.4);
            outline: none;
          }
          button:hover {
            transform: scale(1.02);
          }
          @media (max-width: 768px) {
            .form-columns {
              flex-direction: column !important;
              gap: 0 !important;
            }
          }
        `}
      </style>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundImage: `url(${bgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  card: {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '16px',
    padding: '40px',
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
    width: '100%',
    maxWidth: '900px'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '8px'
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7280'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  formColumns: {
    display: 'flex',
    gap: '0', // No space between columns
    flexWrap: 'wrap'
  },
  section: {
    flex: '1 1 50%',
    padding: '20px',
    borderRight: '1px solid #e5e7eb',
    boxSizing: 'border-box'
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '16px'
  },
  inputGroup: {
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '6px'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '16px',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '16px',
    background: 'white',
    cursor: 'pointer'
  },
  errorBox: {
    padding: '12px 16px',
    background: '#fee',
    border: '1px solid #fcc',
    borderRadius: '8px',
    color: '#c33',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  submitBtn: {
    padding: '14px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s',
    marginTop: '10px'
  },
  submitBtnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  footer: {
    textAlign: 'center',
    marginTop: '30px',
    paddingTop: '20px',
    borderTop: '1px solid #e5e7eb'
  },
  footerText: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '8px'
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
    fontWeight: '600'
  },
  successCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '40px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center'
  },
  successIcon: {
    fontSize: '48px',
    marginBottom: '20px'
  },
  successTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#059669',
    marginBottom: '12px'
  },
  successText: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '24px',
    lineHeight: '1.5'
  },
  loginLink: {
    display: 'inline-block',
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: '600'
  }
};

export default CompanyRegister;
