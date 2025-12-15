import React, { useState, useEffect } from 'react';
import { activitiesAPI, waterAPI, wasteAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';

const ResourceSummary = ({ companyId }) => {
  const navigate = useNavigate();
  const { colors, isDark } = useTheme();
  const { isMobile, isTablet } = useResponsive();
  const [stats, setStats] = useState({
    energy: { emissions: 0, activityCount: 0, activities: [], loading: true },
    water: { total: 0, unit: 'm³', loading: true },
    waste: { total: 0, unit: 'kg', loading: true }
  });
  const [showEnergyModal, setShowEnergyModal] = useState(false);
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    if (companyId) {
      fetchEnergyFromActivities();
      fetchWaterStats();
      fetchWasteStats();
    }
  }, [companyId]);

  const fetchEnergyFromActivities = async () => {
    try {
      const response = await activitiesAPI.getActivities(companyId);
      const activities = response.data.activities || [];

      // Filter energy-related activities
      const energyActivities = activities.filter(act => {
        const type = (act.activity_type || '').toLowerCase();
        const category = (act.category || '').toLowerCase();

        return (
          category.includes('energy') ||
          type.includes('electricity') ||
          type.includes('fuel') ||
          type.includes('diesel') ||
          type.includes('petrol') ||
          type.includes('gas') ||
          type.includes('coal') ||
          type.includes('lpg') ||
          type.includes('power') ||
          act.scope_number === 2
        );
      });

      const totalEmissions = energyActivities.reduce((sum, act) =>
        sum + (act.emissions_kgco2e || 0), 0
      );

      setStats(prev => ({
        ...prev,
        energy: {
          emissions: totalEmissions,
          activityCount: energyActivities.length,
          activities: energyActivities,
          loading: false
        }
      }));
    } catch (err) {
      console.error('Failed to fetch energy data:', err);
      setStats(prev => ({
        ...prev,
        energy: { ...prev.energy, loading: false }
      }));
    }
  };

  const fetchWaterStats = async () => {
    try {
      const response = await waterAPI.listWater(companyId);
      const waters = response.data.waters || [];

      const totalWater = waters.reduce((sum, w) => sum + (w.withdrawal_volume || 0), 0);

      setStats(prev => ({
        ...prev,
        water: { total: totalWater, unit: 'm³', loading: false }
      }));
    } catch (err) {
      console.error('Failed to fetch water data:', err);
      setStats(prev => ({
        ...prev,
        water: { ...prev.water, loading: false }
      }));
    }
  };

  const fetchWasteStats = async () => {
    try {
      const response = await wasteAPI.listWaste(companyId);
      const wastes = response.data.wastes || [];

      const totalWaste = wastes.reduce((sum, w) => sum + (w.quantity || 0), 0);

      setStats(prev => ({
        ...prev,
        waste: { total: totalWaste, unit: 'kg', loading: false }
      }));
    } catch (err) {
      console.error('Failed to fetch waste data:', err);
      setStats(prev => ({
        ...prev,
        waste: { ...prev.waste, loading: false }
      }));
    }
  };

  // Card configurations with unique colors
  const cardConfigs = {
    energy: {
      icon: '⚡',
      title: 'Energy Emissions',
      gradientLight: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
      gradientDark: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.15) 100%)',
      accentColor: '#F59E0B',
      iconBg: isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.3)',
      borderColor: isDark ? 'rgba(251, 191, 36, 0.3)' : 'rgba(251, 191, 36, 0.4)',
    },
    water: {
      icon: '💧',
      title: 'Water Usage',
      gradientLight: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
      gradientDark: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.15) 100%)',
      accentColor: '#3B82F6',
      iconBg: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.3)',
      borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.4)',
    },
    waste: {
      icon: '♻️',
      title: 'Waste Generated',
      gradientLight: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
      gradientDark: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.15) 100%)',
      accentColor: '#10B981',
      iconBg: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.3)',
      borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.4)',
    }
  };

  const getCardStyle = (cardKey, config) => ({
    background: isDark ? config.gradientDark : config.gradientLight,
    borderRadius: isMobile ? '14px' : '16px',
    padding: isMobile ? '16px' : '20px',
    border: `1px solid ${config.borderColor}`,
    boxShadow: hoveredCard === cardKey
      ? `0 12px 28px ${config.accentColor}30, 0 4px 12px rgba(0,0,0,0.15)`
      : `0 4px 12px ${config.accentColor}15, 0 2px 6px rgba(0,0,0,0.08)`,
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: hoveredCard === cardKey && !isMobile ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
    cursor: 'pointer',
  });

  return (
    <div style={{
      background: isDark 
        ? 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)' 
        : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
      borderRadius: isMobile ? '14px' : '18px',
      padding: isMobile ? '16px' : isTablet ? '20px' : '24px',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
      boxShadow: isDark
        ? '0 8px 24px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.2)'
        : '0 8px 24px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.04)',
      marginBottom: '24px',
    }}>
      <h2 style={{
        fontSize: isMobile ? '16px' : isTablet ? '18px' : '20px',
        fontWeight: '700',
        color: colors.text,
        margin: '0 0 16px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        🌿 Resource Consumption Overview
      </h2>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
        gap: isMobile ? '12px' : '16px',
      }}>
        {/* Energy Card */}
        <div
          style={getCardStyle('energy', cardConfigs.energy)}
          onClick={() => setShowEnergyModal(true)}
          onMouseEnter={() => setHoveredCard('energy')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '12px',
          }}>
            <div style={{
              fontSize: isMobile ? '24px' : '28px',
              background: cardConfigs.energy.iconBg,
              padding: '8px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>⚡</div>
            <h3 style={{
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: '600',
              color: cardConfigs.energy.accentColor,
              margin: 0,
            }}>Energy Emissions</h3>
          </div>
          {stats.energy.loading ? (
            <div style={{ textAlign: 'center', padding: '16px', color: colors.textSecondary, fontSize: '13px' }}>Loading...</div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontSize: isMobile ? '24px' : '28px',
                fontWeight: '800',
                color: isDark ? '#FBBF24' : '#B45309',
                margin: '0 0 4px 0',
              }}>{(stats.energy.emissions / 1000).toFixed(2)}</p>
              <p style={{
                fontSize: '11px',
                color: colors.textSecondary,
                margin: '0 0 8px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>tonnes CO2e</p>
              <p style={{
                fontSize: '11px',
                color: colors.textTertiary,
                margin: '0 0 12px 0',
              }}>
                From {stats.energy.activityCount} activities
              </p>
              <button style={{
                padding: '6px 12px',
                background: isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.3)',
                border: `1px solid ${cardConfigs.energy.accentColor}40`,
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '600',
                color: cardConfigs.energy.accentColor,
                cursor: 'pointer',
              }}>
                📊 View Breakdown
              </button>
            </div>
          )}
        </div>

        {/* Water Card */}
        <div
          style={getCardStyle('water', cardConfigs.water)}
          onClick={() => navigate('/water')}
          onMouseEnter={() => setHoveredCard('water')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '12px',
          }}>
            <div style={{
              fontSize: isMobile ? '24px' : '28px',
              background: cardConfigs.water.iconBg,
              padding: '8px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>💧</div>
            <h3 style={{
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: '600',
              color: cardConfigs.water.accentColor,
              margin: 0,
            }}>Water Usage</h3>
          </div>
          {stats.water.loading ? (
            <div style={{ textAlign: 'center', padding: '16px', color: colors.textSecondary, fontSize: '13px' }}>Loading...</div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontSize: isMobile ? '24px' : '28px',
                fontWeight: '800',
                color: isDark ? '#60A5FA' : '#1D4ED8',
                margin: '0 0 4px 0',
              }}>{stats.water.total.toFixed(2)}</p>
              <p style={{
                fontSize: '11px',
                color: colors.textSecondary,
                margin: '0 0 8px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>{stats.water.unit}</p>
              <p style={{
                fontSize: '11px',
                color: colors.textTertiary,
                margin: '0 0 12px 0',
              }}>
                Total withdrawal
              </p>
              <button style={{
                padding: '6px 12px',
                background: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.3)',
                border: `1px solid ${cardConfigs.water.accentColor}40`,
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '600',
                color: cardConfigs.water.accentColor,
                cursor: 'pointer',
              }}>
                → Water Management
              </button>
            </div>
          )}
        </div>

        {/* Waste Card */}
        <div
          style={getCardStyle('waste', cardConfigs.waste)}
          onClick={() => navigate('/waste')}
          onMouseEnter={() => setHoveredCard('waste')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '12px',
          }}>
            <div style={{
              fontSize: isMobile ? '24px' : '28px',
              background: cardConfigs.waste.iconBg,
              padding: '8px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>♻️</div>
            <h3 style={{
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: '600',
              color: cardConfigs.waste.accentColor,
              margin: 0,
            }}>Waste Generated</h3>
          </div>
          {stats.waste.loading ? (
            <div style={{ textAlign: 'center', padding: '16px', color: colors.textSecondary, fontSize: '13px' }}>Loading...</div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontSize: isMobile ? '24px' : '28px',
                fontWeight: '800',
                color: isDark ? '#34D399' : '#047857',
                margin: '0 0 4px 0',
              }}>{stats.waste.total.toFixed(2)}</p>
              <p style={{
                fontSize: '11px',
                color: colors.textSecondary,
                margin: '0 0 8px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}>{stats.waste.unit}</p>
              <p style={{
                fontSize: '11px',
                color: colors.textTertiary,
                margin: '0 0 12px 0',
              }}>
                Total waste disposed
              </p>
              <button style={{
                padding: '6px 12px',
                background: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.3)',
                border: `1px solid ${cardConfigs.waste.accentColor}40`,
                borderRadius: '8px',
                fontSize: '11px',
                fontWeight: '600',
                color: cardConfigs.waste.accentColor,
                cursor: 'pointer',
              }}>
                → Waste Management
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Energy Breakdown Modal */}
      {showEnergyModal && (
        <EnergyBreakdownModal
          activities={stats.energy.activities}
          totalEmissions={stats.energy.emissions}
          onClose={() => setShowEnergyModal(false)}
          isDark={isDark}
          colors={colors}
        />
      )}
    </div>
  );
};

