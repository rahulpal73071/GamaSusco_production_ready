// frontend-2/frontend/src/components/Dashboard/Analytics.jsx
import React, { useState, useEffect, useRef, useCallback, useMemo, Suspense } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import DashboardLayout from './DashboardLayout';
import ResourceSummary from './ResourceSummary';
import EmissionLineChart from './LineChart';
import EmissionPieChart from './PieChart';
import { analyticsAPI, activitiesAPI } from '../../services/api';
import {
  ResponsiveContainer,
  LineChart, Line, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, ComposedChart, ScatterChart, Scatter, Cell, XAxis, YAxis,
  BarChart, Bar, Tooltip, CartesianGrid, Legend, LabelList, PieChart, Pie, Brush
} from 'recharts';

// Lazy-load chart components for performance
const LazyEmissionLineChart = React.lazy(() => Promise.resolve({ default: EmissionLineChart }));
const LazyEmissionPieChart = React.lazy(() => Promise.resolve({ default: EmissionPieChart }));

// Error Boundary Component
class ChartErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={styles.noDataChart}>
          <div style={styles.noDataIcon}>Warning</div>
          <p style={styles.noDataText}>Error rendering chart</p>
        </div>
      );
    }
    return this.props.children;
  }
}


function KPI({ icon, value, label, gradient, iconBg, iconColor }) {
  const { isMobile, isTablet } = useResponsive();
  const [isHovered, setIsHovered] = React.useState(false);
  
  return (
    <div 
      style={{
        ...styles.kpiCard,
        background: gradient,
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered 
          ? '0 16px 48px rgba(0,0,0,0.16), 0 4px 12px rgba(0,0,0,0.12)' 
          : '0 10px 40px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
        ...(isMobile ? styles.kpiCardMobile : isTablet ? styles.kpiCardTablet : {}),
      }} 
      role="group" 
      aria-label={label}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{
        ...styles.kpiIcon,
        background: iconBg,
        color: iconColor,
        transform: isHovered ? 'scale(1.1) rotate(5deg)' : 'scale(1) rotate(0deg)',
        ...(isMobile ? styles.kpiIconMobile : isTablet ? styles.kpiIconTablet : {}),
      }}>{icon}</div>
      <div style={styles.kpiContent}>
        <div style={{
          ...styles.kpiValue,
          ...(isMobile ? styles.kpiValueMobile : isTablet ? styles.kpiValueTablet : {}),
        }}>{value}</div>
        <div style={{
          ...styles.kpiLabel,
          ...(isMobile ? styles.kpiLabelMobile : {}),
        }}>{label}</div>
      </div>
    </div>
  );
}
const MemoKPI = React.memo(KPI);

