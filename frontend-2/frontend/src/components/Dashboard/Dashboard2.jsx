// frontend/src/components/Dashboard/Dashboard2.jsx
import { useState, useEffect } from 'react';
import { activitiesAPI } from '../../services/api';
import DashboardLayout from './DashboardLayout';
import ResourceSummary from './ResourceSummary';
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const API_BASE = 'http://localhost:8000/api/v1';



function Dashboard({ user }) {
  const { isMobile, isTablet } = useResponsive();
  const { colors } = useTheme();
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    scope1: 0,
    scope2: 0,
    scope3: 0,
    count: 0
  });
  const [loading, setLoading] = useState(true);
  const [animated, setAnimated] = useState(false);
  const [lifecycleData, setLifecycleData] = useState(null);

  useEffect(() => {
    fetchActivities();
    fetchLifecycleData();
  }, []);

  // Get styles early so they're available for loading state
  const styles = getStyles(colors);

  useEffect(() => {
    if (!loading) {
      setTimeout(() => setAnimated(true), 100);
    }
  }, [loading]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      console.log('📥 Fetching activities for company:', user.company_id);

      const response = await activitiesAPI.getActivities(user.company_id);
      const data = response.data;

      console.log('📊 Response:', data);

      if (data && data.activities) {
        setActivities(data.activities);
        calculateStats(data.activities);
      } else {
        setActivities([]);
        calculateStats([]);
      }
    } catch (error) {
      console.error('❌ Error fetching activities:', error);
      setActivities([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (activityList) => {
    if (!activityList || activityList.length === 0) {
      setStats({ total: 0, scope1: 0, scope2: 0, scope3: 0, count: 0 });
      return;
    }

    const total = activityList.reduce((sum, act) => sum + (act.emissions_kgco2e || 0), 0);
    const scope1 = activityList.filter(a => a.scope_number === 1).reduce((sum, act) => sum + (act.emissions_kgco2e || 0), 0);
    const scope2 = activityList.filter(a => a.scope_number === 2).reduce((sum, act) => sum + (act.emissions_kgco2e || 0), 0);
    const scope3 = activityList.filter(a => a.scope_number === 3).reduce((sum, act) => sum + (act.emissions_kgco2e || 0), 0);

    setStats({
      total: total / 1000,
      scope1: scope1 / 1000,
      scope2: scope2 / 1000,
      scope3: scope3 / 1000,
      count: activityList.length
    });

    console.log('✅ Stats calculated:', {
      total: total / 1000,
      scope1: scope1 / 1000,
      scope2: scope2 / 1000,
      scope3: scope3 / 1000,
      count: activityList.length
    });
  };

  const fetchLifecycleData = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('🔍 Fetching lifecycle data...');
      const response = await axios.get(`${API_BASE}/dashboard/lifecycle-overview`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('✅ Lifecycle data received:', response.data);
      setLifecycleData(response.data);
    } catch (err) {
      console.error('❌ Failed to fetch lifecycle data:', err);
      console.error('Error details:', err.response);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}>
          <div style={styles.spinner}></div>
        </div>
        <p style={styles.loadingText}>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div style={{
        ...styles.content,
        ...(isMobile ? styles.contentMobile : {}),
        opacity: animated ? 1 : 0,
        transform: animated ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.8s ease, transform 0.8s ease'
      }}>
        {/* Hero Header */}
        <div style={{
          ...styles.heroSection,
          padding: isMobile ? '24px' : isTablet ? '32px' : '40px',
        }}>
          <div style={{
            ...styles.heroContent,
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '20px' : '0',
          }}>
            <div style={styles.heroText}>
              <h1 style={{
                ...styles.heroTitle,
                fontSize: isMobile ? '24px' : isTablet ? '30px' : '36px',
              }}>
                 Welcome back, {user.username}!
              </h1>
              <p style={{
                ...styles.heroSubtitle,
                fontSize: isMobile ? '14px' : isTablet ? '16px' : '18px',
              }}>
                Your carbon footprint dashboard - track, analyze, and reduce emissions
              </p>
            </div>
            <div style={{
              ...styles.heroStats,
              marginLeft: isMobile ? '0' : '40px',
              marginTop: isMobile ? '16px' : '0',
            }}>
              <div style={styles.heroStat}>
                <div style={{
                  ...styles.heroStatValue,
                  fontSize: isMobile ? '24px' : '28px',
                }}>{stats.count}</div>
                <div style={styles.heroStatLabel}>Activities</div>
              </div>
            </div>
          </div>
          <div style={styles.heroDecoration}>
            <div style={styles.floatingOrb1}></div>
            <div style={styles.floatingOrb2}></div>
            <div style={styles.floatingOrb3}></div>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{
          ...styles.statsGrid,
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? '12px' : isTablet ? '16px' : '20px',
        }}>
          <StatCard
            icon="🌍"
            value={stats.total.toFixed(2)}
            label="Total Emissions"
            unit="tonnes CO2e"
            gradientLight="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
            gradientDark="linear-gradient(135deg, #4c63d2 0%, #5d3a7a 100%)"
            accentColor="#667eea"
            iconBg="rgba(255, 255, 255, 0.2)"
            trend="+2.1%"
            description="vs last month"
            delay={0}
          />
          <StatCard
            icon="🔥"
            value={stats.scope1.toFixed(2)}
            label="Scope 1"
            percentage={stats.total > 0 ? ((stats.scope1 / stats.total) * 100).toFixed(0) : 0}
            gradientLight="linear-gradient(135deg, #f43f5e 0%, #ec4899 100%)"
            gradientDark="linear-gradient(135deg, #be123c 0%, #be185d 100%)"
            accentColor="#f43f5e"
            iconBg="rgba(255, 255, 255, 0.2)"
            trend="-1.5%"
            description="direct emissions"
            delay={0.2}
          />
          <StatCard
            icon="⚡"
            value={stats.scope2.toFixed(2)}
            label="Scope 2"
            percentage={stats.total > 0 ? ((stats.scope2 / stats.total) * 100).toFixed(0) : 0}
            gradientLight="linear-gradient(135deg, #f59e0b 0%, #f97316 100%)"
            gradientDark="linear-gradient(135deg, #b45309 0%, #c2410c 100%)"
            accentColor="#f59e0b"
            iconBg="rgba(255, 255, 255, 0.2)"
            trend="+0.8%"
            description="energy indirect"
            delay={0.4}
          />
          <StatCard
            icon="📦"
            value={stats.scope3.toFixed(2)}
            label="Scope 3"
            percentage={stats.total > 0 ? ((stats.scope3 / stats.total) * 100).toFixed(0) : 0}
            gradientLight="linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)"
            gradientDark="linear-gradient(135deg, #0e7490 0%, #155e75 100%)"
            accentColor="#06b6d4"
            iconBg="rgba(255, 255, 255, 0.2)"
            trend="+3.2%"
            description="value chain"
            delay={0.6}
          />
        </div>


        {/* Resource Summary - Energy, Water, Waste */}
        <ResourceSummary companyId={user?.company_id} />


        {/* Lifecycle Flow Section */}
        {lifecycleData && (
          <LifecycleFlowSection lifecycleData={lifecycleData} />
        )}


        {/* Charts Section */}
        <div style={{
          ...styles.chartsGrid,
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: isMobile ? '16px' : '24px',
        }}>
          {/* Category Breakdown Donut Chart */}
          <ChartCard 
            title="📊 Category Breakdown" 
            badge="By Activity Type"
            badgeColor="#10b981"
          >
            <CategoryDonutChart activities={activities} />
          </ChartCard>

          {/* Scope Breakdown Donut Chart */}
          <ChartCard 
            title="🍩 Scope Distribution" 
            badge="All Scopes"
            badgeColor="#8b5cf6"
          >
            <ScopeDonutChart stats={stats} />
          </ChartCard>
        </div>

        {/* Activities List */}
        <ActivitiesSection activities={activities} />
      </div>
    </DashboardLayout>
  );
}