// Energy Breakdown Modal Component
const EnergyBreakdownModal = ({ activities, totalEmissions, onClose, isDark, colors }) => {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.6)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem',
    }} onClick={onClose}>
      <div style={{
        background: isDark 
          ? 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)' 
          : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '16px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          padding: '1.25rem',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: '700',
            color: colors.text,
            margin: 0,
          }}>⚡ Energy Emissions Breakdown</h2>
          <button style={{
            padding: '6px 10px',
            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            border: 'none',
            fontSize: '1.25rem',
            cursor: 'pointer',
            color: colors.textSecondary,
            borderRadius: '8px',
          }} onClick={onClose}>✕</button>
        </div>

        <div style={{
          display: 'flex',
          gap: '1rem',
          padding: '1rem',
          background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
        }}>
          <div style={{
            flex: 1,
            textAlign: 'center',
            padding: '1rem',
            background: isDark 
              ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%)' 
              : 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
            borderRadius: '10px',
            border: `1px solid ${isDark ? 'rgba(251, 191, 36, 0.2)' : 'rgba(251, 191, 36, 0.3)'}`,
          }}>
            <p style={{ fontSize: '0.75rem', color: colors.textSecondary, marginBottom: '4px' }}>Total Emissions</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: isDark ? '#FBBF24' : '#B45309' }}>
              {(totalEmissions / 1000).toFixed(2)} tonnes CO2e
            </p>
          </div>
          <div style={{
            flex: 1,
            textAlign: 'center',
            padding: '1rem',
            background: isDark 
              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.1) 100%)' 
              : 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
            borderRadius: '10px',
            border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.3)'}`,
          }}>
            <p style={{ fontSize: '0.75rem', color: colors.textSecondary, marginBottom: '4px' }}>Total Activities</p>
            <p style={{ fontSize: '1.25rem', fontWeight: 'bold', color: isDark ? '#60A5FA' : '#1D4ED8' }}>
              {activities.length}
            </p>
          </div>
        </div>

        <div style={{
          padding: '1rem',
          overflowY: 'auto',
          flex: 1,
        }}>
          {activities.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: colors.textSecondary }}>No energy activities found</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1fr 1fr 1.5fr 1.5fr',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                borderRadius: '8px',
                fontSize: '0.7rem',
                fontWeight: '600',
                color: colors.textSecondary,
                textTransform: 'uppercase',
              }}>
                <div>Activity</div>
                <div>Quantity</div>
                <div>Unit</div>
                <div>Emissions</div>
                <div>Date</div>
              </div>
              {activities.map((activity, index) => (
                <div key={activity.id || index} style={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1.5fr 1.5fr',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                  borderRadius: '8px',
                  fontSize: '0.8rem',
                  color: colors.text,
                }}>
                  <div style={{ fontWeight: '500' }}>{activity.activity_type || activity.activity_name}</div>
                  <div>{activity.quantity?.toFixed(2)}</div>
                  <div>{activity.unit}</div>
                  <div style={{ fontWeight: '600', color: '#EF4444' }}>
                    {(activity.emissions_kgco2e / 1000).toFixed(3)} t
                  </div>
                  <div style={{ color: colors.textSecondary }}>
                    {activity.activity_date ? new Date(activity.activity_date).toLocaleDateString() : '-'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResourceSummary;
