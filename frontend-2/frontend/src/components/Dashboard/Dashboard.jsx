// frontend/src/components/Dashboard/Dashboard2.jsx
import { useState, useEffect } from 'react';
import { activitiesAPI } from '../../services/api';
import DashboardLayout from './DashboardLayout';
import ResourceSummary from './ResourceSummary';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';


function Dashboard({ user }) {
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

  useEffect(() => {
    fetchActivities();
  }, []);

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
      <div style={{...styles.content, opacity: animated ? 1 : 0, transform: animated ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.8s ease, transform 0.8s ease'}}>
        {/* Hero Header */}
        <div style={styles.heroSection}>
          <div style={styles.heroContent}>
            <div style={styles.heroText}>
              <h1 style={styles.heroTitle}>
                 Welcome back, {user.username}!
              </h1>
              <p style={styles.heroSubtitle}>
                Your carbon footprint dashboard - track, analyze, and reduce emissions
              </p>
            </div>
            <div style={styles.heroStats}>
              <div style={styles.heroStat}>
                <div style={styles.heroStatValue}>{stats.count}</div>
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
        <div style={styles.statsGrid}>
          <StatCard
            icon="🌍"
            value={stats.total.toFixed(2)}
            label="Total Emissions"
            unit="tonnes CO2e"
            color="#667eea"
            trend="+2.1%"
            description="vs last month"
            delay={0}
          />
          <StatCard
            icon="🔥"
            value={stats.scope1.toFixed(2)}
            label="Scope 1"
            percentage={stats.total > 0 ? ((stats.scope1 / stats.total) * 100).toFixed(0) : 0}
            color="#ef4444"
            trend="-1.5%"
            description="direct emissions"
            delay={0.2}
          />
          <StatCard
            icon="⚡"
            value={stats.scope2.toFixed(2)}
            label="Scope 2"
            percentage={stats.total > 0 ? ((stats.scope2 / stats.total) * 100).toFixed(0) : 0}
            color="#f59e0b"
            trend="+0.8%"
            description="energy indirect"
            delay={0.4}
          />
          <StatCard
            icon="📦"
            value={stats.scope3.toFixed(2)}
            label="Scope 3"
            percentage={stats.total > 0 ? ((stats.scope3 / stats.total) * 100).toFixed(0) : 0}
            color="#8b5cf6"
            trend="+3.2%"
            description="value chain"
            delay={0.6}
          />
        </div>


        {/* Resource Summary - Energy, Water, Waste */}
        <ResourceSummary companyId={user?.company_id} />


        {/* Charts Section */}
        <div style={styles.chartsGrid}>
          {/* Scope Breakdown Bar Chart */}
          <div style={styles.chartCard}>
            <div style={styles.chartHeader}>
              <h3 style={styles.chartTitle}>📊 Emission Breakdown</h3>
              <div style={styles.chartBadge}>Real-time</div>
            </div>
            <ScopeBarChart stats={stats} />
          </div>

          {/* Scope Breakdown Donut Chart */}
          <div style={styles.chartCard}>
            <div style={styles.chartHeader}>
              <h3 style={styles.chartTitle}>🍩 Scope Distribution</h3>
              <div style={styles.chartBadge}>All Scopes</div>
            </div>
            <ScopeDonutChart stats={stats} />
          </div>
        </div>

        {/* Activities List */}
        <div style={styles.activitiesSection}>
          <div style={styles.sectionHeader}>
            <div>
              <h2 style={styles.sectionTitle}>📋 Recent Activities</h2>
              <p style={styles.sectionSubtitle}>Your latest emission tracking entries</p>
            </div>
            <div style={styles.sectionActions}>
              <span style={styles.activityCount}>Last 10</span>
            </div>
          </div>

          {activities.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyAnimation}>
                <div style={styles.emptyIcon}>🌱</div>
                <div style={styles.emptyPulse}></div>
              </div>
              <h3 style={styles.emptyTitle}>Start Your Journey</h3>
              <p style={styles.emptyText}>
                Begin tracking your carbon footprint by adding your first activity
              </p>
            </div>
          ) : (
            <div style={styles.activitiesGrid}>
              {activities.slice(-10).map((activity, index) => (
                <ActivityCard key={activity.id} activity={activity} delay={index * 0.1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// Stat Card Component
function StatCard({ icon, value, label, unit, percentage, color, trend, description, delay }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      style={{
        ...styles.statCard,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      }}
    >
      <div style={{...styles.statIcon, color: color}}>{icon}</div>
      <div style={styles.statContent}>
        <div style={styles.statValue}>{value}</div>
        <div style={styles.statLabel}>{label}</div>
        {unit && <div style={styles.statUnit}>{unit}</div>}
        {percentage && <div style={{...styles.statPercentage, color: color}}>{percentage}%</div>}
        {trend && <div style={{...styles.statTrend, color: trend.startsWith('+') ? '#10b981' : '#ef4444'}}>{trend}</div>}
        {description && <div style={styles.statDescription}>{description}</div>}
      </div>
    </div>
  );
}

// Scope Bar Chart Component
function ScopeBarChart({ stats }) {
  const total = stats.total;

  const scopes = [
    { name: 'Scope 1', value: stats.scope1, color: '#ef4444' },
    { name: 'Scope 2', value: stats.scope2, color: '#f59e0b' },
    { name: 'Scope 3', value: stats.scope3, color: '#8b5cf6' },
  ];

  return (
    <div style={styles.barChartContainer}>
      {scopes.map((scope) => {
        const percentage = total > 0 ? (scope.value / total) * 100 : 0;
        const barWidth = percentage > 0 ? `${percentage}%` : '2px';

        return (
          <div key={scope.name} style={styles.barRow}>
            <div style={styles.barLabel}>{scope.name}</div>
            <div style={styles.barTrack}>
              <div
                style={{
                  ...styles.barFill,
                  width: barWidth,
                  background: scope.color
                }}
              />
            </div>
            <div style={styles.barValue}>
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
  const total = stats.total;
  
  const scopeData = [
    { name: 'Scope 1', value: stats.scope1, color: '#ef4444', description: 'Direct Emissions' },
    { name: 'Scope 2', value: stats.scope2, color: '#f59e0b', description: 'Energy Indirect' },
    { name: 'Scope 3', value: stats.scope3, color: '#8b5cf6', description: 'Value Chain' },
  ].filter(scope => scope.value > 0);

  // If no data, show placeholder
  if (scopeData.length === 0 || total === 0) {
    return (
      <div style={styles.noDataContainer}>
        <div style={styles.noDataIcon}>📊</div>
        <p style={styles.noDataText}>No emission data available</p>
        <p style={styles.noDataSubtext}>Start tracking activities to see your breakdown</p>
      </div>
    );
  }

  // Calculate percentages
  const dataWithPercentage = scopeData.map(scope => ({
    ...scope,
    percentage: total > 0 ? (scope.value / total) * 100 : 0
  }));

  return (
    <div style={styles.donutChartContainer}>
      <div style={styles.donutChartWrapper}>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={dataWithPercentage}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
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
                    <div style={styles.tooltipContainer}>
                      <p style={{ ...styles.tooltipTitle, color: data.color }}>
                        {data.name}
                      </p>
                      <p style={styles.tooltipValue}>
                        {data.value.toFixed(2)} tonnes CO₂e
                      </p>
                      <p style={styles.tooltipPercentage}>
                        {data.percentage.toFixed(1)}% of total
                      </p>
                      <p style={styles.tooltipDescription}>
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
              style={{ fontSize: 14, fontWeight: 700, fill: '#1f2937' }}
            >
              Total
            </text>
            <text
              x="50%"
              y="58%"
              textAnchor="middle"
              dominantBaseline="middle"
              style={{ fontSize: 18, fontWeight: 800, fill: '#667eea' }}
            >
              {total.toFixed(2)}t
            </text>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div style={styles.donutLegend}>
        {dataWithPercentage.map((scope, index) => (
          <div key={scope.name} style={styles.legendItem}>
            <div style={{ ...styles.legendColor, background: scope.color }} />
            <div style={styles.legendContent}>
              <div style={styles.legendLabel}>{scope.name}</div>
              <div style={styles.legendValue}>
                {scope.percentage.toFixed(1)}% • {scope.value.toFixed(2)}t
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Activity Card Component
function ActivityCard({ activity, delay }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay * 1000);
    return () => clearTimeout(timer);
  }, [delay]);

  const getScopeBadgeColor = (scopeNumber) => {
    switch(scopeNumber) {
      case 1: return { bg: '#fee2e2', color: '#dc2626' };
      case 2: return { bg: '#fef3c7', color: '#d97706' };
      case 3: return { bg: '#ede9fe', color: '#7c3aed' };
      default: return { bg: '#e5e7eb', color: '#6b7280' };
    }
  };

  const badgeColors = getScopeBadgeColor(activity.scope_number);
  const activityDate = activity.activity_date ? new Date(activity.activity_date) : new Date();

  return (
    <div
      style={{
        ...styles.activityCard,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
        e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
      }}
    >
      <div style={styles.activityHeader}>
        <span style={styles.activityDate}>
          📅 {activityDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
          })}
        </span>
        <span style={{
          ...styles.scopeBadge,
          background: badgeColors.bg,
          color: badgeColors.color
        }}>
          {activity.scope || `Scope ${activity.scope_number}`}
        </span>
      </div>

      <h4 style={styles.activityName}>
        {activity.activity_name || activity.activity_type}
      </h4>

      <div style={styles.activityDetails}>
        <span>📦 {activity.quantity} {activity.unit}</span>
      </div>

      <div style={styles.activityFooter}>
        <span style={styles.emissionsValue}>
          {(activity.emissions_kgco2e / 1000).toFixed(4)} t
        </span>
        <span style={styles.emissionsLabel}>CO2e</span>
      </div>
    </div>
  );
}

const styles = {
  content: {
    padding: '24px',
    width: '100%',
    minHeight: '100vh',
    background: '#f9fafb',
  },
  heroSection: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '20px',
    padding: '40px',
    marginBottom: '32px',
    position: 'relative',
    overflow: 'hidden',
    color: 'white',
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
    color: '#6b7280',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '20px',
    marginBottom: '32px',
  },
  statCard: {
    background: 'white',
    padding: '24px',
    borderRadius: '16px',
    border: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  statIcon: {
    fontSize: '40px',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#1f2937',
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '13px',
    color: '#6b7280',
    marginTop: '6px',
    fontWeight: '500',
  },
  statUnit: {
    fontSize: '11px',
    color: '#9ca3af',
    marginTop: '2px',
  },
  statPercentage: {
    fontSize: '13px',
    fontWeight: '600',
    marginTop: '4px',
  },
  statTrend: {
    fontSize: '12px',
    fontWeight: '600',
    marginTop: '4px',
  },
  statDescription: {
    fontSize: '11px',
    color: '#9ca3af',
    marginTop: '2px',
  },
  chartSection: {
    marginBottom: '32px',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '24px',
    marginBottom: '32px',
  },
  chartCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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
    color: '#1f2937',
    margin: 0,
  },
  chartBadge: {
    fontSize: '12px',
    color: '#10b981',
    background: '#d1fae5',
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
  },
  barLabel: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
    width: '80px',
  },
  barTrack: {
    flex: 1,
    height: '32px',
    background: '#f3f4f6',
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
    color: '#6b7280',
    width: '120px',
    textAlign: 'right',
  },
  activitiesSection: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '16px',
    borderBottom: '1px solid #e5e7eb',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1f2937',
    margin: 0,
  },
  activityCount: {
    fontSize: '13px',
    color: '#6b7280',
    background: '#f3f4f6',
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
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
    transition: 'all 0.2s',
    cursor: 'pointer',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  activityCardHover: {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  activityHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  activityDate: {
    fontSize: '12px',
    color: '#6b7280',
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
    color: '#1f2937',
    margin: '0 0 8px 0',
    lineHeight: '1.4',
  },
  activityDetails: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '12px',
  },
  activityFooter: {
    paddingTop: '12px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    alignItems: 'baseline',
    gap: '6px',
  },
  emissionsValue: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#667eea',
  },
  emissionsLabel: {
    fontSize: '12px',
    color: '#6b7280',
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
    color: '#1f2937',
    marginBottom: '8px',
  },
  emptySubtext: {
    fontSize: '14px',
    color: '#6b7280',
  },
  // Donut Chart Styles
  donutChartContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
  },
  donutChartWrapper: {
    width: '100%',
    height: '280px',
  },
  donutLegend: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '16px',
    width: '100%',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 16px',
    background: '#f9fafb',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    minWidth: '140px',
  },
  legendColor: {
    width: '14px',
    height: '14px',
    borderRadius: '4px',
    flexShrink: 0,
  },
  legendContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  legendLabel: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1f2937',
  },
  legendValue: {
    fontSize: '11px',
    color: '#6b7280',
  },
  tooltipContainer: {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '14px 18px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
  },
  tooltipTitle: {
    margin: 0,
    fontSize: '15px',
    fontWeight: '700',
  },
  tooltipValue: {
    margin: '6px 0 0',
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
  },
  tooltipPercentage: {
    margin: '4px 0 0',
    fontSize: '13px',
    color: '#6b7280',
  },
  tooltipDescription: {
    margin: '4px 0 0',
    fontSize: '11px',
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  noDataContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    background: '#f9fafb',
    borderRadius: '12px',
    minHeight: '280px',
  },
  noDataIcon: {
    fontSize: '48px',
    marginBottom: '12px',
    opacity: 0.4,
  },
  noDataText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    margin: 0,
  },
  noDataSubtext: {
    fontSize: '13px',
    color: '#9ca3af',
    marginTop: '6px',
  },
};

export default Dashboard;
