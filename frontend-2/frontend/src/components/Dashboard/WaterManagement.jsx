import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import DashboardLayout from './DashboardLayout';
import WaterForm from './Water/WaterForm';
import WaterList from './Water/WaterList';

const WaterManagement = () => {
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const { isMobile, isTablet } = useResponsive();
  const [showForm, setShowForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleSuccess = () => {
    setShowForm(false);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <DashboardLayout>
      <div style={{
        minHeight: '100vh',
        background: isDark ? colors.bgSecondary : '#f0f9ff',
        transition: 'background 0.3s ease',
      }}>
        {/* Hero Header */}
        <div style={{
          background: isDark 
            ? 'linear-gradient(135deg, #0369a1 0%, #0e7490 100%)' 
            : 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
          borderRadius: isMobile ? '12px' : '16px',
          padding: isMobile ? '20px' : isTablet ? '28px' : '32px',
          marginBottom: isMobile ? '16px' : '24px',
          color: 'white',
          boxShadow: isDark 
            ? '0 8px 32px rgba(3, 105, 161, 0.4)' 
            : '0 8px 32px rgba(14, 165, 233, 0.3)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative water drops */}
          <div style={{
            position: 'absolute',
            top: '10%',
            right: '5%',
            fontSize: isMobile ? '40px' : '60px',
            opacity: 0.15,
          }}>💧</div>
          <div style={{
            position: 'absolute',
            bottom: '10%',
            right: '15%',
            fontSize: isMobile ? '30px' : '40px',
            opacity: 0.1,
          }}>💧</div>
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '16px' : '24px',
            position: 'relative',
            zIndex: 1,
          }}>
            <div>
              <h1 style={{
                fontSize: isMobile ? '22px' : isTablet ? '26px' : '30px',
                fontWeight: '700',
                margin: '0 0 8px 0',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                💧 Water Management
              </h1>
              <p style={{
                fontSize: isMobile ? '13px' : '15px',
                margin: 0,
                opacity: 0.9,
                lineHeight: 1.4,
              }}>
                Track and manage water usage across your operations
              </p>
            </div>
            
            <button
              onClick={() => setShowForm(!showForm)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: isMobile ? '10px 16px' : '12px 20px',
                background: showForm 
                  ? 'rgba(239, 68, 68, 0.9)' 
                  : 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: isMobile ? '13px' : '14px',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }
              }}
            >
              {showForm ? '✕ Close Form' : '+ Add Water Record'}
            </button>
          </div>
        </div>

        {/* Form Section */}
        {showForm && (
          <WaterForm
            companyId={user?.company_id}
            onSuccess={handleSuccess}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* List Section */}
        <WaterList
          companyId={user?.company_id}
          refreshTrigger={refreshTrigger}
        />
      </div>
    </DashboardLayout>
  );
};

export default WaterManagement;
