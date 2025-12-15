import { useState, useEffect } from 'react';
import { benchmarksAPI } from '../../services/api';
import DashboardLayout from './DashboardLayout';

function Benchmarks({ user }) {
  const [benchmarks, setBenchmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBenchmarks();
  }, []);

  const fetchBenchmarks = async () => {
    try {
      setLoading(true);
      const response = await benchmarksAPI.getBenchmarks();
      // Handle case where backend returns a message object instead of array
      if (Array.isArray(response.data)) {
        setBenchmarks(response.data);
      } else {
        // Backend is under construction, show empty state
        setBenchmarks([]);
      }
    } catch (error) {
      console.error('Error fetching benchmarks:', error);
      setError('Failed to load benchmarks');
      setBenchmarks([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}>📊</div>
          <p style={styles.loadingText}>Loading benchmarks...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>📊 Industry Benchmarks</h1>
            <p style={styles.subtitle}>
              Compare your emissions performance against industry standards
            </p>
          </div>
        </div>

        {error && (
          <div style={styles.errorBox}>
            ❌ {error}
          </div>
        )}

        {/* Benchmarks Section */}
        <div style={styles.benchmarksSection}>
          {benchmarks.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>📊</div>
              <p style={styles.emptyText}>Benchmarks coming soon</p>
              <p style={styles.emptySubtext}>
                Industry benchmark data will be available in a future update
              </p>
            </div>
          ) : (
            <div style={styles.benchmarksGrid}>
              {benchmarks.map((benchmark, index) => (
                <BenchmarkCard key={index} benchmark={benchmark} />
              ))}
            </div>
          )}
        </div>

        {/* Placeholder Content */}
        <div style={styles.placeholderSection}>
          <h2 style={styles.sectionTitle}>🔍 What You'll See Here</h2>
          <div style={styles.placeholderGrid}>
            <div style={styles.placeholderCard}>
              <h3 style={styles.placeholderTitle}>📈 Industry Averages</h3>
              <p style={styles.placeholderText}>
                Compare your emissions against industry averages by sector, company size, and geography.
              </p>
            </div>
            <div style={styles.placeholderCard}>
              <h3 style={styles.placeholderTitle}>🏆 Top Performers</h3>
              <p style={styles.placeholderText}>
                See how leading companies in your industry are achieving their sustainability goals.
              </p>
            </div>
            <div style={styles.placeholderCard}>
              <h3 style={styles.placeholderTitle}>📊 Trend Analysis</h3>
              <p style={styles.placeholderText}>
                Track industry-wide emission reduction trends and set realistic targets.
              </p>
            </div>
            <div style={styles.placeholderCard}>
              <h3 style={styles.placeholderTitle}>🎯 Best Practices</h3>
              <p style={styles.placeholderText}>
                Learn from successful strategies implemented by industry leaders.
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Benchmark Card Component
function BenchmarkCard({ benchmark }) {
  return (
    <div style={styles.benchmarkCard}>
      <div style={styles.benchmarkHeader}>
        <h3 style={styles.benchmarkTitle}>{benchmark.title}</h3>
        <span style={styles.benchmarkCategory}>{benchmark.category}</span>
      </div>

      <div style={styles.benchmarkMetrics}>
        <div style={styles.metric}>
          <span style={styles.metricLabel}>Industry Average:</span>
          <span style={styles.metricValue}>
            {benchmark.industry_average} {benchmark.unit}
          </span>
        </div>
        <div style={styles.metric}>
          <span style={styles.metricLabel}>Your Performance:</span>
          <span style={styles.metricValue}>
            {benchmark.your_performance} {benchmark.unit}
          </span>
        </div>
        <div style={styles.metric}>
          <span style={styles.metricLabel}>Percentile:</span>
          <span style={styles.metricValue}>
            {benchmark.percentile}th
          </span>
        </div>
      </div>

      <div style={styles.benchmarkActions}>
        <button style={styles.viewDetailsBtn}>View Details</button>
      </div>
    </div>
  );
}

const styles = {
  content: {
    padding: '32px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    marginBottom: '32px',
  },
  title: {
    fontSize: '36px',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 6px 0',
  },
  subtitle: {
    fontSize: '15px',
    color: '#6b7280',
    margin: 0,
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
  },
  loadingSpinner: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  loadingText: {
    fontSize: '16px',
    color: '#6b7280',
  },
  errorBox: {
    padding: '16px',
    background: '#fee',
    border: '1px solid #fcc',
    borderRadius: '12px',
    color: '#c33',
    fontSize: '14px',
    marginBottom: '20px',
  },
  benchmarksSection: {
    marginBottom: '40px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
    background: 'white',
    borderRadius: '16px',
    border: '1px solid #e5e7eb',
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
  benchmarksGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
  },
  benchmarkCard: {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
  },
  benchmarkHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  benchmarkTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  benchmarkCategory: {
    padding: '4px 12px',
    background: '#f3f4f6',
    color: '#374151',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  benchmarkMetrics: {
    marginBottom: '20px',
  },
  metric: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  metricLabel: {
    fontSize: '14px',
    color: '#6b7280',
  },
  metricValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
  },
  benchmarkActions: {
    textAlign: 'center',
  },
  viewDetailsBtn: {
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  placeholderSection: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid #e5e7eb',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '20px',
  },
  placeholderGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
  },
  placeholderCard: {
    background: '#fafafa',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
  },
  placeholderTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '8px',
  },
  placeholderText: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.5',
  },
};

export default Benchmarks;