// Stat Card Component with Gradient Support - Compact Version
function StatCard({ icon, value, label, unit, percentage, gradientLight, gradientDark, accentColor, iconBg, trend, description, delay }) {
  const { isMobile, isTablet } = useResponsive();
  const { isDark } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  // Choose gradient based on theme
  const gradient = isDark ? gradientDark : gradientLight;

  return (
    <div
      style={{
        background: gradient,
        padding: isMobile ? '12px' : isTablet ? '14px' : '14px',
        borderRadius: isMobile ? '12px' : '14px',
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '10px' : '12px',
        boxShadow: isHovered 
          ? `0 8px 20px ${accentColor}35, 0 3px 8px rgba(0,0,0,0.12)` 
          : `0 3px 12px ${accentColor}20, 0 2px 6px rgba(0,0,0,0.08)`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: isVisible ? 1 : 0,
        transform: isVisible 
          ? (isHovered && !isMobile ? 'translateY(-4px) scale(1.01)' : 'translateY(0) scale(1)') 
          : 'translateY(15px) scale(0.98)',
        cursor: 'default',
        position: 'relative',
        overflow: 'hidden',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.25)'}`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Decorative glow effect - smaller */}
      <div style={{
        position: 'absolute',
        top: '-40%',
        right: '-15%',
        width: '80px',
        height: '80px',
        background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />
      
      {/* Icon container - smaller */}
      <div style={{
        fontSize: isMobile ? '18px' : isTablet ? '20px' : '22px',
        flexShrink: 0,
        background: iconBg,
        padding: isMobile ? '8px' : '9px',
        borderRadius: isMobile ? '8px' : '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(6px)',
        transform: isHovered ? 'scale(1.08) rotate(3deg)' : 'scale(1) rotate(0deg)',
        transition: 'transform 0.3s ease',
      }}>{icon}</div>
      
      {/* Content - smaller fonts */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: isMobile ? '16px' : isTablet ? '18px' : '20px',
          fontWeight: '700',
          color: '#ffffff',
          lineHeight: 1.1,
          textShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>{value}</div>
        <div style={{
          fontSize: isMobile ? '10px' : '11px',
          color: 'rgba(255, 255, 255, 0.9)',
          marginTop: '2px',
          fontWeight: '600',
          letterSpacing: '0.2px',
        }}>{label}</div>
        {unit && <div style={{
          fontSize: isMobile ? '8px' : '9px',
          color: 'rgba(255, 255, 255, 0.65)',
          marginTop: '1px',
          fontWeight: '500',
        }}>{unit}</div>}
        {percentage !== undefined && percentage !== null && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            marginTop: '4px',
            padding: '2px 6px',
            background: 'rgba(255, 255, 255, 0.18)',
            borderRadius: '12px',
            fontSize: isMobile ? '9px' : '10px',
            fontWeight: '600',
            color: '#ffffff',
          }}>
            <span>{percentage}%</span>
            <span style={{ fontSize: '8px', opacity: 0.75 }}>of total</span>
          </div>
        )}
        {trend && !isMobile && (
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2px',
            marginTop: '4px',
            marginLeft: percentage ? '6px' : '0',
            padding: '2px 6px',
            background: trend.startsWith('+') 
              ? 'rgba(34, 197, 94, 0.25)' 
              : 'rgba(239, 68, 68, 0.25)',
            borderRadius: '12px',
            fontSize: '9px',
            fontWeight: '600',
            color: '#ffffff',
          }}>
            <span>{trend.startsWith('+') ? '↑' : '↓'}</span>
            <span>{trend}</span>
          </div>
        )}
        {description && !isMobile && (
          <div style={{
            fontSize: '8px',
            color: 'rgba(255, 255, 255, 0.55)',
            marginTop: '2px',
            fontStyle: 'italic',
          }}>{description}</div>
        )}
      </div>
    </div>
  );
}

// Chart Card Component with Theme Support
function ChartCard({ title, badge, badgeColor, children }) {
  const { isMobile, isTablet } = useResponsive();
  const { colors: themeColors, isDark } = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      style={{
        background: isDark 
          ? 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)' 
          : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: isMobile ? '14px' : '18px',
        padding: isMobile ? '16px' : isTablet ? '20px' : '24px',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        boxShadow: isHovered
          ? isDark 
            ? '0 20px 40px rgba(0,0,0,0.4), 0 8px 16px rgba(0,0,0,0.3)'
            : '0 20px 40px rgba(0,0,0,0.1), 0 8px 16px rgba(0,0,0,0.06)'
          : isDark
            ? '0 8px 24px rgba(0,0,0,0.3), 0 4px 8px rgba(0,0,0,0.2)'
            : '0 8px 24px rgba(0,0,0,0.06), 0 4px 8px rgba(0,0,0,0.04)',
        transition: 'all 0.3s ease',
        transform: isHovered && !isMobile ? 'translateY(-4px)' : 'translateY(0)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '12px' : '0',
        marginBottom: '20px',
      }}>
        <h3 style={{
          fontSize: isMobile ? '16px' : isTablet ? '17px' : '18px',
          fontWeight: '700',
          color: themeColors.text,
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>{title}</h3>
        <div style={{
          fontSize: '11px',
          color: badgeColor,
          background: isDark 
            ? `${badgeColor}20` 
            : `${badgeColor}15`,
          padding: '5px 12px',
          borderRadius: '20px',
          fontWeight: '600',
          border: `1px solid ${badgeColor}30`,
        }}>{badge}</div>
      </div>
      {children}
    </div>
  );
}

