import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useResponsive } from '../../hooks/useResponsive';
import { cbamAPI } from '../../services/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

function CBAMReporting({ user, isDark, colors, isMobile }) {
  const { isTablet } = useResponsive();
  const [emissionsData, setEmissionsData] = useState([]);
  const [installations, setInstallations] = useState([]);
  const [quarterlyReports, setQuarterlyReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState({
    quarter: Math.floor((new Date().getMonth() + 3) / 3),
    year: new Date().getFullYear()
  });
  const [showInstallationModal, setShowInstallationModal] = useState(false);
  const [showEmissionModal, setShowEmissionModal] = useState(false);

  useEffect(() => {
    if (user?.company_id) {
      fetchCBAMData();
      fetchInstallations();
      fetchQuarterlyReports();
    }
  }, [user, selectedQuarter]);

  const fetchCBAMData = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching CBAM data for company:', user.company_id, 'Quarter:', selectedQuarter);
      const response = await cbamAPI.getAggregatedEmissions(user.company_id, {
        quarter: selectedQuarter.quarter,
        year: selectedQuarter.year
      });
      console.log('CBAM emissions response:', response);
      setEmissionsData(response.data || []);
    } catch (error) {
      console.error('Error fetching CBAM data:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Don't show error if it's just empty data (404 or empty array)
      if (error.response?.status !== 404) {
        setError(`Failed to load CBAM emissions data: ${error.response?.data?.detail || error.message}`);
      }
      setEmissionsData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstallations = async () => {
    try {
      console.log('Fetching installations for company:', user.company_id);
      const response = await cbamAPI.getInstallations(user.company_id);
      console.log('Installations response:', response);
      setInstallations(response.data || []);
    } catch (error) {
      console.error('Error fetching installations:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Don't show error if it's just empty data
      if (error.response?.status !== 404) {
        console.warn('Installations fetch failed, but continuing...');
      }
      setInstallations([]);
    }
  };

  const fetchQuarterlyReports = async () => {
    try {
      console.log('Fetching quarterly reports for company:', user.company_id);
      const response = await cbamAPI.getQuarterlyReports(user.company_id, selectedQuarter.year);
      console.log('Quarterly reports response:', response);
      setQuarterlyReports(response.data || []);
    } catch (error) {
      console.error('Error fetching quarterly reports:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Don't show error if it's just empty data
      if (error.response?.status !== 404) {
        console.warn('Quarterly reports fetch failed, but continuing...');
      }
      setQuarterlyReports([]);
    }
  };

  const generateReport = async () => {
    try {
      setLoading(true);
      setError('');
      await cbamAPI.generateQuarterlyReport(
        user.company_id,
        selectedQuarter.quarter,
        selectedQuarter.year
      );
      await fetchQuarterlyReports();
      alert('✅ Quarterly report generated successfully!');
    } catch (error) {
      console.error('Error generating report:', error);
      setError(error.response?.data?.detail || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const exportXML = async (reportId) => {
    try {
      const response = await cbamAPI.exportReportXML(user.company_id, reportId);
      const blob = new Blob([response.data], { type: 'application/xml' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `cbam_report_${selectedQuarter.quarter}_${selectedQuarter.year}.xml`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting XML:', error);
      alert('Failed to export XML report');
    }
  };

  const totalEmbedded = emissionsData.reduce((sum, d) => sum + (d.totalEmbedded || 0), 0);
  const totalDirect = emissionsData.reduce((sum, d) => sum + (d.direct || 0), 0);
  const totalIndirect = emissionsData.reduce((sum, d) => sum + (d.indirect || 0), 0);

  const styles = {
    container: {
      padding: isMobile ? '16px' : '24px',
    },
    header: {
      marginBottom: '24px',
    },
    title: {
      fontSize: isMobile ? '20px' : '24px',
      fontWeight: '700',
      color: colors.text,
      marginBottom: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: '14px',
    },
    quarterSelector: {
      display: 'flex',
      gap: '12px',
      marginBottom: '24px',
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    select: {
      padding: '10px 16px',
      borderRadius: '8px',
      border: `1px solid ${colors.border}`,
      background: colors.bgSecondary,
      color: colors.text,
      fontSize: '14px',
      cursor: 'pointer',
    },
    input: {
      padding: '10px 16px',
      borderRadius: '8px',
      border: `1px solid ${colors.border}`,
      background: colors.bgSecondary,
      color: colors.text,
      fontSize: '14px',
      width: '100px',
    },
    button: {
      padding: '10px 20px',
      background: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: loading ? 'not-allowed' : 'pointer',
      opacity: loading ? 0.6 : 1,
      transition: 'all 0.2s',
    },
    metricsGrid: {
      display: 'grid',
      gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
      gap: '16px',
      marginBottom: '24px',
    },
    metricCard: {
      background: isDark 
        ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(0,0,0,0.1) 100%)'
        : 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(102, 126, 234, 0.05) 100%)',
      padding: '20px',
      borderRadius: '12px',
      border: `1px solid ${isDark ? 'rgba(102, 126, 234, 0.3)' : 'rgba(102, 126, 234, 0.2)'}`,
    },
    chartContainer: {
      background: colors.bgSecondary,
      padding: '20px',
      borderRadius: '12px',
      marginBottom: '24px',
      border: `1px solid ${colors.border}`,
    },
    tableContainer: {
      background: colors.bgSecondary,
      padding: '20px',
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse',
    },
    th: {
      padding: '12px',
      textAlign: 'left',
      color: colors.textSecondary,
      fontSize: '13px',
      fontWeight: '600',
      borderBottom: `1px solid ${colors.border}`,
    },
    td: {
      padding: '12px',
      color: colors.text,
      fontSize: '13px',
      borderBottom: `1px solid ${colors.border}`,
    },
    errorBox: {
      padding: '14px 18px',
      background: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
      border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA'}`,
      borderRadius: '12px',
      color: isDark ? '#F87171' : '#DC2626',
      fontSize: '14px',
      marginBottom: '20px',
    },
  };

  // Show loading state
  if (loading && emissionsData.length === 0 && installations.length === 0) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
          <p style={{ color: colors.text, fontSize: '16px' }}>Loading CBAM data...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>
          🌍 CBAM Reporting Dashboard
        </h2>
        <p style={styles.subtitle}>
          Carbon Border Adjustment Mechanism - Quarterly emissions reporting for EU imports
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div style={styles.errorBox}>
          <span>❌ {error}</span>
          <button
            onClick={() => setError('')}
            style={{
              float: 'right',
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              fontSize: '18px',
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Quarter Selector */}
      <div style={styles.quarterSelector}>
        <select
          value={selectedQuarter.quarter}
          onChange={(e) => setSelectedQuarter({...selectedQuarter, quarter: parseInt(e.target.value)})}
          style={styles.select}
        >
          <option value="1">Q1</option>
          <option value="2">Q2</option>
          <option value="3">Q3</option>
          <option value="4">Q4</option>
        </select>
        <input
          type="number"
          value={selectedQuarter.year}
          onChange={(e) => setSelectedQuarter({...selectedQuarter, year: parseInt(e.target.value)})}
          style={styles.input}
          min="2020"
          max="2100"
        />
        <button
          onClick={generateReport}
          disabled={loading}
          style={styles.button}
        >
          {loading ? '⏳ Generating...' : '📊 Generate Quarterly Report'}
        </button>
        <button
          onClick={() => setShowInstallationModal(true)}
          style={{
            ...styles.button,
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
          }}
        >
          ➕ Add Installation
        </button>
        <button
          onClick={() => setShowEmissionModal(true)}
          style={{
            ...styles.button,
            background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
          }}
        >
          ➕ Record Emissions
        </button>
      </div>

      {/* Summary Metrics */}
      <div style={styles.metricsGrid}>
        <MetricCard
          title="Total Embedded Emissions"
          value={`${totalEmbedded.toFixed(2)} tCO₂e`}
          icon="🌍"
          color="#EF4444"
          isDark={isDark}
          colors={colors}
        />
        <MetricCard
          title="Direct Emissions"
          value={`${totalDirect.toFixed(2)} tCO₂e`}
          icon="🔥"
          color="#F59E0B"
          isDark={isDark}
          colors={colors}
        />
        <MetricCard
          title="Indirect Emissions"
          value={`${totalIndirect.toFixed(2)} tCO₂e`}
          icon="⚡"
          color="#3B82F6"
          isDark={isDark}
          colors={colors}
        />
      </div>

      {/* Chart */}
      {emissionsData.length > 0 && (
        <div style={styles.chartContainer}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.text, marginBottom: '16px' }}>
            Emissions by Goods Category
          </h3>
          <ResponsiveContainer width="100%" height={isMobile ? 250 : 300}>
            <BarChart data={emissionsData}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis 
                dataKey="goodsCategory" 
                tick={{ fill: colors.textSecondary, fontSize: 12 }}
              />
              <YAxis 
                tick={{ fill: colors.textSecondary, fontSize: 12 }}
                label={{ value: 'tCO₂e', angle: -90, position: 'insideLeft', fill: colors.textSecondary }}
              />
              <Tooltip 
                contentStyle={{
                  background: isDark ? '#1e293b' : '#ffffff',
                  border: `1px solid ${colors.border}`,
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar dataKey="direct" fill="#EF4444" name="Direct Emissions" />
              <Bar dataKey="indirect" fill="#F59E0B" name="Indirect Emissions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Installations Table */}
      <div style={styles.tableContainer}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.text }}>
            Installations ({installations.length})
          </h3>
        </div>
        {installations.length === 0 ? (
          <p style={{ color: colors.textSecondary, textAlign: 'center', padding: '40px' }}>
            No installations registered. Add an installation to start tracking CBAM emissions.
          </p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Installation Name</th>
                  <th style={styles.th}>Country</th>
                  <th style={styles.th}>Operator</th>
                  <th style={styles.th}>Economic Activity</th>
                </tr>
              </thead>
              <tbody>
                {installations.map((inst) => (
                  <tr key={inst.id}>
                    <td style={styles.td}>{inst.installation_name}</td>
                    <td style={styles.td}>{inst.country_code}</td>
                    <td style={styles.td}>{inst.operator_name || '-'}</td>
                    <td style={styles.td}>{inst.economic_activity || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quarterly Reports */}
      {quarterlyReports.length > 0 && (
        <div style={{ ...styles.tableContainer, marginTop: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.text, marginBottom: '16px' }}>
            Quarterly Reports
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Quarter</th>
                  <th style={styles.th}>Year</th>
                  <th style={styles.th}>Total Embedded (tCO₂e)</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {quarterlyReports.map((report) => (
                  <tr key={report.id}>
                    <td style={styles.td}>Q{report.quarter}</td>
                    <td style={styles.td}>{report.year}</td>
                    <td style={styles.td}>
                      {report.total_embedded_emissions?.toFixed(2) || '0.00'}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: '600',
                        background: report.status === 'submitted' 
                          ? (isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5')
                          : (isDark ? 'rgba(245, 158, 11, 0.2)' : '#FEF3C7'),
                        color: report.status === 'submitted' 
                          ? (isDark ? '#34D399' : '#059669')
                          : (isDark ? '#FBBF24' : '#D97706'),
                      }}>
                        {report.status || 'draft'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => exportXML(report.id)}
                        style={{
                          padding: '6px 12px',
                          background: isDark ? 'rgba(102, 126, 234, 0.2)' : '#EEF2FF',
                          color: colors.text,
                          border: `1px solid ${colors.border}`,
                          borderRadius: '6px',
                          fontSize: '12px',
                          cursor: 'pointer',
                        }}
                      >
                        📥 Export XML
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State for Reports */}
      {quarterlyReports.length === 0 && !loading && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          background: colors.bgSecondary,
          borderRadius: '12px',
          border: `1px solid ${colors.border}`,
          marginTop: '24px',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>📊</div>
          <p style={{ color: colors.text, fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
            No quarterly reports generated yet
          </p>
          <p style={{ color: colors.textSecondary, fontSize: '14px' }}>
            Generate your first CBAM quarterly report to get started
          </p>
        </div>
      )}

      {/* Info Message if no data at all */}
      {!loading && emissionsData.length === 0 && installations.length === 0 && quarterlyReports.length === 0 && (
        <div style={{
          background: isDark ? 'rgba(59, 130, 246, 0.1)' : '#EFF6FF',
          border: `1px solid ${isDark ? 'rgba(59, 130, 246, 0.2)' : '#BFDBFE'}`,
          borderRadius: '12px',
          padding: '24px',
          marginTop: '24px',
        }}>
          <h3 style={{ color: isDark ? '#60A5FA' : '#1E40AF', fontSize: '16px', fontWeight: '600', marginBottom: '12px' }}>
            ℹ️ Getting Started with CBAM Reporting
          </h3>
          <ol style={{
            color: isDark ? '#93C5FD' : '#1E40AF',
            fontSize: '14px',
            lineHeight: '1.8',
            paddingLeft: '20px',
            margin: 0,
          }}>
            <li>Click <strong>"➕ Add Installation"</strong> to register your production facilities outside the EU</li>
            <li>Click <strong>"➕ Record Emissions"</strong> to enter emissions data for imported goods</li>
            <li>Select the quarter and year, then click <strong>"📊 Generate Quarterly Report"</strong> to create your CBAM report</li>
            <li>Export the XML file for EU submission</li>
          </ol>
          <p style={{
            color: isDark ? '#93C5FD' : '#1E40AF',
            fontSize: '12px',
            marginTop: '16px',
            fontStyle: 'italic',
          }}>
            💡 <strong>Note:</strong> Make sure your backend server has been restarted to create the CBAM database tables.
          </p>
        </div>
      )}

      {/* Add Installation Modal */}
      {showInstallationModal && (
        <InstallationModal
          user={user}
          onClose={() => setShowInstallationModal(false)}
          onSuccess={() => {
            setShowInstallationModal(false);
            fetchInstallations();
          }}
          isDark={isDark}
          colors={colors}
          isMobile={isMobile}
        />
      )}

      {/* Record Emissions Modal */}
      {showEmissionModal && (
        <EmissionModal
          user={user}
          installations={installations}
          onClose={() => setShowEmissionModal(false)}
          onSuccess={() => {
            setShowEmissionModal(false);
            fetchCBAMData();
            fetchInstallations();
          }}
          isDark={isDark}
          colors={colors}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}

// Installation Modal Component
function InstallationModal({ user, onClose, onSuccess, isDark, colors, isMobile }) {
  const [formData, setFormData] = useState({
    installation_name: '',
    country_code: '',
    operator_name: '',
    address: '',
    economic_activity: '',
    un_locode: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await cbamAPI.createInstallation(user.company_id, formData);
      onSuccess();
    } catch (error) {
      console.error('Error creating installation:', error);
      setError(error.response?.data?.detail || 'Failed to create installation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
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
    }} onClick={onClose}>
      <div style={{
        background: isDark 
          ? 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)' 
          : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 100%)',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`,
        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: colors.text,
            margin: 0,
          }}>
            ➕ Add CBAM Installation
          </h2>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: colors.textSecondary,
          }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && (
            <div style={{
              padding: '12px',
              background: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
              border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA'}`,
              borderRadius: '8px',
              color: isDark ? '#F87171' : '#DC2626',
              fontSize: '14px',
              marginBottom: '20px',
            }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: colors.textSecondary,
              marginBottom: '8px',
            }}>
              Installation Name *
            </label>
            <input
              type="text"
              required
              value={formData.installation_name}
              onChange={(e) => setFormData({...formData, installation_name: e.target.value})}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                background: colors.bgSecondary,
                color: colors.text,
                fontSize: '14px',
              }}
              placeholder="e.g., Steel Plant A"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: colors.textSecondary,
              marginBottom: '8px',
            }}>
              Country Code (ISO 3166-1 alpha-3) *
            </label>
            <input
              type="text"
              required
              maxLength={3}
              value={formData.country_code}
              onChange={(e) => setFormData({...formData, country_code: e.target.value.toUpperCase()})}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                background: colors.bgSecondary,
                color: colors.text,
                fontSize: '14px',
              }}
              placeholder="e.g., IND, CHN, USA"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: colors.textSecondary,
              marginBottom: '8px',
            }}>
              Operator Name
            </label>
            <input
              type="text"
              value={formData.operator_name}
              onChange={(e) => setFormData({...formData, operator_name: e.target.value})}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                background: colors.bgSecondary,
                color: colors.text,
                fontSize: '14px',
              }}
              placeholder="Company operating the facility"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: colors.textSecondary,
              marginBottom: '8px',
            }}>
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                background: colors.bgSecondary,
                color: colors.text,
                fontSize: '14px',
                minHeight: '80px',
                resize: 'vertical',
              }}
              placeholder="Full address of the installation"
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: colors.textSecondary,
              marginBottom: '8px',
            }}>
              Economic Activity
            </label>
            <input
              type="text"
              value={formData.economic_activity}
              onChange={(e) => setFormData({...formData, economic_activity: e.target.value})}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                background: colors.bgSecondary,
                color: colors.text,
                fontSize: '14px',
              }}
              placeholder="e.g., Steel production, Cement manufacturing"
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '13px',
              fontWeight: '600',
              color: colors.textSecondary,
              marginBottom: '8px',
            }}>
              UN Location Code (UN/LOCODE)
            </label>
            <input
              type="text"
              maxLength={10}
              value={formData.un_locode}
              onChange={(e) => setFormData({...formData, un_locode: e.target.value.toUpperCase()})}
              style={{
                width: '100%',
                padding: '12px',
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                background: colors.bgSecondary,
                color: colors.text,
                fontSize: '14px',
              }}
              placeholder="e.g., INBOM, CNPEK"
            />
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
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
                  : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? '⏳ Creating...' : '✅ Create Installation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Emission Modal Component
