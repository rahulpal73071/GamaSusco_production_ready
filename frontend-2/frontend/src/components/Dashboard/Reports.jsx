import { useState, useEffect } from 'react';
import { reportsAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import DashboardLayout from './DashboardLayout';
import CBAMReporting from './CBAMReporting';

function Reports({ user }) {
  const { colors, isDark } = useTheme();
  const { isMobile, isTablet } = useResponsive();
  
  const [activeReportTab, setActiveReportTab] = useState('standard'); // 'standard' or 'cbam'
  const [reports, setReports] = useState([]);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [companyProfile, setCompanyProfile] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchCompanyProfile();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await reportsAPI.getDashboard();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const fetchCompanyProfile = async () => {
    try {
      const response = await reportsAPI.getCompanyProfile();
      setCompanyProfile(response.data);
    } catch (error) {
      console.error('Error fetching company profile:', error);
    }
  };

  const generateReport = async (config) => {
    try {
      setLoading(true);
      const response = await reportsAPI.generateReport(config);
      setReports(prev => [{...response.data, config, generated_at: new Date()}, ...prev]);
      setShowGenerateModal(false);
      setError('');
    } catch (error) {
      console.error('Error generating report:', error);
      setError(error.response?.data?.detail || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const downloadComprehensivePDF = async (config) => {
    try {
      setLoading(true);
      setError('');
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
      setError(error.response?.data?.detail || 'Failed to generate PDF report');
    } finally {
      setLoading(false);
    }
  };

  const downloadComprehensiveExcel = async (config) => {
    try {
      setLoading(true);
      setError('');
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
      setError(error.response?.data?.detail || 'Failed to generate Excel report');
    } finally {
      setLoading(false);
    }
  };

  const downloadComprehensiveCSV = async (config) => {
    try {
      setLoading(true);
      setError('');
      const response = await reportsAPI.generateComprehensiveCSV(config);
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sustainability_report_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      setShowGenerateModal(false);
    } catch (error) {
      console.error('Error generating CSV:', error);
      setError(error.response?.data?.detail || 'Failed to generate CSV report');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (config, format) => {
    try {
      setLoading(true);
      let response;
      if (format === 'csv') {
        response = await reportsAPI.exportCSV(config);
      } else {
        response = await reportsAPI.exportExcel(config);
      }
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `emissions_report_${new Date().toISOString().split('T')[0]}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
      setError('Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  // Metric cards configuration
  const metricsConfig = [
    {
      icon: '🌍',
      title: 'Total Emissions',
      value: `${(dashboardData?.current_month?.total_emissions_kg / 1000)?.toFixed(1) || 0} t`,
      change: `${dashboardData?.current_month?.comparison_percent?.toFixed(1) || 0}%`,
      gradientLight: 'linear-gradient(135deg, #FEE2E2 0%, #FECACA 100%)',
      gradientDark: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.15) 100%)',
      accentColor: '#EF4444',
      textColorLight: '#991B1B',
      textColorDark: '#F87171',
    },
    {
      icon: '📋',
      title: 'Total Activities',
      value: dashboardData?.quick_stats?.total_activities_tracked || 0,
      gradientLight: 'linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)',
      gradientDark: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, rgba(37, 99, 235, 0.15) 100%)',
      accentColor: '#3B82F6',
      textColorLight: '#1E40AF',
      textColorDark: '#60A5FA',
    },
    {
      icon: '🎯',
      title: 'Active Goals',
      value: dashboardData?.active_goals?.length || 0,
      gradientLight: 'linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%)',
      gradientDark: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.15) 100%)',
      accentColor: '#10B981',
      textColorLight: '#065F46',
      textColorDark: '#34D399',
    },
    {
      icon: '📈',
      title: 'Lifetime Emissions',
      value: `${(dashboardData?.quick_stats?.total_lifetime_emissions / 1000)?.toFixed(1) || 0} t`,
      gradientLight: 'linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%)',
      gradientDark: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2) 0%, rgba(124, 58, 237, 0.15) 100%)',
      accentColor: '#8B5CF6',
      textColorLight: '#5B21B6',
      textColorDark: '#A78BFA',
    },
  ];

  // Quick action cards configuration
  const quickActionsConfig = [
    {
      title: 'Comprehensive PDF Report',
      description: 'Full sustainability report with charts, tables, and recommendations',
      icon: '📄',
      buttonText: 'Generate PDF',
      color: '#667EEA',
      gradientLight: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
      gradientDark: 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.1) 100%)',
    },
    {
      title: 'Excel Data Export',
      description: 'Multi-sheet Excel workbook with charts and all activities',
      icon: '📊',
      buttonText: 'Generate Excel',
      color: '#10B981',
      gradientLight: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
      gradientDark: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.1) 100%)',
    },
    {
      title: 'CSV Export',
      description: 'Comprehensive CSV report with all activities and metrics',
      icon: '📋',
      buttonText: 'Generate CSV',
      color: '#F59E0B',
      gradientLight: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
      gradientDark: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.1) 100%)',
    },
  ];

  return (
    <DashboardLayout>
      <div style={{
        minHeight: '100vh',
        background: isDark ? colors.bgSecondary : '#F0F4FF',
        transition: 'background 0.3s ease',
      }}>
        {/* Hero Header */}
        <div style={{
          background: isDark 
            ? 'linear-gradient(135deg, #4338CA 0%, #6366F1 100%)' 
            : 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
          borderRadius: isMobile ? '12px' : '16px',
          padding: isMobile ? '20px' : isTablet ? '28px' : '32px',
          marginBottom: isMobile ? '16px' : '24px',
          color: 'white',
          boxShadow: isDark 
            ? '0 8px 32px rgba(67, 56, 202, 0.4)' 
            : '0 8px 32px rgba(102, 126, 234, 0.3)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Decorative elements */}
          <div style={{
            position: 'absolute',
            top: '10%',
            right: '5%',
            fontSize: isMobile ? '40px' : '60px',
            opacity: 0.15,
          }}>📊</div>
          <div style={{
            position: 'absolute',
            bottom: '10%',
            right: '15%',
            fontSize: isMobile ? '30px' : '40px',
            opacity: 0.1,
          }}>📄</div>
          
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
                textShadow: '0 2px 4px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                📊 Reports & Analytics
              </h1>
              <p style={{
                fontSize: isMobile ? '13px' : '15px',
                margin: 0,
                opacity: 0.9,
                lineHeight: 1.4,
                maxWidth: '500px',
              }}>
                Generate comprehensive sustainability reports with emissions, water, waste, and compliance data
              </p>
            </div>
            
            <button
              onClick={() => setShowGenerateModal(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: isMobile ? '10px 16px' : '12px 20px',
                background: 'rgba(255, 255, 255, 0.2)',
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
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isMobile) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                }
              }}
            >
              ➕ Generate Report
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          borderBottom: `2px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB'}`,
        }}>
          <button
            onClick={() => setActiveReportTab('standard')}
            style={{
              padding: '12px 24px',
              background: activeReportTab === 'standard' 
                ? 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)'
                : 'transparent',
              color: activeReportTab === 'standard' ? 'white' : colors.textSecondary,
              border: 'none',
              borderBottom: activeReportTab === 'standard' 
                ? '3px solid #667EEA' 
                : '3px solid transparent',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 0.2s',
            }}
          >
            📊 Standard Reports
          </button>
          <button
            onClick={() => setActiveReportTab('cbam')}
            style={{
              padding: '12px 24px',
              background: activeReportTab === 'cbam' 
                ? 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)'
                : 'transparent',
              color: activeReportTab === 'cbam' ? 'white' : colors.textSecondary,
              border: 'none',
              borderBottom: activeReportTab === 'cbam' 
                ? '3px solid #667EEA' 
                : '3px solid transparent',
              borderRadius: '8px 8px 0 0',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'all 0.2s',
            }}
          >
            🌍 CBAM Reporting
          </button>
        </div>

        {/* Conditional Content Based on Active Tab */}
        {activeReportTab === 'cbam' ? (
          <CBAMReporting 
            user={user}
            isDark={isDark}
            colors={colors}
            isMobile={isMobile}
          />
        ) : (
          <>
            {/* Error Box */}
            {error && (
          <div style={{
            padding: '14px 18px',
            background: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
            border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA'}`,
            borderRadius: '12px',
            color: isDark ? '#F87171' : '#DC2626',
            fontSize: '14px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span>❌ {error}</span>
            <button 
              onClick={() => setError('')} 
              style={{
                background: 'none',
                border: 'none',
                fontSize: '18px',
                color: isDark ? '#F87171' : '#DC2626',
                cursor: 'pointer',
                padding: '0 8px',
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Dashboard Overview */}
        {dashboardData && (
          <div style={{ marginBottom: isMobile ? '20px' : '28px' }}>
            <h2 style={{
              fontSize: isMobile ? '18px' : '20px',
              fontWeight: '700',
              color: colors.text,
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              📈 Dashboard Overview
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr 1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
              gap: isMobile ? '10px' : '14px',
            }}>
              {metricsConfig.map((metric, index) => (
                <MetricCard 
                  key={index} 
                  metric={metric} 
                  isDark={isDark} 
                  isMobile={isMobile}
                  colors={colors}
                />
              ))}
            </div>
          </div>
        )}

        {/* Company Profile Section */}
        {companyProfile && (
          <div style={{ marginBottom: isMobile ? '20px' : '28px' }}>
            <h2 style={{
              fontSize: isMobile ? '18px' : '20px',
              fontWeight: '700',
              color: colors.text,
              margin: '0 0 16px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              🏢 Company Profile
            </h2>
            <div style={{
              background: isDark 
                ? 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)' 
                : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
              padding: isMobile ? '16px' : '20px',
              borderRadius: isMobile ? '12px' : '16px',
              border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
              boxShadow: isDark 
                ? '0 4px 16px rgba(0,0,0,0.3)' 
                : '0 4px 16px rgba(0,0,0,0.06)',
            }}>
              {[
                { label: 'Company Name', value: companyProfile.company_name },
                { label: 'Industry', value: companyProfile.industry },
                { label: 'Reporting Officer', value: companyProfile.reporting_officer },
                { label: 'Email', value: companyProfile.email },
              ].map((item, index, arr) => (
                <div 
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '12px 0',
                    borderBottom: index < arr.length - 1 
                      ? `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}` 
                      : 'none',
                  }}
                >
                  <span style={{
                    fontSize: '13px',
                    color: colors.textSecondary,
                    fontWeight: '500',
                  }}>
                    {item.label}
                  </span>
                  <span style={{
                    fontSize: '13px',
                    color: colors.text,
                    fontWeight: '600',
                  }}>
                    {item.value || '-'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div style={{ marginBottom: isMobile ? '20px' : '28px' }}>
          <h2 style={{
            fontSize: isMobile ? '18px' : '20px',
            fontWeight: '700',
            color: colors.text,
            margin: '0 0 16px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            ⚡ Quick Report Generation
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
            gap: isMobile ? '12px' : '16px',
          }}>
            {quickActionsConfig.map((action, index) => (
              <QuickActionCard
                key={index}
                action={action}
                isDark={isDark}
                isMobile={isMobile}
                colors={colors}
                onClick={() => setShowGenerateModal(true)}
              />
            ))}
          </div>
        </div>

        {/* Generated Reports List */}
        <div style={{
          background: isDark 
            ? 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)' 
            : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: isMobile ? '12px' : '16px',
          padding: isMobile ? '16px' : '24px',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
          boxShadow: isDark 
            ? '0 8px 32px rgba(0,0,0,0.3)' 
            : '0 8px 32px rgba(0,0,0,0.06)',
        }}>
          <h2 style={{
            fontSize: isMobile ? '18px' : '20px',
            fontWeight: '700',
            color: colors.text,
            margin: '0 0 20px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            📄 Recent Reports
          </h2>

          {reports.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: isMobile ? '40px 20px' : '60px 20px',
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px', opacity: 0.3 }}>📊</div>
              <p style={{
                fontSize: '18px',
                fontWeight: '600',
                color: colors.text,
                marginBottom: '8px',
              }}>
                No reports generated yet
              </p>
              <p style={{
                fontSize: '14px',
                color: colors.textSecondary,
                marginBottom: '24px',
              }}>
                Generate your first comprehensive sustainability report
              </p>
              <button
                onClick={() => setShowGenerateModal(true)}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                }}
              >
                Generate First Report
              </button>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: isMobile ? '12px' : '16px',
            }}>
              {reports.map((report, index) => (
                <ReportCard
                  key={index}
                  report={report}
                  onExport={exportReport}
                  isDark={isDark}
                  colors={colors}
                  isMobile={isMobile}
                />
              ))}
            </div>
          )}
        </div>

            {/* Generate Report Modal */}
            {showGenerateModal && (
              <GenerateReportModal
                user={user}
                onClose={() => {
                  setShowGenerateModal(false);
                  setError('');
                }}
                onGenerate={generateReport}
                onGeneratePDF={downloadComprehensivePDF}
                onGenerateExcel={downloadComprehensiveExcel}
                onGenerateCSV={downloadComprehensiveCSV}
                loading={loading}
                isDark={isDark}
                colors={colors}
                isMobile={isMobile}
              />
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

// Metric Card Component
function MetricCard({ metric, isDark, isMobile, colors }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div
      style={{
        background: isDark ? metric.gradientDark : metric.gradientLight,
        padding: isMobile ? '14px' : '18px',
        borderRadius: isMobile ? '12px' : '14px',
        border: `1px solid ${isDark ? `${metric.accentColor}30` : `${metric.accentColor}40`}`,
        boxShadow: isHovered 
          ? `0 8px 24px ${metric.accentColor}30` 
          : `0 4px 12px ${metric.accentColor}15`,
        transition: 'all 0.3s ease',
        transform: isHovered && !isMobile ? 'translateY(-4px)' : 'translateY(0)',
        display: 'flex',
        alignItems: 'center',
        gap: isMobile ? '10px' : '14px',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{
        fontSize: isMobile ? '24px' : '32px',
        flexShrink: 0,
      }}>
        {metric.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: isMobile ? '18px' : '22px',
          fontWeight: '800',
          color: isDark ? metric.textColorDark : metric.textColorLight,
          lineHeight: 1.1,
          marginBottom: '2px',
        }}>
          {metric.value}
        </div>
        <div style={{
          fontSize: isMobile ? '10px' : '11px',
          color: colors.textSecondary,
          fontWeight: '500',
        }}>
          {metric.title}
        </div>
        {metric.change && (
          <div style={{
            fontSize: '10px',
            fontWeight: '600',
            marginTop: '2px',
            color: metric.change.startsWith('-') ? '#10B981' : '#EF4444',
          }}>
            {metric.change}
          </div>
        )}
      </div>
    </div>
  );
}

// Quick Action Card Component
function QuickActionCard({ action, isDark, isMobile, colors, onClick }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div
      style={{
        background: isDark ? action.gradientDark : action.gradientLight,
        padding: isMobile ? '16px' : '20px',
        borderRadius: isMobile ? '12px' : '14px',
        border: `1px solid ${isDark ? `${action.color}30` : `${action.color}25`}`,
        textAlign: 'center',
        transition: 'all 0.3s ease',
        transform: isHovered && !isMobile ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: isHovered 
          ? `0 8px 24px ${action.color}25` 
          : `0 4px 12px ${action.color}10`,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{
        width: isMobile ? '50px' : '60px',
        height: isMobile ? '50px' : '60px',
        margin: '0 auto 14px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: isMobile ? '24px' : '28px',
        background: `${action.color}20`,
      }}>
        {action.icon}
      </div>
      <h3 style={{
        fontSize: isMobile ? '15px' : '16px',
        fontWeight: '600',
        color: colors.text,
        marginBottom: '8px',
      }}>
        {action.title}
      </h3>
      <p style={{
        fontSize: isMobile ? '12px' : '13px',
        color: colors.textSecondary,
        marginBottom: '16px',
        lineHeight: 1.4,
      }}>
        {action.description}
      </p>
      <button
        onClick={onClick}
        style={{
          width: '100%',
          padding: isMobile ? '10px 16px' : '12px 20px',
          background: action.color,
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          fontSize: isMobile ? '13px' : '14px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s',
          opacity: isHovered ? 0.9 : 1,
        }}
      >
        {action.buttonText}
      </button>
    </div>
  );
}

// Report Card Component
function ReportCard({ report, onExport, isDark, colors, isMobile }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format) => {
    setExporting(true);
    try {
      await onExport(report.config || {}, format);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div style={{
      background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
      border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
      borderRadius: '12px',
      padding: isMobile ? '14px' : '18px',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '14px',
      }}>
        <h3 style={{
          fontSize: isMobile ? '15px' : '16px',
          fontWeight: '600',
          color: colors.text,
          margin: 0,
        }}>
          📄 Emission Report
        </h3>
        <span style={{
          fontSize: '11px',
          color: colors.textSecondary,
          background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
          padding: '4px 8px',
          borderRadius: '6px',
        }}>
          {report.generated_at ? new Date(report.generated_at).toLocaleDateString() : new Date().toLocaleDateString()}
        </span>
      </div>

      <div style={{ marginBottom: '14px' }}>
        {[
          { label: 'Total Emissions', value: `${(report.summary?.total_emissions_kg / 1000)?.toFixed(1) || 0} t` },
          { label: 'Activities', value: report.summary?.total_activities || 0 },
          { label: 'Top Category', value: report.summary?.top_category || 'N/A' },
        ].map((item, index) => (
          <div 
            key={index}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '6px',
            }}
          >
            <span style={{ fontSize: '12px', color: colors.textSecondary }}>{item.label}</span>
            <span style={{ fontSize: '12px', fontWeight: '600', color: colors.text }}>{item.value}</span>
          </div>
        ))}
      </div>

      <div style={{
        display: 'flex',
        gap: '8px',
      }}>
        <button
          style={{
            flex: 1,
            padding: '8px 12px',
            background: isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6',
            color: colors.text,
            border: 'none',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: exporting ? 'not-allowed' : 'pointer',
            opacity: exporting ? 0.6 : 1,
          }}
          onClick={() => handleExport('csv')}
          disabled={exporting}
        >
          {exporting ? '⏳' : '📄'} CSV
        </button>
        <button
          style={{
            flex: 1,
            padding: '8px 12px',
            background: isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6',
            color: colors.text,
            border: 'none',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: '600',
            cursor: exporting ? 'not-allowed' : 'pointer',
            opacity: exporting ? 0.6 : 1,
          }}
          onClick={() => handleExport('excel')}
          disabled={exporting}
        >
          {exporting ? '⏳' : '📊'} Excel
        </button>
      </div>
    </div>
  );
}

// Generate Report Modal Component
function GenerateReportModal({ user, onClose, onGenerate, onGeneratePDF, onGenerateExcel, onGenerateCSV, loading, isDark, colors, isMobile }) {
  const [config, setConfig] = useState({
    report_type: 'comprehensive',
    date_range: {
      start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
      end_date: new Date().toISOString().split('T')[0]
    },
    scope: null,
    category: '',
    include_water: true,
    include_waste: true,
    include_scope3: true,
    group_by: 'month',
    export_format: 'pdf'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (config.export_format === 'pdf') {
      await onGeneratePDF(config);
    } else if (config.export_format === 'excel') {
      await onGenerateExcel(config);
    } else if (config.export_format === 'csv') {
      await onGenerateCSV(config);
    } else {
      await onGenerate(config);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : '#d1d5db'}`,
    borderRadius: '10px',
    fontSize: '14px',
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'white',
    color: colors.text,
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: '8px',
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        padding: isMobile ? '16px' : '32px',
      }} 
      onClick={onClose}
    >
      <div 
        style={{
          background: isDark 
            ? 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)' 
            : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '700px',
          maxHeight: '90vh',
          overflow: 'auto',
          border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
          boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
        }} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: isMobile ? '16px' : '20px 24px',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        }}>
          <h2 style={{
            fontSize: isMobile ? '18px' : '22px',
            fontWeight: '700',
            color: colors.text,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            📊 Generate Report
          </h2>
          <button 
            onClick={onClose} 
            style={{
              background: isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: colors.textSecondary,
              padding: '8px 12px',
              borderRadius: '8px',
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: isMobile ? '16px' : '24px' }}>
          {/* Report Format Selection */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>📄 Report Format</label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: '10px',
            }}>
              {[
                { value: 'pdf', label: '📄 PDF Report', color: '#667EEA' },
                { value: 'excel', label: '📊 Excel Workbook', color: '#10B981' },
                { value: 'csv', label: '📋 CSV Report', color: '#F59E0B' },
              ].map((format) => (
                <button
                  key={format.value}
                  type="button"
                  style={{
                    padding: '12px 16px',
                    background: config.export_format === format.value 
                      ? format.color 
                      : (isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6'),
                    color: config.export_format === format.value 
                      ? 'white' 
                      : colors.textSecondary,
                    border: `2px solid ${config.export_format === format.value ? format.color : (isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB')}`,
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onClick={() => setConfig({...config, export_format: format.value})}
                >
                  {format.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '16px',
            marginBottom: '20px',
          }}>
            <div>
              <label style={labelStyle}>📅 Start Date</label>
              <input
                type="date"
                value={config.date_range.start_date}
                onChange={(e) => setConfig({
                  ...config,
                  date_range: {...config.date_range, start_date: e.target.value}
                })}
                style={inputStyle}
                required
              />
            </div>
            <div>
              <label style={labelStyle}>📅 End Date</label>
              <input
                type="date"
                value={config.date_range.end_date}
                onChange={(e) => setConfig({
                  ...config,
                  date_range: {...config.date_range, end_date: e.target.value}
                })}
                style={inputStyle}
                required
              />
            </div>
          </div>

          {/* Inclusions */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>📊 Include in Report</label>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}>
              {[
                { key: 'include_water', label: '💧 Water Usage Data', checked: config.include_water },
                { key: 'include_waste', label: '🗑️ Waste Management Data', checked: config.include_waste },
                { key: 'include_scope3', label: '🔗 Scope 3 Breakdown', checked: config.include_scope3 },
              ].map((item) => (
                <label 
                  key={item.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    fontSize: '14px',
                    color: colors.text,
                    cursor: 'pointer',
                    padding: '10px 14px',
                    background: item.checked 
                      ? (isDark ? 'rgba(102, 126, 234, 0.15)' : 'rgba(102, 126, 234, 0.1)')
                      : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'),
                    borderRadius: '10px',
                    border: `1px solid ${item.checked 
                      ? (isDark ? 'rgba(102, 126, 234, 0.3)' : 'rgba(102, 126, 234, 0.2)')
                      : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)')}`,
                    transition: 'all 0.2s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    onChange={(e) => setConfig({...config, [item.key]: e.target.checked})}
                    style={{
                      width: '18px',
                      height: '18px',
                      cursor: 'pointer',
                      accentColor: '#667EEA',
                    }}
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
            gap: '16px',
            marginBottom: '20px',
          }}>
            <div>
              <label style={labelStyle}>🎯 Scope Filter</label>
              <select
                value={config.scope || ''}
                onChange={(e) => setConfig({...config, scope: e.target.value ? parseInt(e.target.value) : null})}
                style={{...inputStyle, cursor: 'pointer'}}
              >
                <option value="">All Scopes</option>
                <option value="1">Scope 1</option>
                <option value="2">Scope 2</option>
                <option value="3">Scope 3</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>📊 Group By</label>
              <select
                value={config.group_by}
                onChange={(e) => setConfig({...config, group_by: e.target.value})}
                style={{...inputStyle, cursor: 'pointer'}}
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="quarter">Quarter</option>
                <option value="year">Year</option>
              </select>
            </div>
          </div>

          {/* Category Filter */}
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>🏷️ Category Filter (Optional)</label>
            <input
              type="text"
              value={config.category}
              onChange={(e) => setConfig({...config, category: e.target.value})}
              placeholder="e.g., electricity, diesel, water"
              style={inputStyle}
            />
          </div>

          {/* Info Box */}
          <div style={{
            background: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF',
            border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.2)' : '#BFDBFE'}`,
            borderRadius: '12px',
            padding: '16px',
            marginBottom: '20px',
          }}>
            <strong style={{ color: isDark ? '#60A5FA' : '#1E40AF', fontSize: '13px' }}>
              ℹ️ Report Contents:
            </strong>
            <ul style={{
              margin: '8px 0 0 0',
              paddingLeft: '20px',
              fontSize: '12px',
              color: isDark ? '#93C5FD' : '#1E40AF',
              lineHeight: 1.6,
            }}>
              <li>Executive Summary with key metrics</li>
              <li>Emissions breakdown by Scope (1, 2, 3) with charts</li>
              <li>Water usage analysis and compliance</li>
              <li>Waste management metrics and recycling rate</li>
              <li>Trend analysis with visualizations</li>
              <li>AI-powered recommendations</li>
            </ul>
          </div>

          {/* Actions */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            flexDirection: isMobile ? 'column-reverse' : 'row',
          }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '12px 24px',
                background: isDark ? 'rgba(255,255,255,0.1)' : '#F3F4F6',
                color: colors.textSecondary,
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '12px 24px',
                background: loading 
                  ? (isDark ? '#475569' : '#9CA3AF')
                  : 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.3)',
              }}
            >
              {loading ? '⏳ Generating...' :
                config.export_format === 'pdf' ? '📄 Generate PDF' :
                config.export_format === 'excel' ? '📊 Generate Excel' :
                config.export_format === 'csv' ? '📋 Generate CSV' :
                '✅ Generate Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Reports;
