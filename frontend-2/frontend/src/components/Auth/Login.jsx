import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useResponsive } from '../../hooks/useResponsive';
import { motion } from 'framer-motion';
import bgImage from './grass.jpg'; 
import LOGO from './gaamasusco-logo.png';

const Login = () => {
  const { isMobile, isTablet } = useResponsive();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        navigate('/dashboard');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        padding: '20px',
      }}
    >
     
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 1.5 }}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(0,255,180,0.5), rgba(30,136,229,0.5))',
          zIndex: 1,
        }}
      />

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          background: 'rgba(255,255,255,0.95)',
          borderRadius: isMobile ? '16px' : '24px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          maxWidth: isMobile ? '100%' : '950px',
          width: '100%',
          minHeight: isMobile ? 'auto' : '600px',
        }}
      >
        {/* Left Panel */}
        {!isMobile && (
        <div
          style={{
            background: 'linear-gradient(135deg, #00FFB0, #1E88E5)',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: isTablet ? '30px' : '40px',
            textAlign: 'center',
          }}
        >
          <motion.h2
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '15px' }}
          >
            Welcome Back
          </motion.h2>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{ fontSize: '16px', lineHeight: '1.6', color: 'rgba(255,255,255,0.9)' }}
          >
            Sign in to continue your green journey. Track your organization’s carbon footprint and make a difference today!
          </motion.p>
          <img
            src={LOGO}
            alt="Eco Illustration"
            style={{ width: '80%', marginTop: '30px' }}
          />
        </div>
        )}

        {/* Right Panel (Form) */}
        <div style={{ padding: isMobile ? '24px' : isTablet ? '32px' : '40px' }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            style={{ textAlign: 'center', marginBottom: '25px' }}
          >
            <h1
              style={{
                fontSize: '30px',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #00FFB0, #1E88E5)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Sign In
            </h1>
            <p style={{ color: '#666', fontSize: '15px' }}>Enter your credentials to access your account</p>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                background: '#fee2e2',
                color: '#dc2626',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '20px',
                fontSize: '14px',
              }}
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            {['email', 'password'].map((field, idx) => (
              <motion.div
                key={field}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                style={{ marginBottom: '18px' }}
              >
                <label
                  style={{
                    display: 'block',
                    marginBottom: '6px',
                    fontWeight: '600',
                    color: '#374151',
                  }}
                >
                  {field === 'email' ? 'Email Address' : 'Password'}
                </label>
                <input
                  type={field === 'password' ? 'password' : 'email'}
                  value={formData[field]}
                  onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                  required
                  placeholder={field === 'email' ? 'your@email.com' : 'Enter your password'}
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    border: '2px solid #e5e7eb',
                    borderRadius: '10px',
                    fontSize: '15px',
                  }}
                />
              </motion.div>
            ))}

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.03, boxShadow: '0 0 15px #00FFB0' } : {}}
              transition={{ duration: 0.3 }}
              style={{
                width: '100%',
                padding: '15px',
                background: loading
                  ? '#9ca3af'
                  : 'linear-gradient(135deg, #00FFB0, #1E88E5)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </motion.button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '25px', alignItems: 'center', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', display: 'flex' }}>
            <span style={{ color: '#6b7280' }}>Don’t have an account? </span>
            <Link
              to="/register"
              style={{
                color: '#10b981',
                fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              Create Account
            </Link>
            <span style={{ color: '#6b7280' }}>or</span>
            <Link
            to="/"
            style={{
              color: '#10b981',
              fontWeight: '600',
              textDecoration: 'none'
            }}>
              Landing Page
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