// Scope Bar Chart Component
function ScopeBarChart({ stats }) {
  const { isMobile, isTablet } = useResponsive();
  const { colors: themeColors } = useTheme();
  const chartStyles = getStyles(themeColors);
  const total = stats.total;

  const scopes = [
    { name: 'Scope 1', value: stats.scope1, color: '#ef4444' },
    { name: 'Scope 2', value: stats.scope2, color: '#f59e0b' },
    { name: 'Scope 3', value: stats.scope3, color: '#8b5cf6' },
  ];

  return (
    <div style={chartStyles.barChartContainer}>
      {scopes.map((scope) => {
        const percentage = total > 0 ? (scope.value / total) * 100 : 0;
        const barWidth = percentage > 0 ? `${percentage}%` : '2px';

        return (
          <div key={scope.name} style={{
            ...chartStyles.barRow,
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '8px' : '16px',
            alignItems: isMobile ? 'stretch' : 'center',
          }}>
            <div style={{
              ...chartStyles.barLabel,
              ...(isMobile ? chartStyles.barLabelMobile : {}),
              width: isMobile ? '100%' : '80px',
            }}>{scope.name}</div>
            <div style={{
              ...chartStyles.barTrack,
              height: isMobile ? '24px' : '32px',
            }}>
              <div
                style={{
                  ...chartStyles.barFill,
                  width: barWidth,
                  background: scope.color
                }}
              />
            </div>
            <div style={{
              ...chartStyles.barValue,
              fontSize: isMobile ? '12px' : '14px',
              width: isMobile ? '100%' : '120px',
              textAlign: isMobile ? 'left' : 'right',
            }}>
              {scope.value.toFixed(2)} t ({percentage.toFixed(0)}%)
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Scope Donut Chart Component
function ScopeDonutChart({ stats }) {
  const { isMobile, isTablet } = useResponsive();
  const { colors: themeColors } = useTheme();
  const chartStyles = getStyles(themeColors);
  const total = stats.total;
  
  const scopeData = [
    { name: 'Scope 1', value: stats.scope1, color: '#ef4444', description: 'Direct Emissions' },
    { name: 'Scope 2', value: stats.scope2, color: '#f59e0b', description: 'Energy Indirect' },
    { name: 'Scope 3', value: stats.scope3, color: '#8b5cf6', description: 'Value Chain' },
  ].filter(scope => scope.value > 0);

  // If no data, show placeholder
  if (scopeData.length === 0 || total === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '30px 16px' : '40px 20px',
        background: themeColors.bgTertiary,
        borderRadius: '12px',
        minHeight: isMobile ? '200px' : '280px',
      }}>
        <div style={{ fontSize: isMobile ? '36px' : '48px', marginBottom: '12px', opacity: 0.4 }}>📊</div>
        <p style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: '600', color: themeColors.text, margin: 0 }}>
          No emission data available
        </p>
        <p style={{ fontSize: isMobile ? '12px' : '13px', color: themeColors.textTertiary, marginTop: '6px' }}>
          Start tracking activities to see your breakdown
        </p>
      </div>
    );
  }

  // Calculate percentages
  const dataWithPercentage = scopeData.map(scope => ({
    ...scope,
    percentage: total > 0 ? (scope.value / total) * 100 : 0
  }));

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: isMobile ? '16px' : '20px',
    }}>
      <div style={{ width: '100%', height: isMobile ? 220 : isTablet ? 250 : 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={dataWithPercentage}
              cx="50%"
              cy="50%"
              innerRadius={isMobile ? 45 : isTablet ? 55 : 65}
              outerRadius={isMobile ? 80 : isTablet ? 95 : 110}
              paddingAngle={3}
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
            >
              {dataWithPercentage.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  stroke={entry.color}
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload[0]) {
                  const data = payload[0].payload;
                  return (
                    <div style={{
                      background: themeColors.cardBg,
                      border: `1px solid ${themeColors.border}`,
                      borderRadius: '12px',
                      padding: '14px 18px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    }}>
                      <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: data.color }}>
                        {data.name}
                      </p>
                      <p style={{ margin: '6px 0 0', fontSize: '14px', fontWeight: '600', color: themeColors.text }}>
                        {data.value.toFixed(2)} tonnes CO₂e
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: themeColors.textSecondary }}>
                        {data.percentage.toFixed(1)}% of total
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: '11px', color: themeColors.textTertiary, fontStyle: 'italic' }}>
                        {data.description}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Center text */}
            <text
              x="50%"
              y="45%"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fontSize: isMobile ? 12 : 14, fontWeight: 700, fill: themeColors.text }}
            >
              Total
            </text>
            <text
              x="50%"
              y="58%"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fontSize: isMobile ? 16 : 18, fontWeight: 800, fill: themeColors.primary }}
            >
              {total.toFixed(2)}t
            </text>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: isMobile ? '10px' : '16px',
        width: '100%',
      }}>
        {dataWithPercentage.map((scope) => (
          <div key={scope.name} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: isMobile ? '8px 12px' : '10px 16px',
            background: themeColors.bgTertiary,
            borderRadius: '12px',
            border: `1px solid ${themeColors.border}`,
            minWidth: isMobile ? '100px' : '140px',
          }}>
            <div style={{
              width: isMobile ? '12px' : '14px',
              height: isMobile ? '12px' : '14px',
              borderRadius: '4px',
              background: scope.color,
              flexShrink: 0,
            }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ fontSize: isMobile ? '12px' : '13px', fontWeight: '600', color: themeColors.text }}>
                {scope.name}
              </div>
              <div style={{ fontSize: isMobile ? '10px' : '11px', color: themeColors.textSecondary }}>
                {scope.percentage.toFixed(1)}% • {scope.value.toFixed(2)}t
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Category Donut Chart Component
function CategoryDonutChart({ activities }) {
  const { isMobile, isTablet } = useResponsive();
  const { colors: themeColors } = useTheme();

  // Define vibrant category colors for better visualization
  const categoryColors = {
    'electricity': '#FBBF24',      // Amber/Yellow - Electric bolt
    'natural_gas': '#F97316',      // Orange - Flame
    'natural gas': '#F97316',
    'diesel': '#059669',           // Emerald Green - Fuel pump
    'petrol': '#7C3AED',           // Violet Purple - Gasoline
    'flight': '#3B82F6',           // Blue - Sky/Aviation
    'taxi': '#EC4899',             // Pink - Ride service
    'coal': '#1F2937',             // Dark Gray/Black - Coal
    'refrigerant': '#EF4444',      // Red - Warning/Cooling
    'waste': '#8B5CF6',            // Purple - Disposal
    'water': '#06B6D4',            // Cyan - Water
    'transport': '#14B8A6',        // Teal - Movement
    'fuel': '#EA580C',             // Deep Orange - Fuel
    'train': '#0284C7',            // Sky Blue - Railway
    'hotel': '#A855F7',            // Fuchsia - Accommodation
    'lpg': '#84CC16',              // Lime Green - LPG
    'cng': '#22C55E',              // Green - Clean fuel
    'paper': '#D97706',            // Amber Brown - Paper
    'plastic': '#DC2626',          // Red - Plastic warning
    'steel': '#475569',            // Slate - Metal
    'cement': '#78716C',           // Stone - Concrete
    'emissions': '#6366F1',        // Indigo - General emissions
    'other': '#9CA3AF',            // Gray - Miscellaneous
    'unknown': '#9CA3AF',
  };

  // Calculate category-wise emissions
  const getCategoryData = () => {
    if (!activities || activities.length === 0) {
      return [];
    }

    const categoryMap = {};
    const totalEmissions = activities.reduce((sum, act) => sum + (act.emissions_kgco2e || 0), 0);

    activities.forEach(activity => {
      // First check if activity has a category field from AI extraction
      let category = activity.category || activity.category_raw || '';
      
      // If no category, infer from activity type
      if (!category || category === 'Other' || category === 'unknown') {
        const actType = (activity.activity_type || 'unknown').toLowerCase();
        
        // Map activity type to category
        if (actType.includes('electric') || actType.includes('electricity')) category = 'Electricity';
        else if (actType.includes('natural_gas') || actType.includes('gas')) category = 'Natural Gas';
        else if (actType.includes('diesel')) category = 'Diesel';
        else if (actType.includes('petrol') || actType.includes('gasoline')) category = 'Petrol';
        else if (actType.includes('flight') || actType.includes('air') || actType.includes('plane')) category = 'Flight';
        else if (actType.includes('taxi') || actType.includes('cab')) category = 'Taxi';
        else if (actType.includes('coal')) category = 'Coal';
        else if (actType.includes('refriger') || actType.includes('cooling') || actType.includes('ac')) category = 'Refrigerant';
        else if (actType.includes('waste') || actType.includes('disposal')) category = 'Waste';
        else if (actType.includes('water')) category = 'Water';
        else if (actType.includes('transport') || actType.includes('vehicle')) category = 'Transport';
        else if (actType.includes('fuel')) category = 'Fuel';
        else if (actType.includes('train') || actType.includes('rail')) category = 'Train';
        else if (actType.includes('hotel') || actType.includes('accommodation')) category = 'Hotel';
        else if (actType.includes('lpg')) category = 'LPG';
        else if (actType.includes('cng')) category = 'CNG';
        else if (actType.includes('paper') || actType.includes('cardboard')) category = 'Paper';
        else if (actType.includes('plastic')) category = 'Plastic';
        else if (actType.includes('steel') || actType.includes('metal')) category = 'Steel';
        else if (actType.includes('cement') || actType.includes('concrete')) category = 'Cement';
        else category = 'Other';
      }
      
      // Normalize category name (capitalize first letter)
      category = category.charAt(0).toUpperCase() + category.slice(1).toLowerCase();
      // Handle special cases
      if (category === 'Natural gas') category = 'Natural Gas';
      if (category === 'Lpg') category = 'LPG';
      if (category === 'Cng') category = 'CNG';

      if (!categoryMap[category]) {
        categoryMap[category] = 0;
      }
      categoryMap[category] += activity.emissions_kgco2e || 0;
    });

    // Convert to array and calculate percentages
    const result = Object.entries(categoryMap)
      .map(([name, emissions]) => {
        const colorKey = name.toLowerCase().replace(' ', '_');
        return {
          name,
          value: emissions / 1000, // Convert to tonnes
          rawEmissions: emissions,
          percentage: totalEmissions > 0 ? (emissions / totalEmissions) * 100 : 0,
          color: categoryColors[colorKey] || `hsl(${Math.random() * 360}, 70%, 50%)`
        };
      })
      .filter(item => item.rawEmissions > 0)
      .sort((a, b) => b.percentage - a.percentage);

    return result;
  };

  const categoryData = getCategoryData();
  const totalEmissions = categoryData.reduce((sum, cat) => sum + cat.value, 0);

  // If no data, show placeholder
  if (categoryData.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '30px 16px' : '40px 20px',
        background: themeColors.bgTertiary,
        borderRadius: '12px',
        minHeight: isMobile ? '200px' : '280px',
      }}>
        <div style={{ fontSize: isMobile ? '36px' : '48px', marginBottom: '12px', opacity: 0.4 }}>📊</div>
        <p style={{ fontSize: isMobile ? '14px' : '16px', fontWeight: '600', color: themeColors.text, margin: 0 }}>
          No category data available
        </p>
        <p style={{ fontSize: isMobile ? '12px' : '13px', color: themeColors.textTertiary, marginTop: '6px' }}>
          Start tracking activities to see category breakdown
        </p>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: isMobile ? '16px' : '20px',
    }}>
      <div style={{ width: '100%', height: isMobile ? 220 : isTablet ? 250 : 280 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categoryData}
              cx="50%"
              cy="50%"
              innerRadius={isMobile ? 45 : isTablet ? 55 : 65}
              outerRadius={isMobile ? 80 : isTablet ? 95 : 110}
              paddingAngle={2}
              dataKey="value"
              animationBegin={0}
              animationDuration={800}
            >
              {categoryData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  stroke={entry.color}
                  strokeWidth={2}
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload[0]) {
                  const data = payload[0].payload;
                  return (
                    <div style={{
                      background: themeColors.cardBg,
                      border: `1px solid ${themeColors.border}`,
                      borderRadius: '12px',
                      padding: '14px 18px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                    }}>
                      <p style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: data.color }}>
                        {data.name}
                      </p>
                      <p style={{ margin: '6px 0 0', fontSize: '14px', fontWeight: '600', color: themeColors.text }}>
                        {data.value.toFixed(2)} tonnes CO₂e
                      </p>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', color: themeColors.textSecondary }}>
                        {data.percentage.toFixed(1)}% of total
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Center text */}
            <text
              x="50%"
              y="42%"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fontSize: isMobile ? 11 : 12, fontWeight: 600, fill: themeColors.textSecondary }}
            >
              Categories
            </text>
            <text
              x="50%"
              y="55%"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fontSize: isMobile ? 14 : 16, fontWeight: 800, fill: themeColors.primary }}
            >
              {categoryData.length}
            </text>
            <text
              x="50%"
              y="66%"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fontSize: isMobile ? 9 : 10, fontWeight: 500, fill: themeColors.textTertiary }}
            >
              {totalEmissions.toFixed(1)}t total
            </text>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend - scrollable if many categories */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: isMobile ? '8px' : '10px',
        width: '100%',
        maxHeight: isMobile ? '120px' : '150px',
        overflowY: 'auto',
        padding: '4px',
      }}>
        {categoryData.slice(0, 8).map((category) => (
          <div key={category.name} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: isMobile ? '6px 10px' : '8px 12px',
            background: themeColors.bgTertiary,
            borderRadius: '10px',
            border: `1px solid ${themeColors.border}`,
            minWidth: isMobile ? '90px' : '110px',
          }}>
            <div style={{
              width: isMobile ? '10px' : '12px',
              height: isMobile ? '10px' : '12px',
              borderRadius: '3px',
              background: category.color,
              flexShrink: 0,
            }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', minWidth: 0 }}>
              <div style={{ 
                fontSize: isMobile ? '11px' : '12px', 
                fontWeight: '600', 
                color: themeColors.text,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: isMobile ? '60px' : '80px',
              }}>
                {category.name}
              </div>
              <div style={{ fontSize: isMobile ? '9px' : '10px', color: themeColors.textSecondary }}>
                {category.percentage.toFixed(1)}%
              </div>
            </div>
          </div>
        ))}
        {categoryData.length > 8 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: isMobile ? '6px 10px' : '8px 12px',
            background: themeColors.bgTertiary,
            borderRadius: '10px',
            border: `1px solid ${themeColors.border}`,
            fontSize: isMobile ? '10px' : '11px',
            color: themeColors.textSecondary,
            fontWeight: '500',
          }}>
            +{categoryData.length - 8} more
          </div>
        )}
      </div>
    </div>
  );
}