function EmissionModal({ user, installations, onClose, onSuccess, isDark, colors, isMobile }) {
  const [formData, setFormData] = useState({
    installation_id: '',
    goods_id: '',
    reporting_period: new Date().toISOString().split('T')[0],
    direct_emissions: '',
    indirect_emissions: '',
    quantity_imported: '',
    quantity_unit: 'tonnes',
    carbon_price_paid: '',
    carbon_price_currency: 'EUR',
    carbon_price_country: '',
    calculation_method: 'EU_methodology',
  });
  const [goods, setGoods] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGoods();
  }, []);

  const fetchGoods = async () => {
    try {
      // Get goods from the goods endpoint
      const response = await cbamAPI.getGoods(user.company_id, { limit: 100 });
      setGoods(response.data || []);
    } catch (error) {
      console.error('Error fetching goods:', error);
      setGoods([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        installation_id: parseInt(formData.installation_id),
        goods_id: parseInt(formData.goods_id),
        direct_emissions: formData.direct_emissions ? parseFloat(formData.direct_emissions) : null,
        indirect_emissions: formData.indirect_emissions ? parseFloat(formData.indirect_emissions) : null,
        quantity_imported: parseFloat(formData.quantity_imported),
        carbon_price_paid: formData.carbon_price_paid ? parseFloat(formData.carbon_price_paid) : null,
      };
      await cbamAPI.recordEmissions(user.company_id, payload);
      onSuccess();
    } catch (error) {
      console.error('Error recording emissions:', error);
      setError(error.response?.data?.detail || 'Failed to record emissions');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
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
    }} onClick={onClose}>
      <div style={{
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
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 24px',
          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '700',
            color: colors.text,
            margin: 0,
          }}>
            ➕ Record CBAM Emissions
          </h2>
          <button onClick={onClose} style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: colors.textSecondary,
          }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          {error && (
            <div style={{
              padding: '12px',
              background: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
              border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA'}`,
              borderRadius: '8px',
              color: isDark ? '#F87171' : '#DC2626',
              fontSize: '14px',
              marginBottom: '20px',
            }}>
              {error}
            </div>
          )}

          {installations.length === 0 ? (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              background: isDark ? 'rgba(245, 158, 11, 0.1)' : '#FEF3C7',
              borderRadius: '8px',
              marginBottom: '20px',
            }}>
              <p style={{ color: colors.text, margin: 0 }}>
                ⚠️ Please add an installation first before recording emissions.
              </p>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: colors.textSecondary,
                  marginBottom: '8px',
                }}>
                  Installation *
                </label>
                <select
                  required
                  value={formData.installation_id}
                  onChange={(e) => setFormData({...formData, installation_id: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    background: colors.bgSecondary,
                    color: colors.text,
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">Select Installation</option>
                  {installations.map(inst => (
                    <option key={inst.id} value={inst.id}>
                      {inst.installation_name} ({inst.country_code})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: colors.textSecondary,
                  marginBottom: '8px',
                }}>
                  Goods Category *
                </label>
                <select
                  required
                  value={formData.goods_id}
                  onChange={(e) => setFormData({...formData, goods_id: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    background: colors.bgSecondary,
                    color: colors.text,
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">Select Goods</option>
                  {goods.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.cn_code} - {g.goods_category} {g.description ? `(${g.description})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{
                  display: 'block',
                  fontSize: '13px',
                  fontWeight: '600',
                  color: colors.textSecondary,
                  marginBottom: '8px',
                }}>
                  Reporting Period (Quarter End Date) *
                </label>
                <input
                  type="date"
                  required
                  value={formData.reporting_period}
                  onChange={(e) => setFormData({...formData, reporting_period: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    background: colors.bgSecondary,
                    color: colors.text,
                    fontSize: '14px',
                  }}
                />
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: '16px',
                marginBottom: '16px',
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: colors.textSecondary,
                    marginBottom: '8px',
                  }}>
                    Direct Emissions (tCO₂e)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.direct_emissions}
                    onChange={(e) => setFormData({...formData, direct_emissions: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      background: colors.bgSecondary,
                      color: colors.text,
                      fontSize: '14px',
                    }}
                    placeholder="0.000"
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: colors.textSecondary,
                    marginBottom: '8px',
                  }}>
                    Indirect Emissions (tCO₂e)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    value={formData.indirect_emissions}
                    onChange={(e) => setFormData({...formData, indirect_emissions: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      background: colors.bgSecondary,
                      color: colors.text,
                      fontSize: '14px',
                    }}
                    placeholder="0.000"
                  />
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '2fr 1fr',
                gap: '16px',
                marginBottom: '16px',
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: colors.textSecondary,
                    marginBottom: '8px',
                  }}>
                    Quantity Imported *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.001"
                    value={formData.quantity_imported}
                    onChange={(e) => setFormData({...formData, quantity_imported: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      background: colors.bgSecondary,
                      color: colors.text,
                      fontSize: '14px',
                    }}
                    placeholder="0.000"
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: colors.textSecondary,
                    marginBottom: '8px',
                  }}>
                    Unit *
                  </label>
                  <select
                    required
                    value={formData.quantity_unit}
                    onChange={(e) => setFormData({...formData, quantity_unit: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      background: colors.bgSecondary,
                      color: colors.text,
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="tonnes">tonnes</option>
                    <option value="MWh">MWh</option>
                    <option value="kg">kg</option>
                    <option value="litres">litres</option>
                  </select>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
                gap: '16px',
                marginBottom: '20px',
              }}>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: colors.textSecondary,
                    marginBottom: '8px',
                  }}>
                    Carbon Price Paid (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.carbon_price_paid}
                    onChange={(e) => setFormData({...formData, carbon_price_paid: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      background: colors.bgSecondary,
                      color: colors.text,
                      fontSize: '14px',
                    }}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: colors.textSecondary,
                    marginBottom: '8px',
                  }}>
                    Currency
                  </label>
                  <select
                    value={formData.carbon_price_currency}
                    onChange={(e) => setFormData({...formData, carbon_price_currency: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      background: colors.bgSecondary,
                      color: colors.text,
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: colors.textSecondary,
                    marginBottom: '8px',
                  }}>
                    Calculation Method
                  </label>
                  <select
                    value={formData.calculation_method}
                    onChange={(e) => setFormData({...formData, calculation_method: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      background: colors.bgSecondary,
                      color: colors.text,
                      fontSize: '14px',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="EU_methodology">EU Methodology</option>
                    <option value="equivalent_method">Equivalent Method</option>
                    <option value="default_values">Default Values</option>
                  </select>
                </div>
              </div>

              <div style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
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
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || installations.length === 0}
                  style={{
                    padding: '12px 24px',
                    background: loading 
                      ? (isDark ? '#475569' : '#9CA3AF')
                      : 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {loading ? '⏳ Recording...' : '✅ Record Emissions'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ title, value, icon, color, isDark, colors }) {
  return (
    <div style={{
      background: isDark 
        ? `linear-gradient(135deg, ${color}20 0%, rgba(0,0,0,0.1) 100%)`
        : `linear-gradient(135deg, ${color}15 0%, ${color}05 100%)`,
      padding: '20px',
      borderRadius: '12px',
      border: `1px solid ${color}30`,
    }}>
      <div style={{ fontSize: '32px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '24px', fontWeight: '700', color: colors.text, marginBottom: '4px' }}>
        {value}
      </div>
      <div style={{ fontSize: '13px', color: colors.textSecondary }}>{title}</div>
    </div>
  );
}

export default CBAMReporting;

