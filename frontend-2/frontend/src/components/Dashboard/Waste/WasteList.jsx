import React, { useState, useEffect } from 'react';
import { wasteAPI } from '../../../services/api';
import { useTheme } from '../../../context/ThemeContext';
import { useResponsive } from '../../../hooks/useResponsive';

const WasteList = ({ companyId, refreshTrigger }) => {
  const { colors, isDark } = useTheme();
  const { isMobile, isTablet } = useResponsive();
  
  const [wastes, setWastes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalQuantity: 0,
    totalCost: 0,
    totalEmissions: 0,
    hazardousCount: 0
  });

  useEffect(() => {
    fetchWastes();
  }, [companyId, refreshTrigger]);

  const fetchWastes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await wasteAPI.listWaste(companyId);
      const wasteData = response.data.wastes || [];
      setWastes(wasteData);

      const calculatedStats = wasteData.reduce((acc, waste) => ({
        totalQuantity: acc.totalQuantity + (waste.quantity || 0),
        totalCost: acc.totalCost + (waste.cost || 0),
        totalEmissions: acc.totalEmissions + (waste.emissions_kgco2e || 0),
        hazardousCount: acc.hazardousCount + (waste.hazard ? 1 : 0)
      }), { totalQuantity: 0, totalCost: 0, totalEmissions: 0, hazardousCount: 0 });

      setStats(calculatedStats);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load waste records');
    } finally {
      setLoading(false);
    }
  };

  // Stats card configurations
  const statsConfig = [
    {
      key: 'quantity',
      icon: '🗑️',
      label: 'Total Waste',
      value: stats.totalQuantity,
      unit: 'kg',
      gradientLight: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
      gradientDark: 'linear-gradient(135deg, rgba(234, 179, 8, 0.2) 0%, rgba(217, 119, 6, 0.15) 100%)',
      accentColor: '#EAB308',
      textColorLight: '#78350F',
      textColorDark: '#FBBF24',
      borderColor: isDark ? 'rgba(234, 179, 8, 0.3)' : 'rgba(234, 179, 8, 0.4)',
    },
    {
      key: 'cost',
      icon: '💰',
      label: 'Total Cost',
      value: stats.totalCost,
      unit: '₹',
      prefix: '₹',
      gradientLight: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
      gradientDark: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.15) 100%)',
      accentColor: '#3B82F6',
      textColorLight: '#1E40AF',
      textColorDark: '#60A5FA',
      borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.4)',
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
    {
      key: 'hazardous',
      icon: '⚠️',
      label: 'Hazardous Waste',
      value: stats.hazardousCount,
      unit: 'records',
      gradientLight: 'linear-gradient(135deg, #FCE7F3 0%, #FBCFE8 100%)',
      gradientDark: 'linear-gradient(135deg, rgba(236, 72, 153, 0.2) 0%, rgba(219, 39, 119, 0.15) 100%)',
      accentColor: '#EC4899',
      textColorLight: '#9D174D',
      textColorDark: '#F472B6',
      borderColor: isDark ? 'rgba(236, 72, 153, 0.3)' : 'rgba(236, 72, 153, 0.4)',
    },
  ];

  // Waste type colors
  const wasteTypeColors = {
    paper_cardboard: { bg: isDark ? 'rgba(217, 119, 6, 0.2)' : '#FEF3C7', color: isDark ? '#FBBF24' : '#92400E' },
    plastics: { bg: isDark ? 'rgba(59, 130, 246, 0.2)' : '#DBEAFE', color: isDark ? '#60A5FA' : '#1E40AF' },
    metals: { bg: isDark ? 'rgba(107, 114, 128, 0.2)' : '#F3F4F6', color: isDark ? '#9CA3AF' : '#374151' },
    e_waste: { bg: isDark ? 'rgba(139, 92, 246, 0.2)' : '#EDE9FE', color: isDark ? '#A78BFA' : '#5B21B6' },
    biohazard: { bg: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2', color: isDark ? '#F87171' : '#991B1B' },
    construction: { bg: isDark ? 'rgba(120, 113, 108, 0.2)' : '#F5F5F4', color: isDark ? '#A8A29E' : '#44403C' },
    organic: { bg: isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7', color: isDark ? '#4ADE80' : '#166534' },
    glass: { bg: isDark ? 'rgba(6, 182, 212, 0.2)' : '#CFFAFE', color: isDark ? '#22D3EE' : '#0E7490' },
    textile: { bg: isDark ? 'rgba(236, 72, 153, 0.2)' : '#FCE7F3', color: isDark ? '#F472B6' : '#9D174D' },
  };

  // Disposal method colors
  const disposalMethodColors = {
    landfill: { bg: isDark ? 'rgba(120, 113, 108, 0.2)' : '#F5F5F4', color: isDark ? '#A8A29E' : '#44403C' },
    incineration: { bg: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2', color: isDark ? '#F87171' : '#991B1B' },
    recycling: { bg: isDark ? 'rgba(34, 197, 94, 0.2)' : '#DCFCE7', color: isDark ? '#4ADE80' : '#166534' },
    composting: { bg: isDark ? 'rgba(132, 204, 22, 0.2)' : '#ECFCCB', color: isDark ? '#A3E635' : '#3F6212' },
    anaerobic_digestion: { bg: isDark ? 'rgba(139, 92, 246, 0.2)' : '#EDE9FE', color: isDark ? '#A78BFA' : '#5B21B6' },
  };

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
          borderTop: '3px solid #eab308',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '16px',
        }} />
        <p style={{ color: colors.textSecondary, fontSize: '14px' }}>Loading waste records...</p>
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

      {/* Waste Records Table */}
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
            📋 Waste Disposal Records
          </h3>
          <p style={{
            fontSize: isMobile ? '12px' : '13px',
            color: colors.textSecondary,
            margin: 0,
          }}>
            {wastes.length} total records
          </p>
        </div>

        {wastes.length === 0 ? (
          <div style={{
            padding: isMobile ? '40px 20px' : '60px 20px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.4 }}>🗑️</div>
            <p style={{ color: colors.textSecondary, fontSize: '14px', margin: 0 }}>
              No waste records found. Add your first waste disposal record above.
            </p>
          </div>
        ) : isMobile ? (
          // Mobile Card View
          <div style={{ padding: '12px' }}>
            {wastes.map((waste, index) => (
              <MobileWasteCard 
                key={waste.id} 
                waste={waste} 
                index={index} 
                isDark={isDark} 
                colors={colors}
                wasteTypeColors={wasteTypeColors}
                disposalMethodColors={disposalMethodColors}
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
                  <th style={getHeaderStyle(isDark, colors)}>Waste Type</th>
                  <th style={getHeaderStyle(isDark, colors)}>Disposal</th>
                  <th style={getHeaderStyle(isDark, colors)}>Quantity</th>
                  <th style={getHeaderStyle(isDark, colors)}>Cost</th>
                  <th style={getHeaderStyle(isDark, colors)}>Hazard</th>
                  <th style={getHeaderStyle(isDark, colors)}>Emissions</th>
                  <th style={getHeaderStyle(isDark, colors)}>Facility</th>
                </tr>
              </thead>
              <tbody>
                {wastes.map((waste, index) => (
                  <tr 
                    key={waste.id} 
                    style={{
                      background: index % 2 === 0 
                        ? 'transparent' 
                        : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)'),
                      borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}`,
                      transition: 'background 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isDark 
                        ? 'rgba(234, 179, 8, 0.08)' 
                        : 'rgba(234, 179, 8, 0.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = index % 2 === 0 
                        ? 'transparent' 
                        : (isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.01)');
                    }}
                  >
                    <td style={getCellStyle(isDark, colors)}>
                      {waste.created_at ? new Date(waste.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={getCellStyle(isDark, colors)}>
                      <span style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: wasteTypeColors[waste.waste_type]?.bg || (isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6'),
                        color: wasteTypeColors[waste.waste_type]?.color || colors.text,
                        borderRadius: '6px',
                        display: 'inline-block',
                        textTransform: 'capitalize',
                      }}>
                        {waste.waste_type?.split('_').join(' ')}
                      </span>
                    </td>
                    <td style={getCellStyle(isDark, colors)}>
                      <span style={{
                        padding: '4px 10px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: disposalMethodColors[waste.disposal_method]?.bg || (isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6'),
                        color: disposalMethodColors[waste.disposal_method]?.color || colors.text,
                        borderRadius: '6px',
                        display: 'inline-block',
                        textTransform: 'capitalize',
                      }}>
                        {waste.disposal_method?.split('_').join(' ')}
                      </span>
                    </td>
                    <td style={getCellStyle(isDark, colors)}>
                      <span style={{ fontWeight: '600', color: isDark ? '#FBBF24' : '#B45309' }}>
                        {waste.quantity?.toFixed(2) || '0.00'}
                      </span>
                      <span style={{ fontSize: '10px', color: colors.textTertiary, marginLeft: '4px' }}>kg</span>
                    </td>
                    <td style={getCellStyle(isDark, colors)}>
                      {waste.cost ? (
                        <span style={{ color: isDark ? '#60A5FA' : '#2563EB' }}>
                          ₹{waste.cost.toFixed(2)}
                        </span>
                      ) : '-'}
                    </td>
                    <td style={getCellStyle(isDark, colors)}>
                      {waste.hazard ? (
                        <span style={{
                          padding: '3px 8px',
                          fontSize: '10px',
                          fontWeight: '600',
                          background: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
                          color: isDark ? '#F87171' : '#991B1B',
                          borderRadius: '6px',
                          display: 'inline-block',
                        }}>
                          ⚠️ YES
                        </span>
                      ) : (
                        <span style={{ color: colors.textTertiary, fontSize: '12px' }}>No</span>
                      )}
                    </td>
                    <td style={getCellStyle(isDark, colors)}>
                      <span style={{ fontWeight: '600', color: isDark ? '#F87171' : '#DC2626' }}>
                        {waste.emissions_kgco2e?.toFixed(2) || '-'}
                      </span>
                    </td>
                    <td style={getCellStyle(isDark, colors)}>
                      <span style={{ color: colors.textSecondary, fontSize: '12px' }}>
                        {waste.facility_name || '-'}
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
            {stat.prefix || ''}{stat.value.toFixed(2)}
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

// Mobile Waste Card Component
const MobileWasteCard = ({ waste, index, isDark, colors, wasteTypeColors, disposalMethodColors }) => (
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
        📅 {waste.created_at ? new Date(waste.created_at).toLocaleDateString() : 'N/A'}
      </span>
      {waste.hazard && (
        <span style={{
          padding: '2px 6px',
          fontSize: '9px',
          fontWeight: '600',
          background: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2',
          color: isDark ? '#F87171' : '#991B1B',
          borderRadius: '4px',
        }}>
          ⚠️ HAZARD
        </span>
      )}
    </div>
    
    <div style={{
      display: 'flex',
      gap: '8px',
      marginBottom: '10px',
      flexWrap: 'wrap',
    }}>
      <span style={{
        padding: '3px 8px',
        fontSize: '10px',
        fontWeight: '600',
        background: wasteTypeColors[waste.waste_type]?.bg || (isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6'),
        color: wasteTypeColors[waste.waste_type]?.color || colors.text,
        borderRadius: '6px',
        textTransform: 'capitalize',
      }}>
        {waste.waste_type?.split('_').join(' ')}
      </span>
      <span style={{
        padding: '3px 8px',
        fontSize: '10px',
        fontWeight: '600',
        background: disposalMethodColors[waste.disposal_method]?.bg || (isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6'),
        color: disposalMethodColors[waste.disposal_method]?.color || colors.text,
        borderRadius: '6px',
        textTransform: 'capitalize',
      }}>
        {waste.disposal_method?.split('_').join(' ')}
      </span>
    </div>
    
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '8px',
    }}>
      <div>
        <span style={{ fontSize: '10px', color: colors.textTertiary }}>Quantity</span>
        <p style={{ 
          fontSize: '14px', 
          fontWeight: '600', 
          color: isDark ? '#FBBF24' : '#B45309',
          margin: '2px 0 0 0',
        }}>
          {waste.quantity?.toFixed(2) || '0'} kg
        </p>
      </div>
      <div>
        <span style={{ fontSize: '10px', color: colors.textTertiary }}>Cost</span>
        <p style={{ 
          fontSize: '14px', 
          fontWeight: '600', 
          color: isDark ? '#60A5FA' : '#2563EB',
          margin: '2px 0 0 0',
        }}>
          {waste.cost ? `₹${waste.cost.toFixed(2)}` : '-'}
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
          {waste.emissions_kgco2e?.toFixed(2) || '-'} kg
        </p>
      </div>
      <div>
        <span style={{ fontSize: '10px', color: colors.textTertiary }}>Facility</span>
        <p style={{ 
          fontSize: '12px', 
          fontWeight: '500', 
          color: colors.textSecondary,
          margin: '2px 0 0 0',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {waste.facility_name || '-'}
        </p>
      </div>
    </div>
  </div>
);

// Helper functions for table styles
const getHeaderStyle = (isDark, colors) => ({
  padding: '12px 14px',
  textAlign: 'left',
  fontSize: '11px',
  fontWeight: '600',
  color: colors.textSecondary,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
});

const getCellStyle = (isDark, colors) => ({
  padding: '12px 14px',
  fontSize: '13px',
  color: colors.text,
  whiteSpace: 'nowrap',
});

export default WasteList;