// Activities Section Component
function ActivitiesSection({ activities }) {
  const { isMobile, isTablet } = useResponsive();
  const { colors: themeColors, isDark } = useTheme();

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
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: isMobile ? 'flex-start' : 'center',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '12px' : '0',
        marginBottom: '20px',
        paddingBottom: '16px',
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
      }}>
        <div>
          <h2 style={{
            fontSize: isMobile ? '18px' : isTablet ? '20px' : '22px',
            fontWeight: '700',
            color: themeColors.text,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>📋 Recent Activities</h2>
          <p style={{
            fontSize: isMobile ? '12px' : '13px',
            color: themeColors.textSecondary,
            margin: '4px 0 0 0',
          }}>Your latest emission tracking entries</p>
        </div>
        <span style={{
          fontSize: '12px',
          color: '#10b981',
          background: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
          padding: '6px 14px',
          borderRadius: '20px',
          fontWeight: '600',
          border: '1px solid rgba(16, 185, 129, 0.2)',
        }}>Last 10</span>
      </div>

      {activities.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: isMobile ? '40px 20px' : '60px 20px',
        }}>
          <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }}>🌱</div>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            color: themeColors.text,
            margin: '0 0 8px 0',
          }}>Start Your Journey</h3>
          <p style={{ 
            fontSize: '14px', 
            color: themeColors.textSecondary,
            margin: 0,
          }}>
            Begin tracking your carbon footprint by adding your first activity
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : '1fr',
          gap: '12px',
          maxHeight: '400px',
          overflowY: 'auto',
          paddingRight: '8px',
        }}>
          {activities.slice(-10).map((activity, index) => (
            <ActivityCard key={activity.id} activity={activity} delay={index * 0.05} />
          ))}
        </div>
      )}
    </div>
  );
}

