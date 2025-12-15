import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav style={{
      background: 'white',
      borderBottom: '1px solid #e5e7eb',
      position: 'fixed',
      top: 0,
      width: '100%',
      zIndex: 50,
      height: '64px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
    }}>
      <div style={{
        maxWidth: '1280px',
        margin: '0 auto',
        padding: '0 20px',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>

        {/* Logo */}
        <Link to="/dashboard" style={{
          fontSize: '24px',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #059669, #2563eb)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          textDecoration: 'none'
        }}>
          Carbon Platform
        </Link>

        {/* Navigation Links */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <Link to="/dashboard" style={{
            padding: '8px 16px',
            borderRadius: '8px',
            textDecoration: 'none',
            color: '#374151',
            fontWeight: '500',
            transition: 'background 0.2s'
          }}>
            Dashboard
          </Link>
          <Link to="/activities" style={{
            padding: '8px 16px',
            borderRadius: '8px',
            textDecoration: 'none',
            color: '#374151',
            fontWeight: '500',
            transition: 'background 0.2s'
          }}>
            Activities
          </Link>
        </div>

          {/* <Link to="/documents" style={{
            padding: '8px 16px',
            borderRadius: '8px',
            textDecoration: 'none',
            color: '#374151',
            fontWeight: '500',
            transition: 'background 0.2s'
          }}>
            Documents
          </Link>
*/}


        {/* User Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '6px 12px',
            background: '#f9fafb',
            borderRadius: '8px'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '14px'
            }}>
              {user?.full_name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <span style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>
              {user?.full_name}
            </span>
          </div>

          <button onClick={() => {
            logout();
            navigate('/login');
          }} style={{
            padding: '8px 16px',
            background: '#fee2e2',
            color: '#dc2626',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '14px',
            transition: 'background 0.2s'
          }}>
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;