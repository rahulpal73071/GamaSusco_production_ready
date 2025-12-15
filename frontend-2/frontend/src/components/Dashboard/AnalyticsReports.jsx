import { useState, useEffect, useMemo } from 'react';
import DashboardLayout from './DashboardLayout';
import { useAuth } from '../../context/AuthContext';
import { dashboardAPI, reportsAPI, recommendationsAPI, activitiesAPI } from '../../services/api';
import EmissionLineChart from './LineChart';
import {
  ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';

function AnalyticsReports() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('analytics');

  // Analytics States
  const [activities, setActivities] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    scope1: 0,
    scope2: 0,
    scope3: 0,
    count: 0
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(true);

  // Reports States
  const [reports, setReports] = useState([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportError, setReportError] = useState('');

  // Recommendations States
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [period, setPeriod] = useState(null);
  const [maxRecommendations, setMaxRecommendations] = useState(5);

  useEffect(() => {
    if (user?.company_id) {
      fetchActivitiesAndCalculate();
      fetchRecommendations();
    }
  }, [user]);

  const fetchActivitiesAndCalculate = async () => {
    try {
      setAnalyticsLoading(true);
      const response = await activitiesAPI.getActivities(user.company_id, { limit: 1000 });
      const data = response.data;

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
      setAnalyticsLoading(false);
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
      total: total,
      scope1: scope1,
      scope2: scope2,
      scope3: scope3,
      count: activityList.length
    });
  };

  const fetchRecommendations = async () => {
    try {
      setRecommendationsLoading(true);
      const response = await recommendationsAPI.getRecommendations(
        user.company_id,
        period,
        maxRecommendations
      );
      setRecommendations(response.data.recommendations || []);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      setRecommendations([]);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  const downloadComprehensivePDF = async (config) => {
    try {
      setReportLoading(true);
      setReportError('');
      const response = await reportsAPI.generateComprehensivePDF(config);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sustainability_report_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setShowGenerateModal(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      setReportError(error.response?.data?.detail || 'Failed to generate PDF report');
    } finally {
      setReportLoading(false);
    }
  };

  const downloadComprehensiveExcel = async (config) => {
    try {
      setReportLoading(true);
      setReportError('');
      const response = await reportsAPI.generateComprehensiveExcel(config);
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sustainability_report_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setShowGenerateModal(false);
    } catch (error) {
      console.error('Error generating Excel:', error);
      setReportError(error.response?.data?.detail || 'Failed to generate Excel report');
    } finally {
      setReportLoading(false);
    }
  };

  const scopeChartData = useMemo(() => {
    if (!stats || stats.total === 0) return [];
    const data = [];
    if (stats.scope1 > 0) data.push({ name: 'Scope 1', value: stats.scope1 });
    if (stats.scope2 > 0) data.push({ name: 'Scope 2', value: stats.scope2 });
    if (stats.scope3 > 0) data.push({ name: 'Scope 3', value: stats.scope3 });
    return data;
  }, [stats]);

  const categoryChartData = useMemo(() => {
    if (!activities || activities.length === 0) return [];
    const categoryMap = {};
    activities.forEach(activity => {
      const category = activity.category || 'Uncategorized';
      categoryMap[category] = (categoryMap[category] || 0) + (activity.emissions_kgco2e || 0);
    });
    return Object.entries(categoryMap)
      .map(([category, value]) => ({ name: category, value: value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [activities]);

  const COLORS = ['#ef4444', '#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b', '#06b6d4'];

  const getPriorityColor = (priority) => {
    const colors = {
      high: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
      medium: { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
      low: { bg: '#d1fae5', text: '#065f46', border: '#a7f3d0' }
    };
    return colors[priority?.toLowerCase()] || { bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' };
  };

  const getPriorityIcon = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  return (
    <DashboardLayout>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Analytics & Reports</h1>
            <p style={styles.subtitle}>Visualize data, generate reports, and get AI recommendations</p>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabContainer}>
          <div style={styles.tabHeader}>
            <button
              onClick={() => setActiveTab('analytics')}
              style={{
                ...styles.tab,
                ...(activeTab === 'analytics' ? styles.tabActive : {})
              }}
            >
              <span style={styles.tabIcon}>📊</span>
              <span style={styles.tabLabel}>Analytics</span>
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              style={{
                ...styles.tab,
                ...(activeTab === 'reports' ? styles.tabActive : {})
              }}
            >
              <span style={styles.tabIcon}>📄</span>
              <span style={styles.tabLabel}>Reports</span>
            </button>
            <button
              onClick={() => setActiveTab('recommendations')}
              style={{
                ...styles.tab,
                ...(activeTab === 'recommendations' ? styles.tabActive : {})
              }}
            >
              <span style={styles.tabIcon}>🤖</span>
              <span style={styles.tabLabel}>AI Recommendations</span>
            </button>
          </div>

          <div style={styles.tabContent}>
            {/* ANALYTICS TAB */}
            {activeTab === 'analytics' && (
              <div style={styles.contentInner}>
                {analyticsLoading ? (
                  <div style={styles.loadingContainer}>
                    <div style={styles.spinner}></div>
                    <p style={styles.loadingText}>Loading analytics...</p>
                  </div>
                ) : (
                  <>
                    {/* KPI Cards */}
                    <div style={styles.kpiGrid}>
                      <div style={{ ...styles.kpiCard, background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)' }}>
                        <div style={styles.kpiIcon}>🌍</div>
                        <div style={styles.kpiContent}>
                          <div style={{ ...styles.kpiValue, color: '#1e40af' }}>{stats.total.toFixed(2)}</div>
                          <div style={{ ...styles.kpiLabel, color: '#1e40af' }}>Total Emissions</div>
                          <div style={{ ...styles.kpiUnit, color: '#3b82f6' }}>kg CO₂e</div>
                        </div>
                      </div>
                      <div style={{ ...styles.kpiCard, background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' }}>
                        <div style={styles.kpiIcon}>🔴</div>
                        <div style={styles.kpiContent}>
                          <div style={{ ...styles.kpiValue, color: '#991b1b' }}>{stats.scope1.toFixed(2)}</div>
                          <div style={{ ...styles.kpiLabel, color: '#991b1b' }}>Scope 1</div>
                          <div style={{ ...styles.kpiUnit, color: '#dc2626' }}>kg CO₂e</div>
                        </div>
                      </div>
                      <div style={{ ...styles.kpiCard, background: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)' }}>
                        <div style={styles.kpiIcon}>🟠</div>
                        <div style={styles.kpiContent}>
                          <div style={{ ...styles.kpiValue, color: '#9a3412' }}>{stats.scope2.toFixed(2)}</div>
                          <div style={{ ...styles.kpiLabel, color: '#9a3412' }}>Scope 2</div>
                          <div style={{ ...styles.kpiUnit, color: '#ea580c' }}>kg CO₂e</div>
                        </div>
                      </div>
                      <div style={{ ...styles.kpiCard, background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' }}>
                        <div style={styles.kpiIcon}>🟢</div>
                        <div style={styles.kpiContent}>
                          <div style={{ ...styles.kpiValue, color: '#065f46' }}>{stats.scope3.toFixed(2)}</div>
                          <div style={{ ...styles.kpiLabel, color: '#065f46' }}>Scope 3</div>
                          <div style={{ ...styles.kpiUnit, color: '#059669' }}>kg CO₂e</div>
                        </div>
                      </div>
                    </div>

                    {/* Charts Grid */}
                    <div style={styles.chartGrid}>
                      {/* Scope Breakdown Pie Chart */}
                      <div style={styles.chartCard}>
                        <h3 style={styles.chartTitle}>Emissions by Scope</h3>
                        {scopeChartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={scopeChartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                              >
                                {scopeChartData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => `${value.toFixed(2)} kg CO₂e`} />
                            </PieChart>
                          </ResponsiveContainer>
                        ) : (
                          <div style={styles.noDataChart}>
                            <div style={styles.noDataIcon}>📊</div>
                            <p style={styles.noDataText}>No emission data available</p>
                            <p style={styles.noDataSubtext}>Add activities to see analytics</p>
                          </div>
                        )}
                      </div>

                      {/* Category Breakdown Bar Chart */}
                      <div style={styles.chartCard}>
                        <h3 style={styles.chartTitle}>Top Categories</h3>
                        {categoryChartData.length > 0 ? (
                          <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={categoryChartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} fontSize={12} stroke="#6b7280" />
                              <YAxis fontSize={12} stroke="#6b7280" />
                              <Tooltip
                                formatter={(value) => `${value.toFixed(2)} kg CO₂e`}
                                contentStyle={{
                                  background: '#fff',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: 8,
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                                }}
                              />
                              <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        ) : (
                          <div style={styles.noDataChart}>
                            <div style={styles.noDataIcon}>📊</div>
                            <p style={styles.noDataText}>No category data available</p>
                            <p style={styles.noDataSubtext}>Add activities to see breakdown</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timeline Chart */}
                    <div style={styles.chartCard}>
                      <h3 style={styles.chartTitle}>Emissions Over Time</h3>
                      {activities.length > 0 ? (
                        <EmissionLineChart activities={activities} />
                      ) : (
                        <div style={styles.noDataChart}>
                          <div style={styles.noDataIcon}>📈</div>
                          <p style={styles.noDataText}>No timeline data available</p>
                          <p style={styles.noDataSubtext}>Add activities with dates to see trends</p>
                        </div>
                      )}
                    </div>

                    {/* Summary */}
                    <div style={styles.summaryCard}>
                      <p style={styles.summaryText}>
                        📊 <strong>{stats.count}</strong> activities tracked •
                        Total emissions: <strong>{stats.total.toFixed(2)} kg CO₂e</strong>
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* REPORTS TAB */}
            {activeTab === 'reports' && (
              <div style={styles.contentInner}>
                <div style={styles.reportsHeader}>
                  <div>
                    <h2 style={styles.sectionTitle}>Generate Reports</h2>
                    <p style={styles.sectionSubtitle}>Download comprehensive sustainability reports</p>
                  </div>
                  <button
                    onClick={() => setShowGenerateModal(!showGenerateModal)}
                    style={showGenerateModal ? styles.closeButton : styles.generateButton}
                  >
                    {showGenerateModal ? '✕ Close' : '+ Generate New Report'}
                  </button>
                </div>

                {showGenerateModal && (
                  <div style={styles.generateCard}>
                    <h3 style={styles.cardTitle}>Report Generation</h3>

                    {reportError && (
                      <div style={styles.errorCard}>
                        <p style={styles.errorText}>{reportError}</p>
                      </div>
                    )}

                    <div style={styles.reportGrid}>
                      {/* PDF Report */}
                      <div style={styles.reportOption}>
                        <div style={styles.reportIconWrapper}>
                          <div style={{ ...styles.reportIcon, background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)' }}>
                            <span style={{ fontSize: 32, color: '#dc2626' }}>📄</span>
                          </div>
                        </div>
                        <h4 style={styles.reportTitle}>PDF Report</h4>
                        <p style={styles.reportDesc}>Comprehensive PDF document</p>
                        <button
                          onClick={() => downloadComprehensivePDF({})}
                          disabled={reportLoading}
                          style={reportLoading ? styles.reportButtonDisabled : styles.reportButton}
                        >
                          {reportLoading ? 'Generating...' : 'Download PDF'}
                        </button>
                      </div>

                      {/* Excel Report */}
                      <div style={styles.reportOption}>
                        <div style={styles.reportIconWrapper}>
                          <div style={{ ...styles.reportIcon, background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)' }}>
                            <span style={{ fontSize: 32, color: '#059669' }}>📊</span>
                          </div>
                        </div>
                        <h4 style={styles.reportTitle}>Excel Report</h4>
                        <p style={styles.reportDesc}>Detailed spreadsheet analysis</p>
                        <button
                          onClick={() => downloadComprehensiveExcel({})}
                          disabled={reportLoading}
                          style={reportLoading ? styles.reportButtonDisabled : { ...styles.reportButton, background: 'linear-gradient(135deg, #059669 0%, #047857 100%)' }}
                        >
                          {reportLoading ? 'Generating...' : 'Download Excel'}
                        </button>
                      </div>
                    </div>

                    <div style={styles.infoCard}>
                      <h4 style={styles.infoTitle}>📋 Report Includes:</h4>
                      <ul style={styles.infoList}>
                        <li style={styles.infoItem}>✓ Executive Summary</li>
                        <li style={styles.infoItem}>✓ Emissions Breakdown (Scope 1, 2, 3)</li>
                        <li style={styles.infoItem}>✓ Activity Details</li>
                        <li style={styles.infoItem}>✓ Charts and Visualizations</li>
                        <li style={styles.infoItem}>✓ Recommendations</li>
                        <li style={styles.infoItem}>✓ Compliance Information</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* Recent Reports */}
                <div style={styles.chartCard}>
                  <h3 style={styles.chartTitle}>Recent Reports</h3>
                  {reports.length === 0 ? (
                    <div style={styles.noDataChart}>
                      <div style={styles.noDataIcon}>📄</div>
                      <p style={styles.noDataText}>No reports generated yet</p>
                      <p style={styles.noDataSubtext}>Generate your first report above!</p>
                    </div>
                  ) : (
                    <div style={styles.reportsList}>
                      {reports.map((report, index) => (
                        <div key={index} style={styles.reportItem}>
                          <div>
                            <p style={styles.reportItemTitle}>{report.title || 'Sustainability Report'}</p>
                            <p style={styles.reportItemDate}>
                              Generated: {new Date(report.generated_at).toLocaleDateString()}
                            </p>
                          </div>
                          <button style={styles.downloadButton}>Download</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* RECOMMENDATIONS TAB */}
            {activeTab === 'recommendations' && (
              <div style={styles.contentInner}>
                <div style={styles.reportsHeader}>
                  <div>
                    <h2 style={styles.sectionTitle}>🤖 AI Recommendations</h2>
                    <p style={styles.sectionSubtitle}>AI-powered suggestions to reduce your carbon footprint</p>
                  </div>
                  <button
                    onClick={fetchRecommendations}
                    disabled={recommendationsLoading}
                    style={recommendationsLoading ? styles.refreshButtonDisabled : styles.refreshButton}
                  >
                    {recommendationsLoading ? 'Loading...' : '🔄 Refresh'}
                  </button>
                </div>

                {recommendationsLoading ? (
                  <div style={styles.loadingContainer}>
                    <div style={styles.spinner}></div>
                    <p style={styles.loadingText}>Generating AI recommendations...</p>
                  </div>
                ) : recommendations.length === 0 ? (
                  <div style={styles.emptyRecommendations}>
                    <div style={styles.noDataIcon}>💡</div>
                    <p style={styles.noDataText}>No recommendations yet</p>
                    <p style={styles.noDataSubtext}>Add more activities to get personalized AI recommendations</p>
                  </div>
                ) : (
                  <div style={styles.recommendationsList}>
                    {recommendations.map((rec, index) => {
                      const colors = getPriorityColor(rec.priority);
                      return (
                        <div key={index} style={styles.recommendationCard}>
                          <div style={styles.recommendationHeader}>
                            <span style={styles.priorityIcon}>{getPriorityIcon(rec.priority)}</span>
                            <div style={styles.recommendationTitleSection}>
                              <h3 style={styles.recommendationTitle}>{rec.title}</h3>
                              <span style={{
                                ...styles.priorityBadge,
                                background: colors.bg,
                                color: colors.text,
                                border: `1px solid ${colors.border}`
                              }}>
                                {rec.priority} Priority
                              </span>
                            </div>
                          </div>
                          <p style={styles.recommendationDesc}>{rec.description}</p>

                          {rec.estimated_impact && (
                            <div style={styles.impactBadge}>
                              💡 Potential Reduction: {rec.estimated_impact.toFixed(2)} kg CO₂e
                            </div>
                          )}

                          {rec.implementation_steps && rec.implementation_steps.length > 0 && (
                            <details style={styles.implementationDetails}>
                              <summary style={styles.detailsSummary}>
                                View Implementation Steps
                              </summary>
                              <ul style={styles.implementationList}>
                                {rec.implementation_steps.map((step, idx) => (
                                  <li key={idx} style={styles.implementationItem}>{step}</li>
                                ))}
                              </ul>
                            </details>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

const styles = {
  content: {
    padding: '2rem',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    minHeight: '100vh'
  },
  header: {
    marginBottom: '2rem'
  },
  title: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: '0.5rem',
    letterSpacing: '-0.025em'
  },
  subtitle: {
    fontSize: '1rem',
    color: '#64748b',
    fontWeight: '500'
  },
  tabContainer: {
    background: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
    overflow: 'hidden',
    border: '1px solid #e2e8f0'
  },
  tabHeader: {
    display: 'flex',
    borderBottom: '2px solid #e2e8f0',
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)'
  },
  tab: {
    flex: 1,
    padding: '1.25rem 1.5rem',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.3s',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    color: '#64748b',
    fontWeight: '600',
    fontSize: '0.95rem'
  },
  tabActive: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: '#ffffff',
    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
    borderRadius: '12px 12px 0 0'
  },
  tabIcon: {
    fontSize: '1.25rem'
  },
  tabLabel: {
    fontSize: '0.95rem',
    fontWeight: '600'
  },
  tabContent: {
    padding: '2rem'
  },
  contentInner: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.5rem'
  },
  kpiCard: {
    padding: '1.5rem',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    boxShadow: '0 4px 14px rgba(0,0,0,0.08)',
    border: '1px solid rgba(255,255,255,0.6)',
    transition: 'transform 0.3s, box-shadow 0.3s'
  },
  kpiIcon: {
    fontSize: '3rem',
    opacity: 0.9
  },
  kpiContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem'
  },
  kpiValue: {
    fontSize: '1.75rem',
    fontWeight: '800',
    letterSpacing: '-0.025em'
  },
  kpiLabel: {
    fontSize: '0.875rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.025em'
  },
  kpiUnit: {
    fontSize: '0.75rem',
    fontWeight: '500',
    opacity: 0.8
  },
  chartGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '1.5rem'
  },
  chartCard: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
    border: '1px solid #e2e8f0'
  },
  chartTitle: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: '1rem',
    letterSpacing: '-0.025em'
  },
  noDataChart: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '280px',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    borderRadius: '12px',
    border: '1px solid #e2e8f0'
  },
  noDataIcon: {
    fontSize: '3rem',
    marginBottom: '0.75rem',
    opacity: 0.3,
    color: '#94a3b8'
  },
  noDataText: {
    fontSize: '1rem',
    color: '#64748b',
    fontWeight: '600',
    marginBottom: '0.25rem'
  },
  noDataSubtext: {
    fontSize: '0.875rem',
    color: '#94a3b8',
    fontWeight: '500'
  },
  summaryCard: {
    background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
    borderRadius: '12px',
    padding: '1rem 1.5rem',
    border: '1px solid #93c5fd'
  },
  summaryText: {
    fontSize: '0.95rem',
    color: '#1e3a8a',
    fontWeight: '500',
    margin: 0
  },
  loadingContainer: {
    minHeight: '320px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    borderRadius: '16px',
    border: '1px solid #e2e8f0'
  },
  spinner: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    border: '6px solid #e2e8f0',
    borderTopColor: '#1e40af',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    marginTop: '1rem',
    fontSize: '1rem',
    color: '#64748b',
    fontWeight: '600'
  },
  reportsHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem'
  },
  sectionTitle: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: '0.25rem',
    letterSpacing: '-0.025em'
  },
  sectionSubtitle: {
    fontSize: '0.95rem',
    color: '#64748b',
    fontWeight: '500'
  },
  generateButton: {
    padding: '0.875rem 1.5rem',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '0.95rem',
    boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
    transition: 'all 0.3s'
  },
  closeButton: {
    padding: '0.875rem 1.5rem',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '0.95rem',
    boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)',
    transition: 'all 0.3s'
  },
  generateCard: {
    background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
    borderRadius: '16px',
    padding: '2rem',
    border: '1px solid #6ee7b7'
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#064e3b',
    marginBottom: '1.5rem',
    letterSpacing: '-0.025em'
  },
  errorCard: {
    background: '#fee2e2',
    borderRadius: '12px',
    padding: '1rem 1.5rem',
    marginBottom: '1rem',
    border: '1px solid #fecaca'
  },
  errorText: {
    color: '#991b1b',
    fontSize: '0.95rem',
    fontWeight: '600',
    margin: 0
  },
  reportGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
    marginBottom: '1.5rem'
  },
  reportOption: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '2rem',
    textAlign: 'center',
    border: '1px solid #e2e8f0',
    boxShadow: '0 4px 14px rgba(0,0,0,0.06)'
  },
  reportIconWrapper: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '1rem'
  },
  reportIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(0,0,0,0.08)'
  },
  reportTitle: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: '0.5rem',
    letterSpacing: '-0.025em'
  },
  reportDesc: {
    fontSize: '0.875rem',
    color: '#64748b',
    marginBottom: '1.5rem'
  },
  reportButton: {
    width: '100%',
    padding: '0.875rem 1.5rem',
    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '0.95rem',
    boxShadow: '0 4px 14px rgba(220, 38, 38, 0.3)',
    transition: 'all 0.3s'
  },
  reportButtonDisabled: {
    width: '100%',
    padding: '0.875rem 1.5rem',
    background: '#94a3b8',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'not-allowed',
    fontWeight: '700',
    fontSize: '0.95rem'
  },
  infoCard: {
    background: '#dbeafe',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid #93c5fd'
  },
  infoTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#1e3a8a',
    marginBottom: '0.75rem',
    letterSpacing: '-0.025em'
  },
  infoList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  infoItem: {
    fontSize: '0.875rem',
    color: '#1e40af',
    fontWeight: '500'
  },
  reportsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem'
  },
  reportItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1.25rem',
    background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    transition: 'all 0.3s'
  },
  reportItemTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: '0.25rem'
  },
  reportItemDate: {
    fontSize: '0.875rem',
    color: '#64748b',
    margin: 0
  },
  downloadButton: {
    padding: '0.75rem 1.25rem',
    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '0.875rem',
    boxShadow: '0 4px 14px rgba(59, 130, 246, 0.3)',
    transition: 'all 0.3s'
  },
  refreshButton: {
    padding: '0.875rem 1.5rem',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: '0.95rem',
    boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)',
    transition: 'all 0.3s'
  },
  refreshButtonDisabled: {
    padding: '0.875rem 1.5rem',
    background: '#94a3b8',
    color: '#ffffff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'not-allowed',
    fontWeight: '700',
    fontSize: '0.95rem'
  },
  emptyRecommendations: {
    background: 'linear-gradient(135deg, #fae8ff 0%, #f3e8ff 100%)',
    borderRadius: '16px',
    padding: '4rem 2rem',
    textAlign: 'center',
    border: '1px solid #e9d5ff'
  },
  recommendationsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem'
  },
  recommendationCard: {
    background: '#ffffff',
    borderRadius: '16px',
    padding: '1.75rem',
    boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
    border: '1px solid #e2e8f0',
    transition: 'all 0.3s'
  },
  recommendationHeader: {
    display: 'flex',
    alignItems: 'start',
    gap: '1rem',
    marginBottom: '1rem'
  },
  priorityIcon: {
    fontSize: '2rem'
  },
  recommendationTitleSection: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    flexWrap: 'wrap'
  },
  recommendationTitle: {
    fontSize: '1.125rem',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
    letterSpacing: '-0.025em'
  },
  priorityBadge: {
    padding: '0.375rem 0.75rem',
    borderRadius: '8px',
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.025em'
  },
  recommendationDesc: {
    fontSize: '0.95rem',
    color: '#475569',
    lineHeight: '1.6',
    marginBottom: '1rem'
  },
  impactBadge: {
    display: 'inline-block',
    padding: '0.625rem 1rem',
    background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
    borderRadius: '10px',
    fontSize: '0.875rem',
    fontWeight: '700',
    color: '#065f46',
    marginBottom: '1rem',
    border: '1px solid #6ee7b7'
  },
  implementationDetails: {
    marginTop: '1rem'
  },
  detailsSummary: {
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '700',
    color: '#3b82f6',
    padding: '0.5rem 0',
    userSelect: 'none'
  },
  implementationList: {
    marginTop: '0.75rem',
    marginLeft: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  implementationItem: {
    fontSize: '0.875rem',
    color: '#475569',
    lineHeight: '1.6'
  }
};

// Add spinner animation
const styleTag = document.createElement('style');
styleTag.innerHTML = `@keyframes spin { to { transform: rotate(360deg); } }`;
document.head.appendChild(styleTag);

export default AnalyticsReports;