// Activity Card Component
function ActivityCard({ activity, delay }) {
  const { isMobile, isTablet } = useResponsive();
  const { colors: themeColors, isDark } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  const getScopeBadgeStyle = (scopeNumber) => {
    const configs = {
      1: { 
        bg: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2', 
        color: isDark ? '#f87171' : '#dc2626',
        border: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(220, 38, 38, 0.2)'
      },
      2: { 
        bg: isDark ? 'rgba(245, 158, 11, 0.2)' : '#fef3c7', 
        color: isDark ? '#fbbf24' : '#d97706',
        border: isDark ? 'rgba(245, 158, 11, 0.3)' : 'rgba(217, 119, 6, 0.2)'
      },
      3: { 
        bg: isDark ? 'rgba(139, 92, 246, 0.2)' : '#ede9fe', 
        color: isDark ? '#a78bfa' : '#7c3aed',
        border: isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(124, 58, 237, 0.2)'
      },
    };
    return configs[scopeNumber] || { 
      bg: themeColors.bgTertiary, 
      color: themeColors.textSecondary,
      border: themeColors.border
    };
  };

  const badgeStyle = getScopeBadgeStyle(activity.scope_number);
  const activityDate = activity.activity_date ? new Date(activity.activity_date) : new Date();

  return (
    <div
      style={{
        background: isDark 
          ? (isHovered ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)')
          : (isHovered ? 'rgba(0,0,0,0.03)' : 'rgba(0,0,0,0.01)'),
        padding: isMobile ? '12px' : '14px',
        borderRadius: '12px',
        border: `1px solid ${isDark 
          ? (isHovered ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)')
          : (isHovered ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.05)')}`,
        opacity: isVisible ? 1 : 0,
        transform: isVisible 
          ? (isHovered && !isMobile ? 'translateY(-2px)' : 'translateY(0)') 
          : 'translateY(10px)',
        transition: 'all 0.3s ease',
        cursor: 'default',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
      }}>
        <span style={{
          fontSize: isMobile ? '11px' : '12px',
          color: themeColors.textSecondary,
        }}>
          📅 {activityDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          })}
        </span>
        <span style={{
          fontSize: '10px',
          fontWeight: '600',
          padding: '3px 8px',
          borderRadius: '12px',
          background: badgeStyle.bg,
          color: badgeStyle.color,
          border: `1px solid ${badgeStyle.border}`,
        }}>
          {activity.scope || `Scope ${activity.scope_number}`}
        </span>
      </div>

      <h4 style={{
        fontSize: isMobile ? '13px' : '14px',
        fontWeight: '600',
        color: themeColors.text,
        margin: '0 0 8px 0',
        lineHeight: 1.3,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {activity.activity_name || activity.activity_type}
      </h4>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: isMobile ? '11px' : '12px',
      }}>
        <span style={{ color: themeColors.textSecondary }}>📦 {activity.quantity} {activity.unit}</span>
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'baseline',
        gap: '4px',
        marginTop: '8px',
        paddingTop: '8px',
        borderTop: `1px dashed ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
      }}>
        <span style={{
          fontSize: isMobile ? '16px' : '18px',
          fontWeight: '700',
          color: badgeStyle.color,
        }}>
          {(activity.emissions_kgco2e / 1000).toFixed(4)} t
        </span>
        <span style={{
          fontSize: isMobile ? '10px' : '11px',
          color: themeColors.textSecondary,
          fontWeight: '500',
        }}>CO2e</span>
      </div>
    </div>
  );
}


// Lifecycle Flow Component
function LifecycleFlowSection({ lifecycleData }) {
  const { isMobile, isTablet } = useResponsive();
  const { colors: themeColors, isDark } = useTheme();
  const lifecycleStyles = getStyles(themeColors);
  const { phases, summary } = lifecycleData;
  const [selectedPhase, setSelectedPhase] = useState(null);
  const [phaseActivities, setPhaseActivities] = useState([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  const phaseConfig = {
    UPSTREAM: {
      name: 'Upstream',
      icon: '⬅️',
      color: '#8B5CF6',
      lightBg: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)',
      darkBg: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.1) 100%)',
      description: 'Suppliers & Materials'
    },
    IN_PROCESS: {
      name: 'In-Process',
      icon: '⚙️',
      color: '#3B82F6',
      lightBg: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
      darkBg: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(59, 130, 246, 0.1) 100%)',
      description: 'Operations & Energy'
    },
    DOWNSTREAM: {
      name: 'Downstream',
      icon: '➡️',
      color: '#10B981',
      lightBg: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
      darkBg: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.1) 100%)',
      description: 'Distribution & Delivery'
    },
    WASTE: {
      name: 'Waste',
      icon: '♻️',
      color: '#EF4444',
      lightBg: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
      darkBg: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(239, 68, 68, 0.1) 100%)',
      description: 'Disposal & Recycling'
    }
  };

  const fetchPhaseActivities = async (phaseName) => {
    setLoadingActivities(true);
    setSelectedPhase(phaseName);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE}/dashboard/lifecycle/${phaseName}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log(`✅ ${phaseName} activities:`, response.data);
      setPhaseActivities(response.data.activities || []);
    } catch (err) {
      console.error(`❌ Failed to fetch ${phaseName} activities:`, err);
      setPhaseActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  };

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
      <h3 style={{
        fontSize: isMobile ? '18px' : isTablet ? '19px' : '20px',
        fontWeight: '700',
        color: themeColors.text,
        margin: '0 0 4px 0',
      }}>🔄 Lifecycle Emissions Flow</h3>
      <p style={{
        fontSize: isMobile ? '12px' : '14px',
        color: themeColors.textSecondary,
        margin: '0 0 20px 0',
      }}>Track emissions across your complete value chain</p>

      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '16px' : '12px',
        overflowX: isMobile ? 'visible' : 'auto',
      }}>
        {Object.entries(phaseConfig).map(([key, config], index) => {
          const phaseData = phases[key] || {};
          const percentage = summary[`${key.toLowerCase()}_percentage`] || 0;

          return (
            <div key={key} style={{
              display: 'flex',
              alignItems: 'center',
              flex: isMobile ? '1 1 100%' : '1 1 0',
              minWidth: isMobile ? '100%' : '180px',
            }}>
              <div
                style={{
                  flex: 1,
                  background: isDark ? config.darkBg : config.lightBg,
                  borderRadius: '14px',
                  padding: isMobile ? '16px' : '20px',
                  border: `1px solid ${isDark ? `${config.color}30` : `${config.color}25`}`,
                  textAlign: 'center',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{
                  fontSize: isMobile ? '32px' : '40px',
                  marginBottom: '8px',
                }}>{config.icon}</div>
                <h4 style={{
                  fontSize: isMobile ? '14px' : isTablet ? '15px' : '16px',
                  fontWeight: '700',
                  color: config.color,
                  margin: '0 0 4px 0',
                }}>{config.name}</h4>
                <p style={{
                  fontSize: isMobile ? '11px' : '12px',
                  color: themeColors.textSecondary,
                  margin: '0 0 12px 0',
                }}>{config.description}</p>

                <div>
                  <div style={{
                    fontSize: isMobile ? '22px' : isTablet ? '24px' : '28px',
                    fontWeight: '800',
                    color: config.color,
                  }}>
                    {(phaseData.total_emissions_tonnes || 0).toFixed(2)}
                  </div>
                  <div style={{
                    fontSize: isMobile ? '9px' : '10px',
                    color: themeColors.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}>tonnes CO2e</div>
                  <div style={{
                    fontSize: isMobile ? '12px' : '14px',
                    fontWeight: '600',
                    color: themeColors.text,
                    marginTop: '4px',
                    padding: '2px 10px',
                    background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    borderRadius: '12px',
                    display: 'inline-block',
                  }}>{percentage.toFixed(1)}%</div>

                  {/* Show waste weight for WASTE phase */}
                  {key === 'WASTE' && phaseData.total_weight_kg > 0 && (
                    <>
                      <div style={{
                        fontSize: isMobile ? '14px' : '16px',
                        fontWeight: '600',
                        color: themeColors.textSecondary,
                        marginTop: '8px'
                      }}>
                        {phaseData.total_weight_kg.toFixed(2)} kg
                      </div>
                      <div style={{
                        fontSize: isMobile ? '9px' : '10px',
                        color: themeColors.textTertiary
                      }}>
                        total waste
                      </div>
                    </>
                  )}
                </div>

                <div style={{
                  fontSize: isMobile ? '11px' : '12px',
                  color: themeColors.textSecondary,
                  marginTop: '12px',
                  marginBottom: '12px',
                }}>
                  {phaseData.activity_count || 0} activities
                </div>

                {/* View Details Button */}
                <button
                  style={{
                    width: '100%',
                    padding: isMobile ? '8px 12px' : '10px 16px',
                    background: config.color,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: isMobile ? '12px' : '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => fetchPhaseActivities(key)}
                  onMouseEnter={(e) => {
                    if (!isMobile) {
                      e.currentTarget.style.opacity = '0.85';
                      e.currentTarget.style.transform = 'scale(1.02)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isMobile) {
                      e.currentTarget.style.opacity = '1';
                      e.currentTarget.style.transform = 'scale(1)';
                    }
                  }}
                >
                  {isMobile ? 'View →' : 'View Activities →'}
                </button>
              </div>

              {index < 3 && !isMobile && (
                <div style={{
                  fontSize: isTablet ? '20px' : '24px',
                  color: themeColors.textTertiary,
                  padding: '0 4px',
                  flexShrink: 0,
                }}>→</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Phase Activities Modal */}
      {selectedPhase && (
        <PhaseActivitiesModal
          phase={selectedPhase}
          config={phaseConfig[selectedPhase]}
          activities={phaseActivities}
          loading={loadingActivities}
          onClose={() => {
            setSelectedPhase(null);
            setPhaseActivities([]);
          }}
        />
      )}
    </div>
  );
}

// Phase Activities Modal Component
function PhaseActivitiesModal({ phase, config, activities, loading, onClose }) {
  const { isMobile, isTablet } = useResponsive();
  const { colors } = useTheme();
  const modalStyles = getModalStyles(colors);
  
  return (
    <div style={modalStyles.overlay} onClick={onClose}>
      <div style={{
        ...modalStyles.modal,
        maxWidth: isMobile ? '95%' : isTablet ? '90%' : '1000px',
        maxHeight: isMobile ? '90vh' : '80vh',
        margin: isMobile ? '1rem' : '2rem',
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ ...modalStyles.header, background: config.color }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '2.5rem' }}>{config.icon}</span>
            <div>
              <h2 style={modalStyles.title}>{config.name} Phase</h2>
              <p style={modalStyles.subtitle}>
                {activities.length} activities
              </p>
            </div>
          </div>
          <button style={modalStyles.closeButton} onClick={onClose}>✕</button>
        </div>

        <div style={modalStyles.content}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div style={{
                width: '64px',
                height: '64px',
                border: `4px solid ${colors.bgTertiary}`,
                borderTop: `4px solid ${colors.primary}`,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px'
              }}></div>
              <p style={{ color: colors.textSecondary }}>Loading activities...</p>
            </div>
          ) : activities.length === 0 ? (
            <p style={modalStyles.emptyText}>No activities in this phase</p>
          ) : (
            <div style={modalStyles.table}>
              <div style={{
              ...modalStyles.tableHeader,
              gridTemplateColumns: isMobile 
                ? '1fr' 
                : isTablet 
                  ? '1.5fr 2fr 1fr' 
                  : '1.5fr 2fr 1fr 1.5fr 1fr',
              display: isMobile ? 'none' : 'grid',
            }}>
                <div style={modalStyles.tableCell}>Activity Type</div>
                <div style={modalStyles.tableCell}>Name</div>
                <div style={modalStyles.tableCell}>Quantity</div>
                <div style={modalStyles.tableCell}>Emissions</div>
                <div style={modalStyles.tableCell}>Date</div>
              </div>
              {activities.map((activity, index) => (
                <div key={activity.id || index} style={modalStyles.tableRow}>
                  <div style={modalStyles.tableCell}>
                    <strong>{activity.activity_type}</strong>
                  </div>
                  <div style={modalStyles.tableCell}>
                    {activity.activity_name || '-'}
                  </div>
                  <div style={modalStyles.tableCell}>
                    {activity.quantity?.toFixed(2)} {activity.unit}
                  </div>
                  <div style={{ ...modalStyles.tableCell, fontWeight: '600', color: config.color }}>
                    {(activity.emissions_kgco2e / 1000).toFixed(3)} t CO2e
                  </div>
                  <div style={modalStyles.tableCell}>
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
}

const getStyles = (colors) => ({
  content: {
    padding: '24px',
    width: '100%',
    minHeight: '100vh',
    background: colors.bgSecondary,
    transition: 'background 0.3s ease',
  },
  contentMobile: {
    padding: '16px',
  },
  heroSection: {
    background: colors.gradientPrimary,
    borderRadius: '20px',
    padding: '40px',
    marginBottom: '32px',
    position: 'relative',
    overflow: 'hidden',
    color: colors.textInverse,
  },
  heroContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    zIndex: 2,
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    fontSize: '36px',
    fontWeight: '700',
    margin: '0 0 12px 0',
    lineHeight: '1.2',
  },
  heroSubtitle: {
    fontSize: '18px',
    opacity: 0.9,
    margin: 0,
    lineHeight: '1.4',
  },
  heroStats: {
    display: 'flex',
    gap: '24px',
    marginLeft: '40px',
  },
  heroStat: {
    textAlign: 'center',
  },
  heroStatValue: {
    fontSize: '28px',
    fontWeight: '700',
    display: 'block',
    marginBottom: '4px',
  },
  heroStatLabel: {
    fontSize: '12px',
    opacity: 0.8,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  heroDecoration: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
  },
  floatingOrb1: {
    position: 'absolute',
    top: '20%',
    right: '10%',
    width: '80px',
    height: '80px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '50%',
    animation: 'float 6s ease-in-out infinite',
  },
  floatingOrb2: {
    position: 'absolute',
    top: '60%',
    right: '20%',
    width: '60px',
    height: '60px',
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '50%',
    animation: 'float 8s ease-in-out infinite reverse',
  },
  floatingOrb3: {
    position: 'absolute',
    top: '40%',
    right: '30%',
    width: '40px',
    height: '40px',
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '50%',
    animation: 'float 7s ease-in-out infinite',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
  },
  loadingSpinner: {
    marginBottom: '16px',
  },
  spinner: {
    width: '64px',
    height: '64px',
    border: '4px solid #f3f4f6',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    fontSize: '16px',
    color: colors.textSecondary,
  },
  statsGrid: {
    display: 'grid',
    marginBottom: '32px',
  },
  statCard: {
    background: colors.cardBg,
    padding: '16px',
    borderRadius: '12px',
    border: `1px solid ${colors.cardBorder}`,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: colors.cardShadow,
    transition: 'all 0.3s ease',
  },
  statCardMobile: {
    padding: '12px',
    gap: '10px',
    borderRadius: '10px',
  },
  statCardTablet: {
    padding: '14px',
    gap: '12px',
  },
  statIcon: {
    fontSize: '32px',
    flexShrink: 0,
  },
  statIconMobile: {
    fontSize: '24px',
  },
  statIconTablet: {
    fontSize: '28px',
  },
  statContent: {
    flex: 1,
    minWidth: 0,
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: colors.text,
    lineHeight: 1.2,
  },
  statValueMobile: {
    fontSize: '18px',
  },
  statValueTablet: {
    fontSize: '22px',
  },
  statLabel: {
    fontSize: '12px',
    color: colors.textSecondary,
    marginTop: '4px',
    fontWeight: '500',
  },
  statLabelMobile: {
    fontSize: '11px',
    marginTop: '2px',
  },
  statUnit: {
    fontSize: '10px',
    color: colors.textTertiary,
    marginTop: '2px',
  },
  statUnitMobile: {
    fontSize: '9px',
  },
  statPercentage: {
    fontSize: '12px',
    fontWeight: '600',
    marginTop: '4px',
  },
  statPercentageMobile: {
    fontSize: '11px',
    marginTop: '2px',
  },
  statTrend: {
    fontSize: '11px',
    fontWeight: '600',
    marginTop: '4px',
  },
  statDescription: {
    fontSize: '10px',
    color: colors.textTertiary,
    marginTop: '2px',
  },
  chartSection: {
    marginBottom: '32px',
  },
  chartsGrid: {
    marginBottom: '32px',
  },
  chartCard: {
    background: colors.cardBg,
    borderRadius: '16px',
    padding: '24px',
    border: `1px solid ${colors.cardBorder}`,
    boxShadow: colors.cardShadow,
  },
  chartCardMobile: {
    padding: '16px',
    borderRadius: '12px',
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  chartTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: colors.text,
    margin: 0,
  },
  chartBadge: {
    fontSize: '12px',
    color: colors.success,
    background: colors.primaryLight,
    padding: '4px 8px',
    borderRadius: '12px',
    fontWeight: '600',
  },
  barChartContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  barRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  barLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: colors.text,
    width: '80px',
    minWidth: '60px',
  },
  barLabelMobile: {
    fontSize: '12px',
    width: '60px',
    minWidth: '50px',
  },
  barTrack: {
    flex: 1,
    height: '32px',
    background: colors.bgTertiary,
    borderRadius: '8px',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    transition: 'width 0.5s ease',
    borderRadius: '8px',
  },
  barValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: colors.textSecondary,
    width: '120px',
    textAlign: 'right',
  },
  activitiesSection: {
    background: colors.cardBg,
    borderRadius: '16px',
    padding: '24px',
    border: `1px solid ${colors.cardBorder}`,
    boxShadow: colors.cardShadow,
  },
  activitiesSectionMobile: {
    padding: '16px',
    borderRadius: '12px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: `1px solid ${colors.border}`,
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: colors.text,
    margin: 0,
  },
  activityCount: {
    fontSize: '13px',
    color: colors.textSecondary,
    background: colors.bgTertiary,
    padding: '6px 12px',
    borderRadius: '12px',
    fontWeight: '600',
  },
  activitiesGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gap: '16px',
    maxHeight: '400px',
    overflowY: 'auto',
    paddingRight: '8px',
  },
  activityCard: {
    background: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: '12px',
    padding: '20px',
    transition: 'all 0.2s',
    cursor: 'pointer',
    boxShadow: colors.cardShadow,
  },
  activityCardMobile: {
    padding: '14px',
    borderRadius: '10px',
  },
  activityCardTablet: {
    padding: '16px',
  },
  activityCardHover: {
    transform: 'translateY(-2px)',
    boxShadow: colors.cardShadowHover,
  },
  activityHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  activityDate: {
    fontSize: '12px',
    color: colors.textSecondary,
  },
  scopeBadge: {
    padding: '4px 10px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600',
  },
  activityName: {
    fontSize: '15px',
    fontWeight: '600',
    color: colors.text,
    margin: '0 0 8px 0',
    lineHeight: '1.4',
  },
  activityDetails: {
    fontSize: '13px',
    color: colors.textSecondary,
    marginBottom: '12px',
  },
  activityFooter: {
    paddingTop: '12px',
    borderTop: `1px solid ${colors.border}`,
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
  },
  emissionsValue: {
    fontSize: '22px',
    fontWeight: '700',
    color: colors.primary,
  },
  emissionsLabel: {
    fontSize: '12px',
    color: colors.textSecondary,
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
    opacity: 0.3,
  },
  emptyText: {
    fontSize: '18px',
    fontWeight: '600',
    color: colors.text,
    marginBottom: '8px',
  },
  emptySubtext: {
    fontSize: '14px',
    color: colors.textSecondary,
  },
  lifecycleSection: {
    background: colors.cardBg,
    borderRadius: '16px',
    padding: '24px',
    border: `1px solid ${colors.cardBorder}`,
    boxShadow: colors.cardShadow,
    marginBottom: '32px',
  },
  lifecycleTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: colors.text,
    margin: '0 0 8px 0',
  },
  lifecycleSubtitle: {
    fontSize: '14px',
    color: colors.textSecondary,
    marginBottom: '24px',
  },
  lifecycleFlow: {
    display: 'flex',
    alignItems: 'stretch',
    gap: '0',
    overflowX: 'auto',
    padding: '16px 0',
  },
  lifecyclePhaseWrapper: {
    display: 'flex',
    alignItems: 'center',
    flex: '1 1 0',
    minWidth: '200px',
  },
  lifecyclePhase: {
    flex: 1,
    background: '#fafafa',
    padding: '20px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    textAlign: 'center',
    transition: 'all 0.3s',
  },
  lifecyclePhaseMobile: {
    padding: '16px',
    borderRadius: '10px',
  },
  lifecyclePhaseIcon: {
    fontSize: '40px',
    marginBottom: '12px',
  },
  lifecyclePhaseName: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 4px 0',
  },
  lifecyclePhaseDesc: {
    fontSize: '12px',
    color: '#6b7280',
    margin: '0 0 16px 0',
  },
  lifecyclePhaseData: {
    padding: '12px 0',
    borderTop: '1px solid #e5e7eb',
    borderBottom: '1px solid #e5e7eb',
    margin: '12px 0',
  },
  lifecycleEmission: {
    fontSize: '28px',
    fontWeight: '700',
    lineHeight: 1,
  },
  lifecycleUnit: {
    fontSize: '10px',
    color: '#9ca3af',
    marginTop: '4px',
  },
  lifecyclePercent: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
    marginTop: '8px',
  },
  lifecycleActivityCount: {
    fontSize: '12px',
    color: '#6b7280',
  },
  flowArrow: {
    fontSize: '32px',
    color: '#d1d5db',
    padding: '0 12px',
    flexShrink: 0,
  },
  lifecycleViewButton: {
    width: '100%',
    padding: '10px 16px',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  lifecycleViewButtonMobile: {
    padding: '8px 12px',
    fontSize: '12px',
  },
});

const getModalStyles = (colors) => ({
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '2rem'
  },
  modal: {
    backgroundColor: colors.cardBg,
    borderRadius: '16px',
    maxWidth: '1000px',
    width: '100%',
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: colors.cardShadowHover,
    overflow: 'hidden'
  },
  header: {
    padding: '1.5rem',
    color: 'white',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: '600',
    margin: 0,
    color: 'white'
  },
  subtitle: {
    fontSize: '0.875rem',
    margin: '0.25rem 0 0 0',
    opacity: 0.9
  },
  closeButton: {
    padding: '0.5rem',
    backgroundColor: 'rgba(255,255,255,0.2)',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: 'white',
    borderRadius: '6px',
    transition: 'background 0.2s'
  },
  content: {
    padding: '1.5rem',
    overflowY: 'auto',
    flex: 1,
    backgroundColor: colors.bgSecondary
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  tableHeader: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 2fr 1fr 1.5fr 1fr',
    gap: '1rem',
    padding: '0.75rem 1rem',
    backgroundColor: colors.bgTertiary,
    borderRadius: '8px',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase'
  },
  tableRow: {
    display: 'grid',
    gridTemplateColumns: '1.5fr 2fr 1fr 1.5fr 1fr',
    gap: '1rem',
    padding: '1rem',
    backgroundColor: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    fontSize: '0.875rem',
    transition: 'all 0.2s'
  },
  tableCell: {
    display: 'flex',
    alignItems: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    color: colors.text
  },
  emptyText: {
    textAlign: 'center',
    padding: '3rem',
    color: colors.textTertiary,
    fontSize: '1rem'
  }
});

export default Dashboard;