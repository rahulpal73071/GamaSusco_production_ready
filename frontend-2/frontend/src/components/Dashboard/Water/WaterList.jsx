import React, { useState, useEffect } from 'react';
import { waterAPI } from '../../../services/api';
import { useTheme } from '../../../context/ThemeContext';
import { useResponsive } from '../../../hooks/useResponsive';

const WaterList = ({ companyId, refreshTrigger }) => {
  const { colors, isDark } = useTheme();
  const { isMobile, isTablet } = useResponsive();
  
  const [waters, setWaters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalWithdrawal: 0,
    totalConsumption: 0,
    totalRecycled: 0,
    totalEmissions: 0
  });

  useEffect(() => {
    fetchWaters();
  }, [companyId, refreshTrigger]);

  const fetchWaters = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await waterAPI.listWater(companyId);
      const waterData = response.data.waters || [];
      setWaters(waterData);

      const calculatedStats = waterData.reduce((acc, water) => ({
        totalWithdrawal: acc.totalWithdrawal + (water.withdrawal_volume || 0),
        totalConsumption: acc.totalConsumption + (water.consumption_volume || 0),
        totalRecycled: acc.totalRecycled + (water.recycled_volume || 0),
        totalEmissions: acc.totalEmissions + (water.emissions_kgco2e || 0)
      }), { totalWithdrawal: 0, totalConsumption: 0, totalRecycled: 0, totalEmissions: 0 });

      setStats(calculatedStats);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load water records');
    } finally {
      setLoading(false);
    }
  };

  // Stats card configurations
  const statsConfig = [
    {
      key: 'withdrawal',
      icon: '💧',
      label: 'Total Withdrawal',
      value: stats.totalWithdrawal,
      unit: 'm³',
      gradientLight: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
      gradientDark: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.15) 100%)',
      accentColor: '#3B82F6',
      textColorLight: '#1E40AF',
      textColorDark: '#60A5FA',
      borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.4)',
    },
    {
      key: 'consumption',
      icon: '🚿',
      label: 'Total Consumption',
      value: stats.totalConsumption,
      unit: 'm³',
      gradientLight: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
      gradientDark: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.15) 100%)',
      accentColor: '#10B981',
      textColorLight: '#065F46',
      textColorDark: '#34D399',
      borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.4)',
    },
    {
      key: 'recycled',
      icon: '♻️',
      label: 'Total Recycled',
      value: stats.totalRecycled,
      unit: 'm³',
      gradientLight: 'linear-gradient(135deg, #CCFBF1 0%, #99F6E4 100%)',
      gradientDark: 'linear-gradient(135deg, rgba(20, 184, 166, 0.2) 0%, rgba(13, 148, 136, 0.15) 100%)',
      accentColor: '#14B8A6',
      textColorLight: '#115E59',
      textColorDark: '#2DD4BF',
      borderColor: isDark ? 'rgba(20, 184, 166, 0.3)' : 'rgba(20, 184, 166, 0.4)',
    },
    {
      key: 'emissions',
      icon: '📊',
      label: 'Total Emissions',
      value: stats.totalEmissions,
      unit: 'kg CO2e',
      gradientLight: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
      gradientDark: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.15) 100%)',
      accentColor: '#EF4444',
      textColorLight: '#991B1B',
      textColorDark: '#F87171',
      borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.4)',
    },
  ];

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 20px',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: `3px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6'}`,
          borderTop: '3px solid #0ea5e9',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px',
        }} />
        <p style={{ color: colors.textSecondary, fontSize: '14px' }}>Loading water records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '16px',
        background: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2',
        border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.3)' : '#fecaca'}`,
        color: isDark ? '#f87171' : '#dc2626',
        borderRadius: '12px',
        fontSize: '14px',
      }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '16px' : '20px' }}>
      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: isMobile ? '10px' : '14px',
      }}>
        {statsConfig.map((stat) => (
          <StatCard key={stat.key} stat={stat} isDark={isDark} isMobile={isMobile} />
        ))}
      </div>

      {/* Water Records Table */}
      <div style={{
        background: isDark 
          ? 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)' 
          : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: isMobile ? '12px' : '16px',
        overflow: 'hidden',
        boxShadow: isDark 
          ? '0 8px 32px rgba(0,0,0,0.3)' 
          : '0 8px 32px rgba(0,0,0,0.06)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
      }}>
        <div style={{
          padding: isMobile ? '14px 16px' : '18px 20px',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
        }}>
          <h3 style={{
            fontSize: isMobile ? '15px' : '17px',
            fontWeight: '700',
            color: colors.text,
            margin: '0 0 4px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            📋 Water Usage Records
          </h3>
          <p style={{
            fontSize: isMobile ? '12px' : '13px',
            color: colors.textSecondary,
            margin: 0,
          }}>
            {waters.length} total records
          </p>
        </div>

        {waters.length === 0 ? (
          <div style={{
            padding: isMobile ? '40px 20px' : '60px 20px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.4 }}>💧</div>
            <p style={{ color: colors.textSecondary, fontSize: '14px', margin: 0 }}>
              No water records found. Add your first water usage record above.
            </p>
          </div>
        ) : isMobile ? (
          // Mobile Card View
          <div style={{ padding: '12px' }}>
            {waters.map((water, index) => (
              <MobileWaterCard 
                key={water.id} 
                water={water} 
                index={index} 
                isDark={isDark} 
                colors={colors} 
              />
            ))}
          </div>
        ) : (
          // Desktop Table View
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{
                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                }}>
                  <th style={getHeaderStyle(isDark, colors)}>Date</th>
                  <th style={getHeaderStyle(isDark, colors)}>Source</th>
                  <th style={getHeaderStyle(isDark, colors)}>Withdrawal</th>
                  <th style={getHeaderStyle(isDark, colors)}>Consumption</th>
                  <th style={getHeaderStyle(isDark, colors)}>Discharge</th>
                  <th style={getHeaderStyle(isDark, colors)}>Recycled</th>
                  <th style={getHeaderStyle(isDark, colors)}>Emissions</th>
                </tr>
              </thead>
              <tbody>
                {waters.map((water, index) => (
                  <tr 
                    key={water.id} 
                    style={{
                      background: index % 2 === 0 
                        ? 'transparent' 
                        : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'),
                      borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                      transition: 'background 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isDark 
                        ? 'rgba(14, 165, 233, 0.08)' 
                        : 'rgba(14, 165, 233, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = index % 2 === 0 
                        ? 'transparent' 
                        : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)');
                    }}
                  >
                    <td style={getCellStyle(isDark, colors)}>
                      {water.created_at ? new Date(water.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={getCellStyle(isDark, colors)}>
                      <span style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE',
                        color: isDark ? '#60A5FA' : '#1E40AF',
                        borderRadius: '6px',
                        display: 'inline-block',
                        textTransform: 'capitalize',
                      }}>
                        {water.source}
                      </span>
                    </td>
                    <td style={getCellStyle(isDark, colors)}>
                      <span style={{ fontWeight: '600', color: isDark ? '#60A5FA' : '#2563EB' }}>
                        {water.withdrawal_volume?.toFixed(2) || '0.00'}
                      </span>
                      <span style={{ fontSize: '10px', color: colors.textTertiary, marginLeft: '4px' }}>m³</span>
                    </td>
                    <td style={getCellStyle(isDark, colors)}>
                      {water.consumption_volume?.toFixed(2) || '-'}
                    </td>
                    <td style={getCellStyle(isDark, colors)}>
                      {water.discharge_volume?.toFixed(2) || '-'}
                    </td>
                    <td style={getCellStyle(isDark, colors)}>
                      <span style={{ color: isDark ? '#2DD4BF' : '#0D9488' }}>
                        {water.recycled_volume?.toFixed(2) || '-'}
                      </span>
                    </td>
                    <td style={getCellStyle(isDark, colors)}>
                      <span style={{ fontWeight: '600', color: isDark ? '#F87171' : '#DC2626' }}>
                        {water.emissions_kgco2e?.toFixed(2) || '-'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ stat, isDark, isMobile }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div
      style={{
        background: isDark ? stat.gradientDark : stat.gradientLight,
        padding: isMobile ? '14px' : '18px',
        borderRadius: isMobile ? '12px' : '14px',
        border: `1px solid ${stat.borderColor}`,
        boxShadow: isHovered 
          ? `0 8px 24px ${stat.accentColor}30` 
          : `0 4px 12px ${stat.accentColor}15`,
        transition: 'all 0.3s ease',
        transform: isHovered && !isMobile ? 'translateY(-4px)' : 'translateY(0)',
        cursor: 'default',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
      }}>
        <div style={{ flex: 1 }}>
          <p style={{
            fontSize: isMobile ? '10px' : '12px',
            color: stat.accentColor,
            fontWeight: '600',
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.3px',
          }}>
            {stat.label}
          </p>
          <p style={{
            fontSize: isMobile ? '20px' : '26px',
            fontWeight: '800',
            color: isDark ? stat.textColorDark : stat.textColorLight,
            margin: '0 0 2px 0',
            lineHeight: 1.1,
          }}>
            {stat.value.toFixed(2)}
          </p>
          <p style={{
            fontSize: isMobile ? '10px' : '11px',
            color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
            margin: 0,
          }}>
            {stat.unit}
          </p>
        </div>
        <span style={{
          fontSize: isMobile ? '24px' : '32px',
          opacity: 0.8,
        }}>
          {stat.icon}
        </span>
      </div>
    </div>
  );
};

// Mobile Water Card Component
const MobileWaterCard = ({ water, index, isDark, colors }) => (
  <div style={{
    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.01)',
    borderRadius: '10px',
    padding: '12px',
    marginBottom: '10px',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
  }}>
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '10px',
      paddingBottom: '10px',
      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
    }}>
      <span style={{
        fontSize: '12px',
        color: colors.textSecondary,
      }}>
        📅 {water.created_at ? new Date(water.created_at).toLocaleDateString() : 'N/A'}
      </span>
      <span style={{
        padding: '3px 8px',
        fontSize: '10px',
        fontWeight: '600',
        background: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE',
        color: isDark ? '#60A5FA' : '#1E40AF',
        borderRadius: '6px',
        textTransform: 'capitalize',
      }}>
        {water.source}
      </span>
    </div>
    
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '8px',
    }}>
      <div>
        <span style={{ fontSize: '10px', color: colors.textTertiary }}>Withdrawal</span>
        <p style={{ 
          fontSize: '14px', 
          fontWeight: '600', 
          color: isDark ? '#60A5FA' : '#2563EB',
          margin: '2px 0 0 0',
        }}>
          {water.withdrawal_volume?.toFixed(2) || '0'} m³
        </p>
      </div>
      <div>
        <span style={{ fontSize: '10px', color: colors.textTertiary }}>Consumption</span>
        <p style={{ 
          fontSize: '14px', 
          fontWeight: '600', 
          color: colors.text,
          margin: '2px 0 0 0',
        }}>
          {water.consumption_volume?.toFixed(2) || '-'} m³
        </p>
      </div>
      <div>
        <span style={{ fontSize: '10px', color: colors.textTertiary }}>Recycled</span>
        <p style={{ 
          fontSize: '14px', 
          fontWeight: '600', 
          color: isDark ? '#2DD4BF' : '#0D9488',
          margin: '2px 0 0 0',
        }}>
          {water.recycled_volume?.toFixed(2) || '-'} m³
        </p>
      </div>
      <div>
        <span style={{ fontSize: '10px', color: colors.textTertiary }}>Emissions</span>
        <p style={{ 
          fontSize: '14px', 
          fontWeight: '600', 
          color: isDark ? '#F87171' : '#DC2626',
          margin: '2px 0 0 0',
        }}>
          {water.emissions_kgco2e?.toFixed(2) || '-'} kg
        </p>
      </div>
    </div>
  </div>
);

// Helper functions for table styles
const getHeaderStyle = (isDark, colors) => ({
  padding: '12px 16px',
  textAlign: 'left',
  fontSize: '11px',
  fontWeight: '600',
  color: colors.textSecondary,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
});

const getCellStyle = (isDark, colors) => ({
  padding: '12px 16px',
  fontSize: '13px',
  color: colors.text,
  whiteSpace: 'nowrap',
});

export default WaterList;