function TopEmittersBar({ data }) {
  const { isMobile, isTablet } = useResponsive();
  
  if (!data || data.length === 0) {
    return (
      <div style={styles.noDataChart}>
        <div style={styles.noDataIcon}>Chart</div>
        <p style={styles.noDataText}>No emitter data</p>
      </div>
    );
  }

  const sortedData = useMemo(
    () => [...data].sort((a, b) => b.emissions - a.emissions),
    [data]
  );

  const totalEmissions = useMemo(
    () => sortedData.reduce((sum, item) => sum + item.emissions, 0),
    [sortedData]
  );

  const emittersWithPercentage = sortedData.map(item => ({
    ...item,
    percentage: totalEmissions > 0 ? (item.emissions / totalEmissions) * 100 : 0
  }));

  const colors = ["#4CAF50", "#2196F3", "#FFC107", "#FF5722", "#9C27B0"];

  const barHeight = isMobile ? 30 : isTablet ? 35 : 40;
  const chartHeight = emittersWithPercentage.length * barHeight;

  return (
    <div style={{
      padding: isMobile ? "0.5rem" : "1rem",
      maxHeight: isMobile ? 300 : 400,
      overflowY: 'auto',
    }}>
      <ResponsiveContainer width="100%" height={Math.max(chartHeight, isMobile ? 200 : 300)}>
        <BarChart
          data={emittersWithPercentage}
          layout="vertical"
          margin={{ left: 8, right: 8, top: 8, bottom: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
            stroke="#6b7280"
            fontSize={isMobile ? 10 : isTablet ? 11 : 12}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={isMobile ? 80 : isTablet ? 100 : 120}
            fontSize={isMobile ? 10 : isTablet ? 11 : 12}
            tick={{ fontSize: isMobile ? 10 : isTablet ? 11 : 12, fill: '#374151' }}
          />
          <Tooltip
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div style={{
                    background: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: 8,
                    padding: '8px 12px',
                    fontSize: 13,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}>
                    <p style={{ margin: 0, fontWeight: 600, color: '#374151' }}>{label}</p>
                    <p style={{ margin: '4px 0 0', color: '#6b7280' }}>
                      Emissions: <strong>{data.emissions.toFixed(2)} kgCO₂e</strong>
                    </p>
                    <p style={{ margin: '2px 0 0', color: '#6b7280' }}>
                      Share: <strong>{data.percentage.toFixed(2)}%</strong>
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar
            dataKey="percentage"
            radius={[0, 6, 6, 0]}
            label={{ position: "right", fontSize: 12, formatter: (value) => `${value.toFixed(5)}%` }}
          >
            {emittersWithPercentage.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={`url(#gradient${index % colors.length})`}
              />
            ))}
          </Bar>
          <defs>
            {colors.map((color, index) => (
              <linearGradient key={`gradient${index}`} id={`gradient${index}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={color} stopOpacity={0.8} />
                <stop offset="100%" stopColor={color} stopOpacity={0.4} />
              </linearGradient>
            ))}
          </defs>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
const MemoTopEmittersBar = React.memo(TopEmittersBar);

function HeatmapGrid({ heatmapData, types }) {
  const { isMobile, isTablet } = useResponsive();
  
  if (!heatmapData || heatmapData.length === 0) {
    return (
      <div style={styles.noDataChart}>
        <div style={styles.noDataIcon}>Fire</div>
        <p style={styles.noDataText}>No heatmap data</p>
      </div>
    );
  }

  const columns = types && types.length ? types : Object.keys(heatmapData[0]).filter(k => k !== 'month');
  let min = Infinity, max = -Infinity;
  heatmapData.forEach(row => {
    columns.forEach(col => {
      const v = row[col] || 0;
      if (v < min) min = v;
      if (v > max) max = v;
    });
  });
  if (min === Infinity) min = 0;
  if (max === -Infinity) max = 0;
  const scale = (val) => {
    if (max === min) return 0.12;
    return 0.12 + 0.88 * (val - min) / (max - min);
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{
        ...styles.heatmapTable,
        ...(isMobile ? styles.heatmapTableMobile : {}),
      }}>
        <div style={{
          ...styles.heatmapRow,
          ...(isMobile ? styles.heatmapRowMobile : {}),
          fontWeight: 700
        }}>
          <div style={{
            ...styles.heatmapCellHeader,
            ...(isMobile ? styles.heatmapCellHeaderMobile : {}),
          }}>Month</div>
          {columns.map(col => (
            <div key={col} style={{
              ...styles.heatmapCellHeader,
              ...(isMobile ? styles.heatmapCellHeaderMobile : {}),
            }}>
              {isMobile && col.length > 8 ? col.substring(0, 8) + '...' : col}
            </div>
          ))}
        </div>
        {heatmapData.map((row) => (
          <div key={row.month} style={{
            ...styles.heatmapRow,
            ...(isMobile ? styles.heatmapRowMobile : {}),
          }}>
            <div style={{
              ...styles.heatmapCell,
              ...(isMobile ? styles.heatmapCellMobile : {}),
            }}>{row.month}</div>
            {columns.map(col => {
              const v = row[col] || 0;
              return (
                <div
                  key={col}
                  title={`${col}: ${v.toFixed ? v.toFixed(2) : v}`}
                  style={{
                    ...styles.heatmapCell,
                    ...(isMobile ? styles.heatmapCellMobile : {}),
                    background: `rgba(99,102,241, ${scale(v)})`,
                    color: scale(v) > 0.45 ? '#fff' : '#0f172a',
                    textAlign: 'center',
                    fontWeight: 600
                  }}
                >
                  {v >= 1000 ? `${(v/1000).toFixed(1)}k` : (v.toFixed ? v.toFixed(0) : v)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
const MemoHeatmapGrid = React.memo(HeatmapGrid);

function Analytics() {
  const { user } = useAuth();
  const { isDark, colors } = useTheme();
  const { isMobile, isTablet } = useResponsive();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [timelineData, setTimelineData] = useState([]);
  const [topEmitters, setTopEmitters] = useState([]);
  const [radarViewMode, setRadarViewMode] = useState('emissions'); // 'emissions', 'scopes', 'comprehensive'
  const [activitiesData, setActivitiesData] = useState(null);
  const [scopeBreakdown, setScopeBreakdown] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const exportRef = useRef(null);
  const [selectedActivities, setSelectedActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState('');
  const [comparisonActivities, setComparisonActivities] = useState([]);
  const [comparisonActivity, setComparisonActivity] = useState('');
  const [viewMode, setViewMode] = useState('overview');
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [showActivityDropdown, setShowActivityDropdown] = useState(false);
  const [timelinePeriod, setTimelinePeriod] = useState('month');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [heatmapPeriod, setHeatmapPeriod] = useState('month');

  const companyId = user?.company_id || 1;

  // Set default date range (last 12 months) on mount
  useEffect(() => {
    if (!dateFrom || !dateTo) {
      const today = new Date();
      const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
      setDateFrom(oneYearAgo.toISOString().split('T')[0]);
      setDateTo(today.toISOString().split('T')[0]);
    }
  }, []);

  // Set current month when switching to 'day'
  useEffect(() => {
    if (timelinePeriod === 'day' && !selectedMonth) {
      const now = new Date();
      setSelectedMonth(now.toISOString().slice(0, 7));
    }
  }, [timelinePeriod, selectedMonth]);

  // Compute activities for EmissionLineChart
  const chartActivities = useMemo(() => {
    if (timelinePeriod === 'day') {
      return (activitiesData?.activities || []).filter(a =>
        a.activity_date?.startsWith(selectedMonth)
      );
    }
    // For month/year, use timelineData if available, else fall back to activities
    if (timelineData && timelineData.length > 0) {
      // Transform timelineData to match expected format for BarChart
      return timelineData.map(item => ({
        date: item.period,
        scope1: item.scope_1 || 0,
        scope2: item.scope_2 || 0,
        scope3: item.scope_3 || 0,
        total: item.total || 0
      }));
    }
    return activitiesData?.activities || [];
  }, [timelinePeriod, activitiesData, selectedMonth, timelineData]);

  useEffect(() => {
    let mounted = true;
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Determine activities params
        let activitiesParams = {};

        if (timelinePeriod === 'day') {
          if (!selectedMonth) {
            const now = new Date();
            setSelectedMonth(now.toISOString().slice(0, 7));
            return;
          }
          const [year, month] = selectedMonth.split('-');
          const startOfMonth = `${selectedMonth}-01`;
          const lastDay = new Date(year, month, 0).getDate();
          const endOfMonth = `${selectedMonth}-${lastDay.toString().padStart(2, '0')}`;
          activitiesParams = { from: startOfMonth, to: endOfMonth };
        } else {
          if (dateFrom && dateTo) {
            activitiesParams = { from: dateFrom, to: dateTo };
          } else {
            const today = new Date();
            const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
            activitiesParams = {
              from: oneYearAgo.toISOString().split('T')[0],
              to: today.toISOString().split('T')[0],
            };
          }
        }

        // Scope breakdown params (independent of timelinePeriod)
        let scopeBreakdownParams = {};
        if (dateFrom && dateTo) {
          scopeBreakdownParams = { from: dateFrom, to: dateTo };
        } else {
          const today = new Date();
          const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
          scopeBreakdownParams = {
            from: oneYearAgo.toISOString().split('T')[0],
            to: today.toISOString().split('T')[0],
          };
        }

        const [statsRes, fullTimelineRes, timelineRes, topEmittersRes, activitiesRes, scopeBreakdownRes] = await Promise.all([
          analyticsAPI.getStats(companyId).catch(() => ({ data: null })),
          analyticsAPI.getTimeline(companyId, 'month', {}).catch(() => ({ data: [] })),
          analyticsAPI.getTimeline(companyId, timelinePeriod, activitiesParams).catch(() => ({ data: [] })),
          analyticsAPI.getTopEmitters(companyId, 10).catch(() => ({ data: [] })),
          analyticsAPI.getActivitiesFiltered(companyId, activitiesParams).catch(() => ({ data: [] })),
          analyticsAPI.getScopeBreakdown(companyId, 'year', scopeBreakdownParams).catch(() => ({ data: null }))
        ]);

        if (!mounted) return;

        // Validate scopeBreakdown
        const isValidScopeBreakdown = scopeBreakdownRes?.data && (
          scopeBreakdownRes.data.scope_1?.total > 0 ||
          scopeBreakdownRes.data.scope_2?.total > 0 ||
          scopeBreakdownRes.data.scope_3?.total > 0
        );

        const timelineDataPoint = timelineRes?.data?.timeline?.[0];
        let finalScopeBreakdown;

        if (isValidScopeBreakdown) {
          finalScopeBreakdown = scopeBreakdownRes.data;
        } else if (timelineRes?.data?.timeline && timelineRes.data.timeline.length > 0) {
          const totalScope1 = timelineRes.data.timeline.reduce((sum, item) => sum + (item.scope_1 || 0), 0);
          const totalScope2 = timelineRes.data.timeline.reduce((sum, item) => sum + (item.scope_2 || 0), 0);
          const totalScope3 = timelineRes.data.timeline.reduce((sum, item) => sum + (item.scope_3 || 0), 0);
          const totalEmissions = totalScope1 + totalScope2 + totalScope3;
          finalScopeBreakdown = {
            scope_1: {
              total: totalScope1,
              percentage: totalEmissions > 0 ? (totalScope1 / totalEmissions) : 0,
              categories: []
            },
            scope_2: {
              total: totalScope2,
              percentage: totalEmissions > 0 ? (totalScope2 / totalEmissions) : 0,
              categories: []
            },
            scope_3: {
              total: totalScope3,
              percentage: totalEmissions > 0 ? (totalScope3 / totalEmissions) : 0,
              categories: []
            }
          };
        } else {
          const activities = activitiesRes.data?.activities || [];
          const total = activities.reduce((sum, act) => sum + (act.emissions_kgco2e || 0), 0);
          const scope1 = activities.filter(a => a.scope_number === 1).reduce((sum, act) => sum + (act.emissions_kgco2e || 0), 0);
          const scope2 = activities.filter(a => a.scope_number === 2).reduce((sum, act) => sum + (act.emissions_kgco2e || 0), 0);
          const scope3 = activities.filter(a => a.scope_number === 3).reduce((sum, act) => sum + (act.emissions_kgco2e || 0), 0);
          finalScopeBreakdown = {
            scope_1: { total: scope1, percentage: total > 0 ? scope1 / total : 0, categories: [] },
            scope_2: { total: scope2, percentage: total > 0 ? scope2 / total : 0, categories: [] },
            scope_3: { total: scope3, percentage: total > 0 ? scope3 / total : 0, categories: [] }
          };
        }

        // Compute peak month if not provided by API
        let finalAnalyticsData = statsRes?.data || {};
        if (!finalAnalyticsData.peak_month && fullTimelineRes?.data?.timeline && fullTimelineRes.data.timeline.length > 0) {
          // Find peak from full timeline data (unfiltered)
          const peakItem = fullTimelineRes.data.timeline.reduce((max, item) => (item.total > max.total ? item : max), fullTimelineRes.data.timeline[0]);
          finalAnalyticsData.peak_month = peakItem.period;
        }

        setAnalyticsData(finalAnalyticsData);
        setTimelineData(timelineRes?.data?.timeline || timelineRes?.data || []);
        setTopEmitters(topEmittersRes?.data?.top_emitters || topEmittersRes?.data || []);
        setActivitiesData(activitiesRes?.data || { activities: [] });
        setScopeBreakdown(finalScopeBreakdown);
      } catch (err) {
        console.error('Failed to fetch analytics data:', err);
        if (mounted) setError('Failed to load analytics data. Please try again.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchAnalyticsData();

    return () => {
      mounted = false;
    };
  }, [companyId, timelinePeriod, dateFrom, dateTo, selectedMonth]);

  const availableActivities = useMemo(() => {
    return activitiesData?.activities ? [...new Set(activitiesData.activities.map(a => a.activity_type))] : [];
  }, [activitiesData]);

  const exportToCSV = useCallback(() => {
    if (!analyticsData || !activitiesData?.activities || activitiesData.activities.length === 0) return;
    const csvData = activitiesData.activities.map(activity => ({
      'Activity Name': activity.activity_name || `${activity.activity_type} - ${activity.quantity || ''} ${activity.unit || ''}`,
      'Type': activity.activity_type,
      'Quantity': activity.quantity || 0,
      'Unit': activity.unit || '',
      'Emissions (kgCO₂e)': activity.emissions_kgco2e?.toFixed(2) || '0.00',
      'Scope': activity.scope || '',
      'Category': activity.category || 'N/A',
      'Date': activity.activity_date ? new Date(activity.activity_date).toLocaleDateString() : 'N/A'
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `emissions-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    setShowExportMenu(false);
  }, [analyticsData, activitiesData]);

  const exportToJSON = useCallback(() => {
    if (!analyticsData || !activitiesData?.activities) return;

    const exportData = {
      summary: analyticsData,
      activities: activitiesData.activities,
      timeline: timelineData,
      topEmitters,
      scopeBreakdown,
      exportDate: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `emissions-analytics-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    setShowExportMenu(false);
  }, [analyticsData, activitiesData, timelineData, topEmitters, scopeBreakdown]);

  const preparedScopeComparison = useMemo(() => {
    if (!scopeBreakdown) return [];
    return [
      { scope: 'Scope 1', emissions: Number(scopeBreakdown.scope_1?.total || 0) / 1000, percentage: Number(scopeBreakdown.scope_1?.percentage || 0) },
      { scope: 'Scope 2', emissions: Number(scopeBreakdown.scope_2?.total || 0) / 1000, percentage: Number(scopeBreakdown.scope_2?.percentage || 0) },
      { scope: 'Scope 3', emissions: Number(scopeBreakdown.scope_3?.total || 0) / 1000, percentage: Number(scopeBreakdown.scope_3?.percentage || 0) }
    ];
  }, [scopeBreakdown]);

  const preparedHeatmap = useMemo(() => {
    if (!activitiesData?.activities) return [];
    const heatmap = {};
    activitiesData.activities.forEach(activity => {
      const date = new Date(activity.activity_date);
      let period;
      if (heatmapPeriod === 'week') {
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        period = startOfWeek.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      } else {
        period = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
      const type = activity.activity_type || 'Other';
      if (!heatmap[period]) heatmap[period] = {};
      if (!heatmap[period][type]) heatmap[period][type] = 0;
      heatmap[period][type] += activity.emissions_kgco2e || 0;
    });
    const result = Object.entries(heatmap).map(([period, types]) => ({ month: period, ...types }));
    return result.sort((a, b) => new Date(b.month) - new Date(a.month));
  }, [activitiesData, heatmapPeriod]);

  const topEmittersBarData = useMemo(() => {
    if (!topEmitters || topEmitters.length === 0) return [];
    return topEmitters.map(t => ({ name: t.name || t.activity_type || 'Unknown', emissions: t.emissions_kgco2e || t.emissions || 0 }));
  }, [topEmitters]);

  const preparedPieData = useMemo(() => {
    if (!selectedActivities || selectedActivities.length === 0 || !activitiesData?.activities) return [];
    const filteredActivities = activitiesData.activities.filter(a => selectedActivities.includes(a.activity_type));
    const categoryMap = {};
    filteredActivities.forEach(activity => {
      const category = activity.category || 'Other';
      if (!categoryMap[category]) categoryMap[category] = 0;
      categoryMap[category] += activity.emissions_kgco2e || 0;
    });
    return Object.entries(categoryMap).map(([name, emissions]) => ({
      name,
      value: emissions / 1000 // Convert to tonnes
    }));
  }, [selectedActivities, activitiesData]);

  const preparedComparisonChartData = useMemo(() => {
    if (!selectedActivity || !comparisonActivities || comparisonActivities.length === 0 || !activitiesData?.activities) return [];
    const selectedEmissions = activitiesData.activities
      .filter(a => a.activity_type === selectedActivity)
      .reduce((sum, a) => sum + (a.emissions_kgco2e || 0), 0) / 1000;
    const data = [{ name: selectedActivity, emissions: selectedEmissions }];
    comparisonActivities.forEach(activity => {
      const emissions = activitiesData.activities
        .filter(a => a.activity_type === activity)
        .reduce((sum, a) => sum + (a.emissions_kgco2e || 0), 0) / 1000;
      data.push({ name: activity, emissions });
    });
    return data;
  }, [selectedActivity, comparisonActivities, activitiesData]);

  const hasData = useMemo(() => {
    return analyticsData && (
      (analyticsData.total_emissions_tonnes > 0 || analyticsData.total_emissions_kg > 0) ||
      (timelineData && timelineData.length > 0) ||
      (activitiesData && activitiesData.activities && activitiesData.activities.length > 0)
    );
  }, [analyticsData, timelineData, activitiesData]);

  const ChartSkeleton = () => (
    <div style={{ ...styles.noDataChart, alignItems: 'flex-start', padding: 12 }}>
      <div style={{ width: '100%', height: 12, background: '#f3f4f6', borderRadius: 6, marginBottom: 8 }} />
      <div style={{ width: '80%', height: 12, background: '#f3f4f6', borderRadius: 6, marginBottom: 8 }} />
      <div style={{ width: '60%', height: 12, background: '#f3f4f6', borderRadius: 6, marginTop: 6 }} />
    </div>
  );

  const toggleExportMenu = useCallback(() => setShowExportMenu(s => !s), []);
  const openComparison = useCallback(() => setShowComparisonModal(true), []);
  const closeComparison = useCallback(() => { setShowComparisonModal(false); setComparisonActivity(''); }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner} />
          <p style={{ marginTop: 12, color: '#6b7280' }}>Fetching analytics...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div style={styles.centerFallback}>
          <div style={{ fontSize: 48 }}>Warning</div>
          <h2 style={{ marginTop: 8 }}>Error Loading Analytics</h2>
          <p style={{ color: '#6b7280' }}>{error}</p>
          <button onClick={() => window.location.reload()} style={styles.retryBtn}>
            Reload
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={{
        ...styles.analyticsContainer,
        ...(isMobile ? styles.analyticsContainerMobile : {}),
      }}>
        <div style={{
          ...styles.header,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '16px' : '0',
        }}>
          <div>
            <h1 style={{
              ...styles.title,
              fontSize: isMobile ? '28px' : isTablet ? '32px' : '36px',
            }}>Analytics</h1>
            <p style={{
              ...styles.subtitle,
              fontSize: isMobile ? '14px' : '16px',
            }}>Detailed insights and trends of your carbon emissions</p>
          </div>
          <div style={styles.exportContainer}>
            <div style={styles.filtersRow}>
              <div style={styles.exportButtonContainer} ref={exportRef}>
                <button onClick={toggleExportMenu} style={styles.exportButton}>Export</button>
                {showExportMenu && (
                  <div style={styles.exportMenu}>
                    <button onClick={exportToCSV} style={styles.exportMenuItem}>Export as CSV</button>
                    <button onClick={exportToJSON} style={styles.exportMenuItem}>Export as JSON</button>
                  </div>
                )}
              </div>
            </div>
          </div>
          </div>
        </div>

        {!hasData ? (
          <div style={styles.noDataWrapper}>
            <div style={styles.noDataInner}>
              <div style={{ fontSize: 72, opacity: 0.15 }}>Chart</div>
              <h2>No Data Available</h2>
              <p style={{ color: '#6b7280', maxWidth: 560 }}>
                Start tracking activities to populate analytics. Use the add activity form or import your historical activities.
              </p>
            </div>
          </div>
        ) : (
          <div style={styles.chartsGrid}>
          <div style={{
            ...styles.kpiGrid,
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: isMobile ? '12px' : '20px',
          }}>
            <MemoKPI 
              icon="🌍" 
              value={analyticsData?.total_emissions_tonnes?.toFixed(2) || '0.00'} 
              label="Total Emissions" 
              gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
              iconBg="rgba(255, 255, 255, 0.25)"
              iconColor="#ffffff"
            />
            <MemoKPI 
              icon="📊" 
              value={analyticsData?.total_activities || 0} 
              label="Activities Tracked" 
              gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
              iconBg="rgba(255, 255, 255, 0.25)"
              iconColor="#ffffff"
            />
            <MemoKPI 
              icon="📈" 
              value={analyticsData?.total_activities > 0 ? (analyticsData.total_emissions_tonnes / analyticsData.total_activities).toFixed(2) : '0.00'} 
              label="Avg per Activity" 
              gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
              iconBg="rgba(255, 255, 255, 0.25)"
              iconColor="#ffffff"
            />
            <MemoKPI 
              icon="📅" 
              value={analyticsData?.peak_month ? new Date(analyticsData.peak_month).toLocaleString('default', { month: 'long', year: 'numeric' }) : '—'} 
              label="Peak Emission Month" 
              gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
              iconBg="rgba(255, 255, 255, 0.25)"
              iconColor="#ffffff"
            />
          </div>

          {/* Scope Distribution & Category Breakdown Charts */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: isMobile ? '16px' : '24px',
          }}>
            {/* Scope Distribution Donut Chart */}
            <div style={{
              background: isDark 
                ? 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)' 
                : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: isMobile ? '14px' : '16px',
              padding: isMobile ? '16px' : isTablet ? '20px' : '24px',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
              boxShadow: isDark 
                ? '0 8px 24px rgba(0,0,0,0.3)' 
                : '0 8px 24px rgba(0,0,0,0.06)',
              minHeight: 'auto',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}>
                <h3 style={{
                  fontSize: isMobile ? '18px' : isTablet ? '19px' : '20px',
                  fontWeight: 700,
                  color: colors.text,
                  margin: 0,
                }}>🍩 Scope Distribution</h3>
                <div style={{
                  padding: '6px 12px',
                  background: isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(139, 92, 246, 0.1)',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: isDark ? '#a78bfa' : '#7c3aed',
                }}>All Scopes</div>
              </div>
              {(() => {
                const isEmpty = preparedScopeComparison.every(item => item.emissions === 0);
                if (isEmpty) {
                  return (
                    <div style={styles.noDataChart}>
                      <div style={styles.noDataIcon}>🍩</div>
                      <p style={styles.noDataText}>No scope data available</p>
                    </div>
                  );
                }

                const totalEmissions = preparedScopeComparison.reduce((sum, s) => sum + s.emissions, 0);
                const scopeData = [
                  { name: 'Scope 1', value: preparedScopeComparison[0]?.emissions || 0, color: '#ef4444', description: 'Direct Emissions' },
                  { name: 'Scope 2', value: preparedScopeComparison[1]?.emissions || 0, color: '#f59e0b', description: 'Energy Indirect' },
                  { name: 'Scope 3', value: preparedScopeComparison[2]?.emissions || 0, color: '#8b5cf6', description: 'Value Chain' },
                ].filter(scope => scope.value > 0);

                const dataWithPercentage = scopeData.map(scope => ({
                  ...scope,
                  percentage: totalEmissions > 0 ? (scope.value / totalEmissions) * 100 : 0
                }));

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                    <ResponsiveContainer width="100%" height={isMobile ? 200 : 240}>
                      <PieChart>
                        <Pie
                          data={dataWithPercentage}
                          cx="50%"
                          cy="50%"
                          innerRadius={isMobile ? 45 : 55}
                          outerRadius={isMobile ? 75 : 90}
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
                                  background: isDark ? '#1e293b' : '#ffffff',
                                  border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                                  borderRadius: 12,
                                  padding: '12px 16px',
                                  boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.12)',
                                }}>
                                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: data.color }}>
                                    {data.name}
                                  </p>
                                  <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600, color: colors.text }}>
                                    {data.value.toFixed(2)} tonnes CO₂e
                                  </p>
                                  <p style={{ margin: '2px 0 0', fontSize: 12, color: colors.textSecondary }}>
                                    {data.percentage.toFixed(1)}% of total
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <text
                          x="50%"
                          y="45%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          style={{ fontSize: 12, fontWeight: 700, fill: colors.text }}
                        >
                          Total
                        </text>
                        <text
                          x="50%"
                          y="58%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          style={{ fontSize: 16, fontWeight: 800, fill: '#667eea' }}
                        >
                          {totalEmissions.toFixed(2)}t
                        </text>
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Legend */}
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      gap: 10,
                      width: '100%',
                    }}>
                      {dataWithPercentage.map((scope) => (
                        <div key={scope.name} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '8px 12px',
                          background: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb',
                          borderRadius: 10,
                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
                        }}>
                          <div style={{
                            width: 12,
                            height: 12,
                            borderRadius: 3,
                            background: scope.color,
                            flexShrink: 0,
                          }} />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: colors.text }}>{scope.name}</div>
                            <div style={{ fontSize: 10, color: colors.textSecondary }}>
                              {scope.percentage.toFixed(1)}% • {scope.value.toFixed(2)}t
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Category Breakdown Donut Chart */}
            <div style={{
              background: isDark 
                ? 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)' 
                : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
              borderRadius: isMobile ? '14px' : '16px',
              padding: isMobile ? '16px' : isTablet ? '20px' : '24px',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
              boxShadow: isDark 
                ? '0 8px 24px rgba(0,0,0,0.3)' 
                : '0 8px 24px rgba(0,0,0,0.06)',
              minHeight: 'auto',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
              }}>
                <h3 style={{
                  fontSize: isMobile ? '18px' : isTablet ? '19px' : '20px',
                  fontWeight: 700,
                  color: colors.text,
                  margin: 0,
                }}>📊 Category Breakdown</h3>
                <div style={{
                  padding: '6px 12px',
                  background: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.1)',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: isDark ? '#60a5fa' : '#2563eb',
                }}>By Activity</div>
              </div>
              {(() => {
                // Group activities by category/activity_type
                if (!activitiesData?.activities || activitiesData.activities.length === 0) {
                  return (
                    <div style={styles.noDataChart}>
                      <div style={styles.noDataIcon}>📊</div>
                      <p style={styles.noDataText}>No category data available</p>
                    </div>
                  );
                }

                // Aggregate emissions by activity type
                const categoryMap = {};
                activitiesData.activities.forEach(activity => {
                  const category = activity.activity_type || activity.category || 'Other';
                  if (!categoryMap[category]) {
                    categoryMap[category] = 0;
                  }
                  categoryMap[category] += (activity.emissions_kgco2e || 0) / 1000; // Convert to tonnes
                });

                // Convert to array and sort by emissions
                const categoryData = Object.entries(categoryMap)
                  .map(([name, value]) => ({ name, value }))
                  .sort((a, b) => b.value - a.value)
                  .slice(0, 6); // Top 6 categories

                if (categoryData.length === 0 || categoryData.every(c => c.value === 0)) {
                  return (
                    <div style={styles.noDataChart}>
                      <div style={styles.noDataIcon}>📊</div>
                      <p style={styles.noDataText}>No category data available</p>
                    </div>
                  );
                }

                const totalEmissions = categoryData.reduce((sum, c) => sum + c.value, 0);
                const categoryColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                
                const dataWithDetails = categoryData.map((cat, index) => ({
                  ...cat,
                  color: categoryColors[index % categoryColors.length],
                  percentage: totalEmissions > 0 ? (cat.value / totalEmissions) * 100 : 0
                }));

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                    <ResponsiveContainer width="100%" height={isMobile ? 200 : 240}>
                      <PieChart>
                        <Pie
                          data={dataWithDetails}
                          cx="50%"
                          cy="50%"
                          innerRadius={isMobile ? 45 : 55}
                          outerRadius={isMobile ? 75 : 90}
                          paddingAngle={2}
                          dataKey="value"
                          animationBegin={0}
                          animationDuration={800}
                        >
                          {dataWithDetails.map((entry, index) => (
                            <Cell 
                              key={`cat-cell-${index}`} 
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
                                  background: isDark ? '#1e293b' : '#ffffff',
                                  border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                                  borderRadius: 12,
                                  padding: '12px 16px',
                                  boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.12)',
                                }}>
                                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: data.color }}>
                                    {data.name}
                                  </p>
                                  <p style={{ margin: '4px 0 0', fontSize: 13, fontWeight: 600, color: colors.text }}>
                                    {data.value.toFixed(2)} tonnes CO₂e
                                  </p>
                                  <p style={{ margin: '2px 0 0', fontSize: 12, color: colors.textSecondary }}>
                                    {data.percentage.toFixed(1)}% of total
                                  </p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <text
                          x="50%"
                          y="45%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          style={{ fontSize: 12, fontWeight: 700, fill: colors.text }}
                        >
                          Categories
                        </text>
                        <text
                          x="50%"
                          y="58%"
                          textAnchor="middle"
                          dominantBaseline="middle"
                          style={{ fontSize: 16, fontWeight: 800, fill: isDark ? '#60a5fa' : '#3b82f6' }}
                        >
                          {categoryData.length}
                        </text>
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Legend */}
                    <div style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      gap: 8,
                      width: '100%',
                    }}>
                      {dataWithDetails.map((cat) => (
                        <div key={cat.name} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 10px',
                          background: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb',
                          borderRadius: 8,
                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
                        }}>
                          <div style={{
                            width: 10,
                            height: 10,
                            borderRadius: 3,
                            background: cat.color,
                            flexShrink: 0,
                          }} />
                          <div style={{ fontSize: 11, fontWeight: 500, color: colors.text }}>
                            {cat.name.length > 12 ? cat.name.substring(0, 12) + '...' : cat.name}
                          </div>
                          <div style={{ fontSize: 10, color: colors.textSecondary }}>
                            {cat.percentage.toFixed(0)}%
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Top 5 Emitters Bar Chart */}
          <div style={{
            background: isDark 
              ? 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)' 
              : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: isMobile ? '14px' : '16px',
            padding: isMobile ? '16px' : isTablet ? '20px' : '24px',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            boxShadow: isDark 
              ? '0 8px 24px rgba(0,0,0,0.3)' 
              : '0 8px 24px rgba(0,0,0,0.06)',
            marginTop: isMobile ? '16px' : '24px',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}>
              <h3 style={{
                fontSize: isMobile ? '18px' : isTablet ? '19px' : '20px',
                fontWeight: 700,
                color: colors.text,
                margin: 0,
              }}>🏆 Top 5 Emitters</h3>
              <div style={{
                padding: '6px 12px',
                background: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                color: isDark ? '#f87171' : '#dc2626',
              }}>By Emissions</div>
            </div>
            {(() => {
              // Get top 5 emitters from activities
              if (!activitiesData?.activities || activitiesData.activities.length === 0) {
                return (
                  <div style={styles.noDataChart}>
                    <div style={styles.noDataIcon}>🏆</div>
                    <p style={styles.noDataText}>No emitter data available</p>
                  </div>
                );
              }

              // Aggregate emissions by activity name/type
              const emitterMap = {};
              activitiesData.activities.forEach(activity => {
                const name = activity.activity_name || activity.activity_type || 'Unknown';
                if (!emitterMap[name]) {
                  emitterMap[name] = 0;
                }
                emitterMap[name] += (activity.emissions_kgco2e || 0) / 1000; // Convert to tonnes
              });

              // Get top 5 emitters
              const top5Emitters = Object.entries(emitterMap)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value)
                .slice(0, 5);

              if (top5Emitters.length === 0 || top5Emitters.every(e => e.value === 0)) {
                return (
                  <div style={styles.noDataChart}>
                    <div style={styles.noDataIcon}>🏆</div>
                    <p style={styles.noDataText}>No emitter data available</p>
                  </div>
                );
              }

              const totalEmissions = Object.values(emitterMap).reduce((sum, val) => sum + val, 0);
              const barColors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];

              const dataWithPercentage = top5Emitters.map((emitter, index) => ({
                ...emitter,
                percentage: totalEmissions > 0 ? (emitter.value / totalEmissions) * 100 : 0,
                fill: barColors[index % barColors.length],
                shortName: emitter.name.length > 15 ? emitter.name.substring(0, 15) + '...' : emitter.name,
              }));

              return (
                <div style={{ width: '100%', paddingTop: 16 }}>
                  <ResponsiveContainer width="100%" height={isMobile ? 280 : 320}>
                    <BarChart
                      data={dataWithPercentage}
                      margin={{ top: 20, right: 30, left: 20, bottom: isMobile ? 80 : 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e5e7eb'} />
                      <XAxis 
                        dataKey="shortName" 
                        stroke={colors.textSecondary}
                        fontSize={isMobile ? 10 : 12}
                        angle={isMobile ? -45 : -30}
                        textAnchor="end"
                        height={isMobile ? 80 : 60}
                        interval={0}
                      />
                      <YAxis 
                        stroke={colors.textSecondary}
                        fontSize={isMobile ? 10 : 12}
                        label={{ 
                          value: 'Emissions (tonnes CO₂e)', 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { fontSize: isMobile ? 10 : 12, fill: colors.textSecondary }
                        }}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload[0]) {
                            const data = payload[0].payload;
                            return (
                              <div style={{
                                background: isDark ? '#1e293b' : '#ffffff',
                                border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                                borderRadius: 12,
                                padding: '14px 18px',
                                boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.12)',
                              }}>
                                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: data.fill }}>
                                  {data.name}
                                </p>
                                <p style={{ margin: '6px 0 0', fontSize: 14, fontWeight: 600, color: colors.text }}>
                                  {data.value.toFixed(2)} tonnes CO₂e
                                </p>
                                <p style={{ margin: '4px 0 0', fontSize: 13, color: colors.textSecondary }}>
                                  {data.percentage.toFixed(1)}% of total emissions
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        radius={[6, 6, 0, 0]}
                        animationDuration={800}
                      >
                        {dataWithPercentage.map((entry, index) => (
                          <Cell key={`bar-${index}`} fill={entry.fill} />
                        ))}
                        <LabelList 
                          dataKey="percentage" 
                          position="top" 
                          formatter={(value) => `${value.toFixed(1)}%`}
                          style={{ 
                            fontSize: isMobile ? 10 : 12, 
                            fontWeight: 600, 
                            fill: colors.text 
                          }}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Summary Stats */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: isMobile ? 12 : 24,
                    marginTop: 16,
                    paddingTop: 16,
                    borderTop: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                    flexWrap: 'wrap',
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: colors.text }}>
                        {top5Emitters.reduce((sum, e) => sum + e.value, 0).toFixed(2)}t
                      </div>
                      <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Top 5 Total</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: isDark ? '#818cf8' : '#667eea' }}>
                        {totalEmissions > 0 ? ((top5Emitters.reduce((sum, e) => sum + e.value, 0) / totalEmissions) * 100).toFixed(1) : 0}%
                      </div>
                      <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Of All Emissions</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: isDark ? '#f87171' : '#ef4444' }}>
                        {dataWithPercentage[0]?.name?.substring(0, 10) || '-'}
                      </div>
                      <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Highest Emitter</div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Monthly Emissions by Scope - Stacked Bar Chart */}
          <div style={{
            background: isDark 
              ? 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)' 
              : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: isMobile ? '14px' : '16px',
            padding: isMobile ? '16px' : isTablet ? '20px' : '24px',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            boxShadow: isDark 
              ? '0 8px 24px rgba(0,0,0,0.3)' 
              : '0 8px 24px rgba(0,0,0,0.06)',
            marginTop: isMobile ? '16px' : '24px',
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
            }}>
              <h3 style={{
                fontSize: isMobile ? '18px' : isTablet ? '19px' : '20px',
                fontWeight: 700,
                color: colors.text,
                margin: 0,
              }}>📅 Monthly Emissions by Scope</h3>
              <div style={{
                padding: '6px 12px',
                background: isDark ? 'rgba(16, 185, 129, 0.2)' : 'rgba(16, 185, 129, 0.1)',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                color: isDark ? '#34d399' : '#059669',
              }}>Scope Breakdown</div>
            </div>
            {(() => {
              // Get monthly emissions grouped by scope
              if (!activitiesData?.activities || activitiesData.activities.length === 0) {
                return (
                  <div style={styles.noDataChart}>
                    <div style={styles.noDataIcon}>📅</div>
                    <p style={styles.noDataText}>No monthly data available</p>
                  </div>
                );
              }

              // Group activities by month and scope
              const monthlyData = {};
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              
              activitiesData.activities.forEach(activity => {
                // Use activity_date if available, otherwise created_at
                const activityDate = activity.activity_date || activity.date || activity.created_at;
                const date = new Date(activityDate);
                
                // Skip if date is invalid
                if (isNaN(date.getTime())) {
                  console.warn('Invalid date for activity:', activity);
                  return;
                }
                
                const monthYear = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                
                if (!monthlyData[monthKey]) {
                  monthlyData[monthKey] = {
                    month: monthYear,
                    sortKey: monthKey,
                    scope1: 0,
                    scope2: 0,
                    scope3: 0,
                    total: 0
                  };
                }
                
                const emissions = (activity.emissions_kgco2e || 0) / 1000; // Convert to tonnes
                
                // FIX: Use scope_number instead of scope (scope_number is 1, 2, or 3)
                const scopeNumber = activity.scope_number;
                
                if (scopeNumber === 1) {
                  monthlyData[monthKey].scope1 += emissions;
                } else if (scopeNumber === 2) {
                  monthlyData[monthKey].scope2 += emissions;
                } else if (scopeNumber === 3) {
                  monthlyData[monthKey].scope3 += emissions;
                } else {
                  // Fallback: try to parse from scope string if scope_number is missing
                  const scopeStr = String(activity.scope || '').toLowerCase();
                  if (scopeStr.includes('scope 1') || scopeStr.includes('scope1')) {
                    monthlyData[monthKey].scope1 += emissions;
                  } else if (scopeStr.includes('scope 2') || scopeStr.includes('scope2')) {
                    monthlyData[monthKey].scope2 += emissions;
                  } else if (scopeStr.includes('scope 3') || scopeStr.includes('scope3')) {
                    monthlyData[monthKey].scope3 += emissions;
                  } else {
                    // Default to scope 3 if unclear (but log warning)
                    console.warn('Unknown scope for activity:', activity.scope, activity.scope_number, activity);
                    monthlyData[monthKey].scope3 += emissions;
                  }
                }
                
                monthlyData[monthKey].total += emissions;
              });

              // Convert to array and sort by date
              const chartData = Object.values(monthlyData)
                .sort((a, b) => a.sortKey.localeCompare(b.sortKey))
                .slice(-12); // Last 12 months

              if (chartData.length === 0) {
                return (
                  <div style={styles.noDataChart}>
                    <div style={styles.noDataIcon}>📅</div>
                    <p style={styles.noDataText}>No monthly data available</p>
                  </div>
                );
              }

              const scopeColors = {
                scope1: '#ef4444',
                scope2: '#f59e0b', 
                scope3: '#8b5cf6'
              };

              return (
                <div style={{ width: '100%', paddingTop: 16 }}>
                  <ResponsiveContainer width="100%" height={isMobile ? 300 : 350}>
                    <BarChart
                      data={chartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: isMobile ? 60 : 40 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e5e7eb'} />
                      <XAxis 
                        dataKey="month" 
                        stroke={colors.textSecondary}
                        fontSize={isMobile ? 10 : 12}
                        angle={isMobile ? -45 : 0}
                        textAnchor={isMobile ? "end" : "middle"}
                        height={isMobile ? 60 : 40}
                        interval={0}
                      />
                      <YAxis 
                        stroke={colors.textSecondary}
                        fontSize={isMobile ? 10 : 12}
                        label={{ 
                          value: 'Emissions (tonnes CO₂e)', 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { fontSize: isMobile ? 10 : 12, fill: colors.textSecondary }
                        }}
                      />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length > 0) {
                            const data = payload[0].payload;
                            return (
                              <div style={{
                                background: isDark ? '#1e293b' : '#ffffff',
                                border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                                borderRadius: 12,
                                padding: '14px 18px',
                                boxShadow: isDark ? '0 8px 24px rgba(0,0,0,0.4)' : '0 8px 24px rgba(0,0,0,0.12)',
                              }}>
                                <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: colors.text }}>
                                  {label}
                                </p>
                                <div style={{ marginTop: 8 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <div style={{ width: 12, height: 12, background: '#ef4444', borderRadius: 3 }} />
                                    <span style={{ fontSize: 13, color: colors.textSecondary }}>Scope 1:</span>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{data.scope1.toFixed(2)}t</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <div style={{ width: 12, height: 12, background: '#f59e0b', borderRadius: 3 }} />
                                    <span style={{ fontSize: 13, color: colors.textSecondary }}>Scope 2:</span>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{data.scope2.toFixed(2)}t</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <div style={{ width: 12, height: 12, background: '#8b5cf6', borderRadius: 3 }} />
                                    <span style={{ fontSize: 13, color: colors.textSecondary }}>Scope 3:</span>
                                    <span style={{ fontSize: 13, fontWeight: 600, color: colors.text }}>{data.scope3.toFixed(2)}t</span>
                                  </div>
                                  <div style={{ borderTop: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`, marginTop: 8, paddingTop: 8 }}>
                                    <span style={{ fontSize: 14, fontWeight: 700, color: isDark ? '#818cf8' : '#667eea' }}>Total: {data.total.toFixed(2)}t</span>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: 16 }}
                        formatter={(value) => {
                          const labels = { scope1: 'Scope 1 (Direct)', scope2: 'Scope 2 (Energy)', scope3: 'Scope 3 (Value Chain)' };
                          return <span style={{ fontSize: 12, color: colors.textSecondary }}>{labels[value]}</span>;
                        }}
                      />
                      <Bar 
                        dataKey="scope1" 
                        stackId="emissions"
                        fill={scopeColors.scope1}
                        radius={[0, 0, 0, 0]}
                        animationDuration={800}
                      />
                      <Bar 
                        dataKey="scope2" 
                        stackId="emissions"
                        fill={scopeColors.scope2}
                        radius={[0, 0, 0, 0]}
                        animationDuration={800}
                      />
                      <Bar 
                        dataKey="scope3" 
                        stackId="emissions"
                        fill={scopeColors.scope3}
                        radius={[4, 4, 0, 0]}
                        animationDuration={800}
                      />
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Monthly Summary */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
                    gap: 16,
                    marginTop: 20,
                    paddingTop: 20,
                    borderTop: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                  }}>
                    <div style={{
                      textAlign: 'center',
                      padding: '12px',
                      background: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fef2f2',
                      borderRadius: 12,
                      border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.3)' : '#fecaca'}`,
                    }}>
                      <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: isDark ? '#f87171' : '#ef4444' }}>
                        {chartData.reduce((sum, m) => sum + m.scope1, 0).toFixed(2)}t
                      </div>
                      <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Total Scope 1</div>
                    </div>
                    <div style={{
                      textAlign: 'center',
                      padding: '12px',
                      background: isDark ? 'rgba(245, 158, 11, 0.15)' : '#fffbeb',
                      borderRadius: 12,
                      border: `1px solid ${isDark ? 'rgba(245, 158, 11, 0.3)' : '#fde68a'}`,
                    }}>
                      <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: isDark ? '#fbbf24' : '#f59e0b' }}>
                        {chartData.reduce((sum, m) => sum + m.scope2, 0).toFixed(2)}t
                      </div>
                      <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Total Scope 2</div>
                    </div>
                    <div style={{
                      textAlign: 'center',
                      padding: '12px',
                      background: isDark ? 'rgba(139, 92, 246, 0.15)' : '#f5f3ff',
                      borderRadius: 12,
                      border: `1px solid ${isDark ? 'rgba(139, 92, 246, 0.3)' : '#ddd6fe'}`,
                    }}>
                      <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: isDark ? '#a78bfa' : '#8b5cf6' }}>
                        {chartData.reduce((sum, m) => sum + m.scope3, 0).toFixed(2)}t
                      </div>
                      <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Total Scope 3</div>
                    </div>
                    <div style={{
                      textAlign: 'center',
                      padding: '12px',
                      background: isDark ? 'rgba(2, 132, 199, 0.15)' : '#f0f9ff',
                      borderRadius: 12,
                      border: `1px solid ${isDark ? 'rgba(2, 132, 199, 0.3)' : '#bae6fd'}`,
                    }}>
                      <div style={{ fontSize: isMobile ? 18 : 22, fontWeight: 800, color: isDark ? '#38bdf8' : '#0284c7' }}>
                        {chartData.reduce((sum, m) => sum + m.total, 0).toFixed(2)}t
                      </div>
                      <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Grand Total</div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Resource Consumption Overview - 3 KPI Cards */}
          <div style={{ marginTop: isMobile ? '16px' : '24px' }}>
            <ResourceSummary companyId={user?.company_id} />
          </div>

          {/* Enhanced Activity Visualization */}
          <div style={{
            background: isDark 
              ? 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)' 
              : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: isMobile ? '16px' : '20px',
            padding: isMobile ? '20px' : '28px',
            boxShadow: isDark 
              ? '0 10px 40px rgba(0,0,0,0.4)' 
              : '0 10px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
          }}>
            {/* Header with gradient accent */}
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'flex-start' : 'center',
              gap: isMobile ? '16px' : '0',
              marginBottom: '24px',
              paddingBottom: '20px',
              borderBottom: `2px solid ${isDark ? '#334155' : '#f1f5f9'}`,
            }}>
              <div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '8px',
                }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 24,
                    boxShadow: '0 4px 14px rgba(102, 126, 234, 0.4)',
                  }}>📊</div>
                  <div>
                    <h3 style={{
                      fontSize: isMobile ? '20px' : '24px',
                      fontWeight: 800,
                      color: colors.text,
                      margin: 0,
                      letterSpacing: '-0.5px',
                    }}>Activity Visualization</h3>
                    <p style={{
                      fontSize: '13px',
                      color: colors.textSecondary,
                      margin: '4px 0 0',
                    }}>Analyze and compare emission patterns across activities</p>
                  </div>
                </div>
              </div>
              
              {/* View Mode Toggle */}
              <div style={{
                display: 'flex',
                background: isDark ? '#0f172a' : '#f1f5f9',
                borderRadius: 12,
                padding: 4,
                gap: 4,
              }}>
                <button 
                  onClick={() => setViewMode('overview')} 
                  style={{
                    padding: isMobile ? '10px 20px' : '12px 24px',
                    borderRadius: 10,
                    border: 'none',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    background: viewMode === 'overview' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                    color: viewMode === 'overview' ? '#ffffff' : colors.textSecondary,
                    boxShadow: viewMode === 'overview' ? '0 4px 12px rgba(102, 126, 234, 0.35)' : 'none',
                  }}
                >
                  📈 Overview
                </button>
                <button 
                  onClick={openComparison} 
                  style={{
                    padding: isMobile ? '10px 20px' : '12px 24px',
                    borderRadius: 10,
                    border: 'none',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    background: viewMode === 'comparison' ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                    color: viewMode === 'comparison' ? '#ffffff' : colors.textSecondary,
                    boxShadow: viewMode === 'comparison' ? '0 4px 12px rgba(102, 126, 234, 0.35)' : 'none',
                  }}
                >
                  ⚖️ Compare
                </button>
              </div>
            </div>

            {/* Main Content Area */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : '1fr 320px',
              gap: isMobile ? '20px' : '28px',
            }}>
              {/* Chart Area */}
              <div style={{
                background: isDark 
                  ? 'linear-gradient(145deg, #0f172a 0%, #1e293b 100%)' 
                  : 'linear-gradient(145deg, #f8fafc 0%, #ffffff 100%)',
                borderRadius: 16,
                padding: isMobile ? '16px' : '24px',
                border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                minHeight: isMobile ? 280 : 360,
                display: 'flex',
                flexDirection: 'column',
              }}>
                <Suspense fallback={<ChartSkeleton />}>
                  {selectedActivity ? (
                    viewMode === 'overview' ? (
                      <div style={{ flex: 1, minHeight: isMobile ? 240 : 300 }}>
                        <LazyEmissionPieChart data={preparedPieData} />
                      </div>
                    ) : (
                      comparisonActivity ? (
                        <div style={{ flex: 1, minHeight: isMobile ? 240 : 300 }}>
                          <LazyEmissionPieChart data={preparedComparisonChartData.map(d => ({ name: d.name, value: d.emissions }))} />
                        </div>
                      ) : (
                        <div style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 16,
                        }}>
                          <div style={{
                            width: 80,
                            height: 80,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 36,
                          }}>⚖️</div>
                          <p style={{ fontSize: 16, fontWeight: 600, color: colors.text, margin: 0 }}>Ready to Compare</p>
                          <p style={{ fontSize: 13, color: colors.textSecondary, margin: 0, textAlign: 'center' }}>Select an activity from the dropdown to start comparing</p>
                        </div>
                      )
                    )
                  ) : (
                    <div style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 16,
                    }}>
                      <div style={{
                        width: 100,
                        height: 100,
                        borderRadius: '50%',
                        background: isDark 
                          ? 'linear-gradient(135deg, rgba(99, 102, 241, 0.3) 0%, rgba(139, 92, 246, 0.2) 100%)' 
                          : 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 48,
                        animation: 'pulse 2s infinite',
                      }}>📈</div>
                      <p style={{ fontSize: 18, fontWeight: 700, color: colors.text, margin: 0 }}>No Activities Selected</p>
                      <p style={{ fontSize: 14, color: colors.textSecondary, margin: 0, textAlign: 'center', maxWidth: 300 }}>
                        Select one or more activities from the panel to visualize their emission breakdown
                      </p>
                    </div>
                  )}
                </Suspense>
              </div>

              {/* Activity Selection Panel */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}>
                {/* Activity Selector */}
                <div style={{
                  background: isDark ? '#1e293b' : '#ffffff',
                  borderRadius: 14,
                  padding: '18px',
                  border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                  boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.04)',
                }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 14,
                    fontWeight: 700,
                    color: colors.text,
                    marginBottom: 12,
                  }}>
                    <span style={{
                      width: 28,
                      height: 28,
                      borderRadius: 8,
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 14,
                    }}>🎯</span>
                    Select Activities
                  </label>
                  
                  <div style={{
                    position: 'relative',
                  }}>
                    <div
                      onClick={() => setShowActivityDropdown(!showActivityDropdown)}
                      style={{
                        minHeight: 48,
                        padding: '10px 14px',
                        background: isDark ? '#0f172a' : '#f8fafc',
                        border: '2px solid',
                        borderColor: showActivityDropdown ? '#667eea' : (isDark ? '#334155' : '#e2e8f0'),
                        borderRadius: 12,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 6,
                        flex: 1,
                      }}>
                        {selectedActivities.length === 0 ? (
                          <span style={{ color: colors.textTertiary, fontSize: 14 }}>Choose activities...</span>
                        ) : (
                          selectedActivities.map(activity => (
                            <span key={activity} style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '4px 10px',
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              color: '#ffffff',
                              borderRadius: 8,
                              fontSize: 12,
                              fontWeight: 600,
                            }}>
                              {activity.length > 12 ? activity.substring(0, 12) + '...' : activity}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newSelected = selectedActivities.filter(a => a !== activity);
                                  setSelectedActivities(newSelected);
                                  setSelectedActivity(newSelected.length > 0 ? newSelected[0] : '');
                                }}
                                style={{
                                  background: 'rgba(255,255,255,0.2)',
                                  border: 'none',
                                  borderRadius: 4,
                                  width: 18,
                                  height: 18,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  color: '#ffffff',
                                  fontSize: 14,
                                  fontWeight: 700,
                                }}
                              >×</button>
                            </span>
                          ))
                        )}
                      </div>
                      <span style={{
                        color: colors.textSecondary,
                        fontSize: 12,
                        transition: 'transform 0.2s ease',
                        transform: showActivityDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                      }}>▼</span>
                    </div>
                    
                    {showActivityDropdown && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        marginTop: 8,
                        background: isDark ? '#1e293b' : '#ffffff',
                        borderRadius: 12,
                        border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                        boxShadow: isDark ? '0 10px 40px rgba(0,0,0,0.4)' : '0 10px 40px rgba(0,0,0,0.12)',
                        maxHeight: 220,
                        overflowY: 'auto',
                        zIndex: 100,
                      }}>
                        {availableActivities.map((activity, index) => (
                          <label 
                            key={activity} 
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              padding: '12px 16px',
                              cursor: 'pointer',
                              transition: 'background 0.2s ease',
                              borderBottom: index < availableActivities.length - 1 ? `1px solid ${isDark ? '#334155' : '#f1f5f9'}` : 'none',
                              background: selectedActivities.includes(activity) ? (isDark ? 'rgba(99, 102, 241, 0.15)' : '#f0f9ff') : 'transparent',
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc'}
                            onMouseLeave={(e) => e.currentTarget.style.background = selectedActivities.includes(activity) ? (isDark ? 'rgba(99, 102, 241, 0.15)' : '#f0f9ff') : 'transparent'}
                          >
                            <input
                              type="checkbox"
                              checked={selectedActivities.includes(activity)}
                              onChange={(e) => {
                                const newSelected = e.target.checked
                                  ? [...selectedActivities, activity]
                                  : selectedActivities.filter(a => a !== activity);
                                setSelectedActivities(newSelected);
                                setSelectedActivity(newSelected.length > 0 ? newSelected[0] : '');
                              }}
                              style={{
                                width: 18,
                                height: 18,
                                accentColor: '#667eea',
                              }}
                            />
                            <span style={{
                              fontSize: 14,
                              color: colors.text,
                              fontWeight: selectedActivities.includes(activity) ? 600 : 400,
                            }}>{activity}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                {selectedActivities.length > 0 && (
                  <div style={{
                    background: isDark 
                      ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)' 
                      : 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                    borderRadius: 14,
                    padding: '18px',
                    border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.3)' : '#bbf7d0'}`,
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 14,
                    }}>
                      <span style={{ fontSize: 18 }}>📋</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: isDark ? '#34d399' : '#166534' }}>Selection Summary</span>
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 12,
                    }}>
                      <div style={{
                        background: isDark ? 'rgba(255,255,255,0.1)' : '#ffffff',
                        borderRadius: 10,
                        padding: '12px',
                        textAlign: 'center',
                      }}>
                        <div style={{ fontSize: 24, fontWeight: 800, color: isDark ? '#34d399' : '#166534' }}>
                          {selectedActivities.length}
                        </div>
                        <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Activities</div>
                      </div>
                      <div style={{
                        background: isDark ? 'rgba(255,255,255,0.1)' : '#ffffff',
                        borderRadius: 10,
                        padding: '12px',
                        textAlign: 'center',
                      }}>
                        <div style={{ fontSize: 24, fontWeight: 800, color: isDark ? '#38bdf8' : '#0284c7' }}>
                          {preparedPieData.reduce((sum, d) => sum + (d.value || 0), 0).toFixed(1)}
                        </div>
                        <div style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Total (t CO₂e)</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tips Card */}
                <div style={{
                  background: isDark 
                    ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%)' 
                    : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  borderRadius: 14,
                  padding: '16px',
                  border: `1px solid ${isDark ? 'rgba(251, 191, 36, 0.3)' : '#fcd34d'}`,
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}>
                    <span style={{ fontSize: 20 }}>💡</span>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#fbbf24' : '#92400e', margin: '0 0 4px' }}>Pro Tip</p>
                      <p style={{ fontSize: 12, color: isDark ? '#fcd34d' : '#a16207', margin: 0, lineHeight: 1.5 }}>
                        Use the Compare mode to analyze emissions between different activities side by side.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Emissions Spider Chart */}
          <div style={{
            background: isDark 
              ? 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)' 
              : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: isMobile ? '16px' : '20px',
            padding: isMobile ? '20px' : '28px',
            boxShadow: isDark 
              ? '0 10px 40px rgba(0,0,0,0.4)' 
              : '0 10px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            marginTop: isMobile ? '16px' : '24px',
          }}>
            {/* Header */}
            <div style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'flex-start' : 'center',
              gap: isMobile ? '16px' : '0',
              marginBottom: '24px',
              paddingBottom: '20px',
              borderBottom: `2px solid ${isDark ? '#334155' : '#f1f5f9'}`,
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  boxShadow: '0 4px 14px rgba(6, 182, 212, 0.4)',
                }}>🕸️</div>
                <div>
                  <h3 style={{
                    fontSize: isMobile ? '20px' : '24px',
                    fontWeight: 800,
                    color: colors.text,
                    margin: 0,
                    letterSpacing: '-0.5px',
                  }}>Emissions Radar</h3>
                  <p style={{
                    fontSize: '13px',
                    color: colors.textSecondary,
                    margin: '4px 0 0',
                  }}>Multi-dimensional view of emission sources</p>
                </div>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}>
                <div style={{
                  padding: '8px 16px',
                  background: isDark ? 'rgba(6, 182, 212, 0.15)' : '#f0f9ff',
                  borderRadius: 10,
                  border: `1px solid ${isDark ? 'rgba(6, 182, 212, 0.3)' : '#bae6fd'}`,
                }}>
                  <span style={{ fontSize: 12, color: '#0284c7', fontWeight: 600 }}>
                    {availableActivities.length} Categories
                  </span>
                </div>
              </div>
            </div>

            {/* Comprehensive Radar Chart */}
            {(() => {
              // Prepare comprehensive radar data from top activities with scope breakdown
              if (!activitiesData?.activities || activitiesData.activities.length === 0) {
                return (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '60px 20px',
                    gap: 16,
                  }}>
                    <div style={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 36,
                    }}>🕸️</div>
                    <p style={{ fontSize: 16, fontWeight: 600, color: '#374151', margin: 0 }}>No Data Available</p>
                    <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>Add activities to see radar analysis</p>
                  </div>
                );
              }

              // Aggregate emissions by activity type with scope breakdown
              const categoryMap = {};
              activitiesData.activities.forEach(activity => {
                const category = activity.activity_type || activity.category || 'Other';
                const scopeNumber = activity.scope_number || (activity.scope ? parseInt(activity.scope.replace('Scope ', '')) : 3);
                const emissions = (activity.emissions_kgco2e || 0) / 1000; // Convert to tonnes
                
                if (!categoryMap[category]) {
                  categoryMap[category] = { 
                    emissions: 0, 
                    scope1: 0, 
                    scope2: 0, 
                    scope3: 0,
                    count: 0,
                    avgPerActivity: 0
                  };
                }
                
                categoryMap[category].emissions += emissions;
                categoryMap[category].count += 1;
                
                if (scopeNumber === 1) {
                  categoryMap[category].scope1 += emissions;
                } else if (scopeNumber === 2) {
                  categoryMap[category].scope2 += emissions;
                } else {
                  categoryMap[category].scope3 += emissions;
                }
              });

              // Calculate average per activity for each category
              Object.keys(categoryMap).forEach(cat => {
                categoryMap[cat].avgPerActivity = categoryMap[cat].count > 0 
                  ? categoryMap[cat].emissions / categoryMap[cat].count 
                  : 0;
              });

              // Get top 5 activities (can be increased to 8 if needed)
              const topActivities = Object.entries(categoryMap)
                .map(([name, data]) => ({
                  category: name.length > 15 ? name.substring(0, 15) + '...' : name,
                  fullName: name,
                  emissions: parseFloat(data.emissions.toFixed(2)),
                  scope1: parseFloat(data.scope1.toFixed(2)),
                  scope2: parseFloat(data.scope2.toFixed(2)),
                  scope3: parseFloat(data.scope3.toFixed(2)),
                  count: data.count,
                  avgPerActivity: parseFloat(data.avgPerActivity.toFixed(2)),
                }))
                .sort((a, b) => b.emissions - a.emissions)
                .slice(0, 5);

              if (topActivities.length < 2) {
                return (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '60px 20px',
                    gap: 16,
                  }}>
                    <div style={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 36,
                    }}>📊</div>
                    <p style={{ fontSize: 16, fontWeight: 600, color: '#374151', margin: 0 }}>Need More Data</p>
                    <p style={{ fontSize: 13, color: '#6b7280', margin: 0, textAlign: 'center' }}>
                      At least 2 different activity types are needed for comprehensive radar chart
                    </p>
                  </div>
                );
              }

              // Calculate max values for normalization (for better radar visualization)
              const maxEmission = Math.max(...topActivities.map(d => d.emissions));
              const maxScope1 = Math.max(...topActivities.map(d => d.scope1), 0.1);
              const maxScope2 = Math.max(...topActivities.map(d => d.scope2), 0.1);
              const maxScope3 = Math.max(...topActivities.map(d => d.scope3), 0.1);
              const maxCount = Math.max(...topActivities.map(d => d.count), 1);
              const maxAvg = Math.max(...topActivities.map(d => d.avgPerActivity), 0.1);
              
              // Normalize values to 0-100 scale for radar (so all metrics are comparable)
              const radarData = topActivities.map(activity => ({
                ...activity,
                // Normalized values (0-100) for radar display
                emissionsNorm: (activity.emissions / maxEmission) * 100,
                scope1Norm: maxScope1 > 0 ? (activity.scope1 / maxScope1) * 100 : 0,
                scope2Norm: maxScope2 > 0 ? (activity.scope2 / maxScope2) * 100 : 0,
                scope3Norm: maxScope3 > 0 ? (activity.scope3 / maxScope3) * 100 : 0,
                countNorm: (activity.count / maxCount) * 100,
                avgNorm: (activity.avgPerActivity / maxAvg) * 100,
              }));

              const totalEmissions = topActivities.reduce((sum, d) => sum + d.emissions, 0);

              return (
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 320px',
                  gap: isMobile ? '24px' : '32px',
                }}>
                  {/* Comprehensive Multi-Series Radar Chart */}
                  <div style={{
                    background: isDark 
                      ? 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)' 
                      : 'linear-gradient(145deg, #f8fafc 0%, #ffffff 100%)',
                    borderRadius: 16,
                    padding: '20px',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                  }}>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 8,
                      }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: colors.textSecondary }}>
                          📊 View: 
                        </span>
                        <select
                          value={radarViewMode || 'emissions'}
                          onChange={(e) => setRadarViewMode(e.target.value)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: 6,
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.2)' : '#d1d5db'}`,
                            background: isDark ? '#1e293b' : '#ffffff',
                            color: colors.text,
                            fontSize: 12,
                            cursor: 'pointer',
                          }}
                        >
                          <option value="emissions">Total Emissions</option>
                          <option value="scopes">By Scope (1,2,3)</option>
                          <option value="comprehensive">Comprehensive</option>
                        </select>
                      </div>
                    </div>
                    <ResponsiveContainer width="100%" height={isMobile ? 350 : 420}>
                      <RadarChart data={radarData} margin={{ top: 30, right: 40, bottom: 30, left: 40 }}>
                        <PolarGrid 
                          stroke={isDark ? '#334155' : '#e2e8f0'} 
                          strokeWidth={1}
                          gridType="polygon"
                        />
                        <PolarAngleAxis 
                          dataKey="category" 
                          tick={{ 
                            fill: colors.textSecondary, 
                            fontSize: isMobile ? 9 : 11,
                            fontWeight: 500,
                          }}
                          tickLine={false}
                        />
                        <PolarRadiusAxis 
                          angle={90} 
                          domain={[0, 100]}
                          tick={{ fill: colors.textSecondary, fontSize: 9 }}
                          tickCount={6}
                          axisLine={false}
                        />
                        
                        {/* Show different radar series based on view mode */}
                        {(!radarViewMode || radarViewMode === 'emissions') && (
                          <Radar
                            name="Total Emissions"
                            dataKey="emissionsNorm"
                            stroke="#06b6d4"
                            fill="url(#radarGradientTotal)"
                            fillOpacity={0.6}
                            strokeWidth={3}
                            dot={{ r: 5, fill: '#06b6d4', stroke: '#ffffff', strokeWidth: 2 }}
                            activeDot={{ r: 8, fill: '#0891b2', stroke: '#ffffff', strokeWidth: 2 }}
                          />
                        )}
                        
                        {radarViewMode === 'scopes' && (
                          <>
                            <Radar
                              name="Scope 1"
                              dataKey="scope1Norm"
                              stroke="#ef4444"
                              fill="url(#radarGradientScope1)"
                              fillOpacity={0.4}
                              strokeWidth={2.5}
                              dot={{ r: 4, fill: '#ef4444', stroke: '#ffffff', strokeWidth: 2 }}
                            />
                            <Radar
                              name="Scope 2"
                              dataKey="scope2Norm"
                              stroke="#f59e0b"
                              fill="url(#radarGradientScope2)"
                              fillOpacity={0.4}
                              strokeWidth={2.5}
                              dot={{ r: 4, fill: '#f59e0b', stroke: '#ffffff', strokeWidth: 2 }}
                            />
                            <Radar
                              name="Scope 3"
                              dataKey="scope3Norm"
                              stroke="#8b5cf6"
                              fill="url(#radarGradientScope3)"
                              fillOpacity={0.4}
                              strokeWidth={2.5}
                              dot={{ r: 4, fill: '#8b5cf6', stroke: '#ffffff', strokeWidth: 2 }}
                            />
                          </>
                        )}
                        
                        {radarViewMode === 'comprehensive' && (
                          <>
                            <Radar
                              name="Total Emissions"
                              dataKey="emissionsNorm"
                              stroke="#06b6d4"
                              fill="url(#radarGradientTotal)"
                              fillOpacity={0.5}
                              strokeWidth={2.5}
                            />
                            <Radar
                              name="Activity Count"
                              dataKey="countNorm"
                              stroke="#10b981"
                              fill="url(#radarGradientCount)"
                              fillOpacity={0.3}
                              strokeWidth={2}
                              strokeDasharray="5 5"
                            />
                            <Radar
                              name="Avg per Activity"
                              dataKey="avgNorm"
                              stroke="#f59e0b"
                              fill="url(#radarGradientAvg)"
                              fillOpacity={0.3}
                              strokeWidth={2}
                              strokeDasharray="3 3"
                            />
                          </>
                        )}
                        
                        <Tooltip
                          content={({ active, payload }) => {
                            if (active && payload && payload.length > 0) {
                              const data = payload[0].payload;
                              const percentage = totalEmissions > 0 ? (data.emissions / totalEmissions * 100).toFixed(1) : 0;
                              return (
                                <div style={{
                                  background: isDark ? '#1e293b' : '#ffffff',
                                  border: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                                  borderRadius: 12,
                                  padding: '14px 18px',
                                  boxShadow: isDark ? '0 10px 40px rgba(0,0,0,0.5)' : '0 10px 40px rgba(0,0,0,0.15)',
                                  minWidth: 220,
                                }}>
                                  <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: colors.text }}>
                                    {data.fullName}
                                  </p>
                                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
                                      <span style={{ fontSize: 12, color: colors.textSecondary }}>Total:</span>
                                      <span style={{ fontSize: 12, fontWeight: 700, color: colors.text }}>{data.emissions.toFixed(2)} t CO₂e</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
                                      <span style={{ fontSize: 12, color: colors.textSecondary }}>Share:</span>
                                      <span style={{ fontSize: 12, fontWeight: 700, color: '#06b6d4' }}>{percentage}%</span>
                                    </div>
                                    <div style={{ 
                                      paddingTop: 8, 
                                      borderTop: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: 4,
                                    }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
                                        <span style={{ fontSize: 11, color: colors.textSecondary }}>Scope 1:</span>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#ef4444' }}>{data.scope1.toFixed(2)} t</span>
                                      </div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
                                        <span style={{ fontSize: 11, color: colors.textSecondary }}>Scope 2:</span>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#f59e0b' }}>{data.scope2.toFixed(2)} t</span>
                                      </div>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
                                        <span style={{ fontSize: 11, color: colors.textSecondary }}>Scope 3:</span>
                                        <span style={{ fontSize: 11, fontWeight: 600, color: '#8b5cf6' }}>{data.scope3.toFixed(2)} t</span>
                                      </div>
                                    </div>
                                    <div style={{ 
                                      paddingTop: 8, 
                                      borderTop: `1px solid ${isDark ? '#334155' : '#e5e7eb'}`,
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      gap: 20,
                                    }}>
                                      <span style={{ fontSize: 12, color: colors.textSecondary }}>Activities:</span>
                                      <span style={{ fontSize: 12, fontWeight: 700, color: colors.text }}>{data.count}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20 }}>
                                      <span style={{ fontSize: 12, color: colors.textSecondary }}>Avg/Activity:</span>
                                      <span style={{ fontSize: 12, fontWeight: 700, color: colors.text }}>{data.avgPerActivity.toFixed(2)} t</span>
                                    </div>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Legend 
                          wrapperStyle={{ paddingTop: 20 }}
                          iconType="circle"
                          formatter={(value) => <span style={{ fontSize: 11, color: colors.textSecondary }}>{value}</span>}
                        />
                        <defs>
                          <linearGradient id="radarGradientTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="#0891b2" stopOpacity={0.3} />
                          </linearGradient>
                          <linearGradient id="radarGradientScope1" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.6} />
                            <stop offset="100%" stopColor="#ef4444" stopOpacity={0.2} />
                          </linearGradient>
                          <linearGradient id="radarGradientScope2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.6} />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.2} />
                          </linearGradient>
                          <linearGradient id="radarGradientScope3" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.6} />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.2} />
                          </linearGradient>
                          <linearGradient id="radarGradientCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={0.5} />
                            <stop offset="100%" stopColor="#10b981" stopOpacity={0.2} />
                          </linearGradient>
                          <linearGradient id="radarGradientAvg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.5} />
                            <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.2} />
                          </linearGradient>
                        </defs>
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Comprehensive Stats Panel */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                  }}>
                    {/* Summary Card */}
                    <div style={{
                      background: isDark 
                        ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' 
                        : 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
                      borderRadius: 14,
                      padding: '18px',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#a5f3fc'}`,
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 14,
                      }}>
                        <span style={{ fontSize: 18 }}>📈</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: colors.text }}>Radar Summary</span>
                      </div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 1fr',
                        gap: 12,
                        marginBottom: 12,
                      }}>
                        <div style={{
                          background: isDark ? '#0f172a' : '#ffffff',
                          borderRadius: 10,
                          padding: '12px',
                          textAlign: 'center',
                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0'}`,
                        }}>
                          <div style={{ fontSize: 22, fontWeight: 800, color: '#06b6d4' }}>
                            {totalEmissions.toFixed(1)}
                          </div>
                          <div style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2 }}>Total (t CO₂e)</div>
                        </div>
                        <div style={{
                          background: isDark ? '#0f172a' : '#ffffff',
                          borderRadius: 10,
                          padding: '12px',
                          textAlign: 'center',
                          border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0'}`,
                        }}>
                          <div style={{ fontSize: 22, fontWeight: 800, color: '#10b981' }}>
                            {radarData.length}
                          </div>
                          <div style={{ fontSize: 10, color: colors.textSecondary, marginTop: 2 }}>Top Categories</div>
                        </div>
                      </div>
                      
                      {/* Scope Breakdown Summary */}
                      <div style={{
                        padding: '12px',
                        background: isDark ? '#0f172a' : '#ffffff',
                        borderRadius: 10,
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0'}`,
                      }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: colors.textSecondary, marginBottom: 8 }}>
                          Scope Breakdown:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }}></div>
                              <span style={{ fontSize: 11, color: colors.textSecondary }}>Scope 1:</span>
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: colors.text }}>
                              {topActivities.reduce((sum, a) => sum + a.scope1, 0).toFixed(2)} t
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }}></div>
                              <span style={{ fontSize: 11, color: colors.textSecondary }}>Scope 2:</span>
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: colors.text }}>
                              {topActivities.reduce((sum, a) => sum + a.scope2, 0).toFixed(2)} t
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#8b5cf6' }}></div>
                              <span style={{ fontSize: 11, color: colors.textSecondary }}>Scope 3:</span>
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 700, color: colors.text }}>
                              {topActivities.reduce((sum, a) => sum + a.scope3, 0).toFixed(2)} t
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Top Categories List with Scope Info */}
                    <div style={{
                      background: isDark ? '#1e293b' : '#ffffff',
                      borderRadius: 14,
                      padding: '18px',
                      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                      flex: 1,
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 14,
                      }}>
                        <span style={{ fontSize: 16 }}>🏆</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: colors.text }}>Top 5 Categories</span>
                      </div>
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 10,
                      }}>
                        {radarData.map((item, index) => {
                          const percentage = totalEmissions > 0 ? (item.emissions / totalEmissions * 100) : 0;
                          const categoryColors = ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'];
                          return (
                            <div key={item.fullName} style={{
                              padding: '10px',
                              background: isDark ? '#0f172a' : '#f8fafc',
                              borderRadius: 8,
                              border: `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : '#e2e8f0'}`,
                            }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                marginBottom: 8,
                              }}>
                                <div style={{
                                  width: 24,
                                  height: 24,
                                  borderRadius: 6,
                                  background: categoryColors[index],
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: '#ffffff',
                                }}>{index + 1}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{
                                    fontSize: 12,
                                    fontWeight: 600,
                                    color: colors.text,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                  }}>{item.fullName}</div>
                                  <div style={{
                                    fontSize: 10,
                                    color: colors.textSecondary,
                                    marginTop: 2,
                                  }}>{item.emissions.toFixed(2)} t CO₂e ({percentage.toFixed(1)}%)</div>
                                </div>
                              </div>
                              {/* Scope breakdown bars */}
                              {item.emissions > 0 && (
                                <div style={{
                                  display: 'flex',
                                  gap: 2,
                                  marginTop: 6,
                                  height: 4,
                                  borderRadius: 2,
                                  overflow: 'hidden',
                                  background: isDark ? '#1e293b' : '#f1f5f9',
                                }}>
                                  {item.scope1 > 0 && (
                                    <div style={{
                                      width: `${(item.scope1 / item.emissions) * 100}%`,
                                      height: '100%',
                                      background: '#ef4444',
                                      title: `Scope 1: ${item.scope1.toFixed(2)}t`,
                                    }}></div>
                                  )}
                                  {item.scope2 > 0 && (
                                    <div style={{
                                      width: `${(item.scope2 / item.emissions) * 100}%`,
                                      height: '100%',
                                      background: '#f59e0b',
                                      title: `Scope 2: ${item.scope2.toFixed(2)}t`,
                                    }}></div>
                                  )}
                                  {item.scope3 > 0 && (
                                    <div style={{
                                      width: `${(item.scope3 / item.emissions) * 100}%`,
                                      height: '100%',
                                      background: '#8b5cf6',
                                      title: `Scope 3: ${item.scope3.toFixed(2)}t`,
                                    }}></div>
                                  )}
                                </div>
                              )}
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                marginTop: 6,
                                fontSize: 9,
                                color: colors.textSecondary,
                              }}>
                                <span>{item.count} activities</span>
                                <span>Avg: {item.avgPerActivity.toFixed(2)} t</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Insight Card */}
                    <div style={{
                      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                      borderRadius: 12,
                      padding: '14px',
                      border: '1px solid #fcd34d',
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                      }}>
                        <span style={{ fontSize: 18 }}>💡</span>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 600, color: '#92400e', margin: '0 0 4px' }}>Insight</p>
                          <p style={{ fontSize: 11, color: '#a16207', margin: 0, lineHeight: 1.5 }}>
                            {radarData[0]?.fullName || 'N/A'} is your largest emission source at {radarData[0] ? (radarData[0].emissions / totalEmissions * 100).toFixed(1) : 0}% of total.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {showComparisonModal && (
            <div style={styles.modalOverlay}>
              <div style={{
                ...styles.modalContent,
                width: isMobile ? '90%' : isTablet ? '70%' : '500px',
                padding: isMobile ? '20px' : '24px',
              }}>
                <h3 style={{
                  ...styles.modalTitle,
                  fontSize: isMobile ? '20px' : '24px',
                }}>Compare Activity</h3>
                <select value={comparisonActivity} onChange={(e) => setComparisonActivity(e.target.value)} style={{
                  ...styles.modalSelect,
                  fontSize: isMobile ? '14px' : '16px',
                  padding: isMobile ? '10px 12px' : '12px 16px',
                }}>
                  <option value="">Select activity</option>
                  {availableActivities.filter(a => a !== selectedActivity).map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <div style={{
                  ...styles.modalButtons,
                  flexDirection: isMobile ? 'column' : 'row',
                  gap: isMobile ? '12px' : '12px',
                }}>
                  <button onClick={() => { setComparisonActivities([comparisonActivity]); setViewMode('comparison'); setShowComparisonModal(false); }} disabled={!comparisonActivity} style={{
                    ...styles.modalButton,
                    width: isMobile ? '100%' : 'auto',
                    padding: isMobile ? '12px' : '12px 24px',
                  }}>Compare</button>
                  <button onClick={closeComparison} style={{
                    ...styles.modalCancelButton,
                    width: isMobile ? '100%' : 'auto',
                    padding: isMobile ? '12px' : '12px 24px',
                  }}>Cancel</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}

const styles = {
  header: {
    marginBottom: 32,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 20,
    flexWrap: 'wrap',
    padding: '24px 0',
    borderBottom: '1px solid #e5e7eb'
  },
  title: {
    fontSize: 32,
    fontWeight: 800,
    margin: 0,
    color: '#1e293b',
    letterSpacing: '-0.025em'
  },
  subtitle: {
    margin: '8px 0 0',
    color: '#64748b',
    fontSize: 16,
    fontWeight: 500
  },
  exportContainer: { display: 'flex', alignItems: 'center', gap: 16 },
  filtersRow: { display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' },
  smallFilter: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  smallFilterLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em'
  },
  smallFilterLabelMobile: {
    fontSize: 11,
  },
  dateInput: {
    padding: '12px 16px',
    borderRadius: 12,
    border: '2px solid #e2e8f0',
    fontSize: 14,
    background: '#ffffff',
    transition: 'border-color 0.2s',
    outline: 'none'
  },
  dateInputMobile: {
    padding: '10px 12px',
    fontSize: 13,
  },
  exportButtonContainer: { position: 'relative' },
  exportButton: {
    padding: '12px 20px',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    color: '#ffffff',
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 14,
    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.3)',
    transition: 'all 0.2s'
  },
  exportMenu: {
    position: 'absolute',
    top: '110%',
    right: 0,
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    zIndex: 40,
    minWidth: 160
  },
  exportMenuItem: {
    padding: '12px 16px',
    width: '100%',
    textAlign: 'left',
    border: 'none',
    cursor: 'pointer',
    background: 'none',
    fontSize: 14,
    color: '#374151',
    transition: 'background-color 0.2s'
  },
  chartsGrid: { display: 'flex', flexDirection: 'column', gap: 24 },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 20
  },
  kpiCard: {
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    borderRadius: 16,
    padding: 18,
    boxShadow: '0 8px 24px rgba(0,0,0,0.1), 0 2px 6px rgba(0,0,0,0.06)',
    display: 'flex',
    gap: 14,
    alignItems: 'center',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: 'default',
    border: 'none',
    position: 'relative',
    overflow: 'hidden',
  },
  kpiCardMobile: {
    padding: 14,
    gap: 12,
    borderRadius: 12,
  },
  kpiCardTablet: {
    padding: 16,
    gap: 12,
  },
  kpiIcon: {
    fontSize: 28,
    flexShrink: 0,
    padding: 12,
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 3px 8px rgba(0,0,0,0.12)',
    transition: 'all 0.3s ease',
  },
  kpiIconMobile: {
    fontSize: 24,
    padding: 10,
    borderRadius: 10,
  },
  kpiIconTablet: {
    fontSize: 26,
    padding: 11,
  },
  kpiContent: { 
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: 800,
    color: '#ffffff',
    marginBottom: 0,
    letterSpacing: '-0.02em',
    lineHeight: '1.2',
    textShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  kpiValueMobile: {
    fontSize: 20,
  },
  kpiValueTablet: {
    fontSize: 22,
  },
  kpiLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    textShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
  kpiLabelMobile: {
    fontSize: 11,
  },
  gridTwoCols: {
    display: 'grid',
    gap: 20,
  },
  leftColumn: { display: 'flex', flexDirection: 'column', gap: 16 },
  rightColumn: { display: 'flex', flexDirection: 'column', gap: 16 },
  chartCard: {
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
    marginBottom: 20,
    width: '100%',
    minHeight: 380,
    border: '1px solid #f1f5f9'
  },
  chartCardMobile: {
    minHeight: 300,
    borderRadius: 12,
  },
  card: {
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    borderRadius: 16,
    padding: 24,
    boxShadow: '0 10px 40px rgba(0,0,0,0.06)',
    border: '1px solid #f1f5f9'
  },
  cardMobile: {
    borderRadius: 12,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  cardActions: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    flexWrap: 'wrap'
  },
  chartTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    color: '#1e293b',
    letterSpacing: '-0.025em'
  },
  chartCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartBadge: {
    fontSize: 12,
    color: '#10b981',
    background: '#d1fae5',
    padding: '4px 10px',
    borderRadius: 12,
    fontWeight: 600,
  },
  chartSubtitle: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: 500,
    marginTop: 4
  },
  chartArea: { width: '100%', height: 320 },
  iconBtn: {
    border: '2px solid #e2e8f0',
    background: '#ffffff',
    padding: '8px 12px',
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  filterSelect: {
    padding: '12px 16px',
    borderRadius: 12,
    border: '2px solid #e2e8f0',
    background: '#ffffff',
    fontSize: 14,
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  viewModeContainer: { display: 'flex', gap: 12 },
  viewModeButton: {
    padding: '10px 16px',
    borderRadius: 10,
    border: '2px solid #e2e8f0',
    cursor: 'pointer',
    fontSize: 14,
    fontWeight: 500,
    background: '#ffffff',
    transition: 'all 0.2s'
  },
  viewModeButtonActive: {
    background: 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)',
    color: '#ffffff',
    borderColor: '#1e40af',
    boxShadow: '0 4px 14px rgba(30, 64, 175, 0.3)'
  },
  viewModeButtonMobile: {
    width: '100%',
    padding: '12px',
    fontSize: 13,
  },
  customSelectContainer: { position: 'relative' },
  customSelectTrigger: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    border: '2px solid #e2e8f0',
    borderRadius: 12,
    background: '#ffffff',
    cursor: 'pointer',
    minHeight: 48,
    transition: 'border-color 0.2s'
  },
  selectedActivities: { display: 'flex', flexWrap: 'wrap', gap: 6, flex: 1 },
  placeholderText: { color: '#94a3b8', fontSize: 14 },
  activityTag: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
    padding: '6px 12px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    color: '#475569'
  },
  tagRemoveBtn: {
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: '#64748b',
    fontSize: 16,
    lineHeight: 1,
    padding: 0
  },
  dropdownArrow: { color: '#64748b', fontSize: 14 },
  customSelectDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    zIndex: 10,
    maxHeight: 240,
    overflowY: 'auto'
  },
  dropdownOption: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '12px 16px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  checkbox: { margin: 0 },
  optionText: { fontSize: 14, color: '#374151' },
  noDataWrapper: {
    padding: 48,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: "column",
    height: 240,
    color: "#64748b",
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    borderRadius: 16,
    border: '1px solid #e2e8f0'
  },
  noDataInner: { textAlign: 'center', color: '#1e293b' },
  noDataChart: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '280px',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    borderRadius: 12,
    border: '1px solid #e2e8f0'
  },
  noDataIcon: { fontSize: 48, marginBottom: 12, opacity: 0.3, color: '#94a3b8' },
  noDataText: { fontSize: 16, color: '#64748b', fontWeight: 500 },
  verticalSliderContainer: { height: "280px", display: "flex", alignItems: "center", marginRight: "16px" },
  verticalSlider: { writingMode: "bt-lr", transform: "rotate(90deg)", width: "280px", height: "260px", cursor: "pointer" },
  heatmapTable: { display: 'flex', flexDirection: 'column', gap: 8, minWidth: 480 },
  heatmapTableMobile: {
    minWidth: 300,
  },
  heatmapRow: { display: 'flex', gap: 8 },
  heatmapRowMobile: {
    gap: 4,
  },
  heatmapCellHeader: {
    minWidth: 140,
    padding: 12,
    borderRadius: 10,
    background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
    fontSize: 14,
    textAlign: 'left',
    fontWeight: 600,
    color: '#374151'
  },
  heatmapCellHeaderMobile: {
    minWidth: 80,
    padding: 8,
    fontSize: 11,
  },
  heatmapCell: {
    minWidth: 140,
    padding: 12,
    borderRadius: 10,
    background: '#ffffff',
    fontSize: 14,
    border: '1px solid #e2e8f0',
    fontWeight: 500
  },
  heatmapCellMobile: {
    minWidth: 80,
    padding: 8,
    fontSize: 11,
  },
  modalOverlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 60
  },
  modalContent: {
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    borderRadius: 16,
    padding: 24,
    width: 480,
    boxShadow: '0 25px 80px rgba(0,0,0,0.15)',
    border: '1px solid #e2e8f0'
  },
  modalTitle: {
    margin: 0,
    fontSize: 20,
    fontWeight: 700,
    color: '#1e293b',
    letterSpacing: '-0.025em'
  },
  modalSelect: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: 12,
    border: '2px solid #e2e8f0',
    marginTop: 16,
    fontSize: 14,
    outline: 'none'
  },
  modalButtons: { display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 20 },
  modalButton: {
    padding: '12px 20px',
    borderRadius: 12,
    border: 'none',
    background: 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)',
    color: '#ffffff',
    cursor: 'pointer',
    fontWeight: 600,
    boxShadow: '0 4px 14px rgba(30, 64, 175, 0.3)'
  },
  modalCancelButton: {
    padding: '12px 20px',
    borderRadius: 12,
    border: '2px solid #e2e8f0',
    background: '#ffffff',
    cursor: 'pointer',
    fontWeight: 600,
    color: '#64748b'
  },
  loadingContainer: {
    minHeight: 320,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    borderRadius: 16,
    border: '1px solid #e2e8f0'
  },
  spinner: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    border: '6px solid #e2e8f0',
    borderTopColor: '#1e40af',
    animation: 'spin 1s linear infinite'
  },
  centerFallback: {
    minHeight: 320,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    borderRadius: 16,
    border: '1px solid #e2e8f0'
  },
  retryBtn: {
    padding: '12px 20px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: 12,
    cursor: 'pointer',
    fontWeight: 600,
    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)'
  },
  periodSelect: {
    padding: '12px 16px',
    borderRadius: 12,
    border: '2px solid #e2e8f0',
    outline: 'none',
    fontSize: 14,
    background: '#ffffff',
    transition: 'border-color 0.2s'
  }
};

const styleTag = document.createElement('style');
styleTag.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(styleTag);

export default Analytics;