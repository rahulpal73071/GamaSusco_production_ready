import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import { emissionsAPI, activitiesAPI } from '../../services/api';

const EmissionCalculator = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [formData, setFormData] = useState({
    activity_type: '',
    quantity: '',
    unit: '',
    region: 'India',
    description: '',
    context: ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const commonActivities = {
    fuels: [
      { name: 'Diesel', unit: 'litre' },
      { name: 'Petrol', unit: 'litre' },
      { name: 'Natural Gas', unit: 'm3' },
      { name: 'LPG', unit: 'kg' },
      { name: 'Coal', unit: 'kg' }
    ],
    energy: [
      { name: 'Electricity', unit: 'kWh' },
      { name: 'Heating', unit: 'kWh' },
      { name: 'Cooling', unit: 'kWh' }
    ],
    transport: [
      { name: 'Flight', unit: 'km' },
      { name: 'Train', unit: 'km' },
      { name: 'Taxi', unit: 'km' },
      { name: 'Bus', unit: 'km' },
      { name: 'Car', unit: 'km' }
    ],
    materials: [
      { name: 'Steel', unit: 'kg' },
      { name: 'Cement', unit: 'kg' },
      { name: 'Concrete', unit: 'kg' },
      { name: 'Aluminum', unit: 'kg' },
      { name: 'Plastic', unit: 'kg' },
      { name: 'Paper', unit: 'kg' }
    ]
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleQuickSelect = (activity, unit) => {
    setFormData(prev => ({
      ...prev,
      activity_type: activity,
      unit: unit
    }));
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload = {
        activity_type: formData.activity_type,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        region: formData.region,
        description: formData.description || '',
        context: formData.context || ''
      };

      const response = await emissionsAPI.calculate(payload);
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to calculate emissions');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const response = await emissionsAPI.searchFactors(searchQuery, 10);
      setSearchResults(response.data.results || []);
    } catch (err) {
      console.error('Search failed:', err);
    }
  };

  const handleSaveActivity = async () => {
    if (!result || !result.success) return;

    try {
      const activityPayload = {
        activity_type: formData.activity_type,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        emissions_kgco2e: result.emissions_kg_co2e,
        emission_factor: result.emission_factor,
        scope_number: result.scope || 3,
        category: result.category || 'calculated',
        activity_date: new Date().toISOString().split('T')[0]
      };

      await activitiesAPI.createActivity(user.company_id, activityPayload);
      alert('Activity saved successfully!');

      // Reset form
      setFormData({
        activity_type: '',
        quantity: '',
        unit: '',
        region: 'India',
        description: '',
        context: ''
      });
      setResult(null);
    } catch (err) {
      alert('Failed to save activity: ' + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div style={styles.wrapper}>
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div style={{ ...styles.mainContent, marginLeft: sidebarOpen ? '280px' : '0' }}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} style={styles.menuButton}>
                ☰
              </button>
            )}
            <div>
              <h1 style={styles.title}>🧮 Emission Calculator</h1>
              <p style={styles.subtitle}>Calculate emissions instantly without saving to database</p>
            </div>
          </div>
        </div>

        <div style={styles.contentGrid}>
          {/* Left Column - Calculator Form */}
          <div style={styles.calculatorSection}>
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Calculate Emissions</h3>

              <form onSubmit={handleCalculate}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Activity Type *</label>
                  <input
                    type="text"
                    name="activity_type"
                    value={formData.activity_type}
                    onChange={handleChange}
                    required
                    placeholder="e.g., diesel, electricity, steel"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formRow}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Quantity *</label>
                    <input
                      type="number"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleChange}
                      required
                      step="0.01"
                      placeholder="0.00"
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Unit *</label>
                    <input
                      type="text"
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      required
                      placeholder="e.g., litre, kWh, kg"
                      style={styles.input}
                    />
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Region</label>
                  <select
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    style={styles.input}
                  >
                    <option value="India">India</option>
                    <option value="UK">UK</option>
                    <option value="USA">USA</option>
                    <option value="Global">Global</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Description (Optional)</label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Additional details"
                    style={styles.input}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Context (Optional)</label>
                  <select
                    name="context"
                    value={formData.context}
                    onChange={handleChange}
                    style={styles.input}
                  >
                    <option value="">Auto-detect</option>
                    <option value="production">Production</option>
                    <option value="combustion">Combustion</option>
                    <option value="transport">Transport</option>
                  </select>
                </div>

                {error && (
                  <div style={styles.errorBox}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    ...styles.calculateButton,
                    ...(loading ? styles.buttonDisabled : {})
                  }}
                >
                  {loading ? 'Calculating...' : '🧮 Calculate Emissions'}
                </button>
              </form>
            </div>

            {/* Quick Select */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>Quick Select Common Activities</h3>

              {Object.entries(commonActivities).map(([category, activities]) => (
                <div key={category} style={styles.quickCategory}>
                  <h4 style={styles.quickCategoryTitle}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </h4>
                  <div style={styles.quickButtonGrid}>
                    {activities.map((activity) => (
                      <button
                        key={activity.name}
                        type="button"
                        onClick={() => handleQuickSelect(activity.name, activity.unit)}
                        style={styles.quickButton}
                      >
                        {activity.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Results */}
          <div style={styles.resultsSection}>
            {result ? (
              result.success ? (
                <div style={styles.card}>
                  <div style={styles.resultHeader}>
                    <h3 style={styles.cardTitle}>✅ Calculation Results</h3>
                    <div style={{
                      ...styles.confidenceBadge,
                      backgroundColor: result.confidence > 0.8 ? '#d1fae5' : result.confidence > 0.5 ? '#fef3c7' : '#fee2e2',
                      color: result.confidence > 0.8 ? '#065f46' : result.confidence > 0.5 ? '#92400e' : '#991b1b'
                    }}>
                      {(result.confidence * 100).toFixed(0)}% Confidence
                    </div>
                  </div>

                  {/* Main Result */}
                  <div style={styles.mainResult}>
                    <div style={styles.emissionValue}>
                      {result.emissions_kg_co2e.toFixed(2)}
                    </div>
                    <div style={styles.emissionUnit}>kg CO2e</div>
                    <div style={styles.emissionTonnes}>
                      ({(result.emissions_kg_co2e / 1000).toFixed(4)} tonnes)
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div style={styles.detailsGrid}>
                    <div style={styles.detailItem}>
                      <div style={styles.detailLabel}>Emission Factor</div>
                      <div style={styles.detailValue}>
                        {result.emission_factor} {result.emission_factor_unit}
                      </div>
                    </div>

                    <div style={styles.detailItem}>
                      <div style={styles.detailLabel}>Method</div>
                      <div style={styles.detailValue}>{result.calculation_method}</div>
                    </div>

                    <div style={styles.detailItem}>
                      <div style={styles.detailLabel}>Source</div>
                      <div style={styles.detailValue}>{result.source}</div>
                    </div>

                    <div style={styles.detailItem}>
                      <div style={styles.detailLabel}>Data Quality</div>
                      <div style={styles.detailValue}>{result.data_quality}</div>
                    </div>

                    {result.scope && (
                      <div style={styles.detailItem}>
                        <div style={styles.detailLabel}>GHG Scope</div>
                        <div style={styles.detailValue}>Scope {result.scope}</div>
                      </div>
                    )}

                    {result.category && (
                      <div style={styles.detailItem}>
                        <div style={styles.detailLabel}>Category</div>
                        <div style={styles.detailValue}>{result.category}</div>
                      </div>
                    )}
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleSaveActivity}
                    style={styles.saveButton}
                  >
                    💾 Save to Activities
                  </button>

                  {/* Alternatives */}
                  {result.alternatives && result.alternatives.length > 0 && (
                    <div style={styles.alternativesSection}>
                      <h4 style={styles.alternativesTitle}>Alternative Factors</h4>
                      <div style={styles.alternativesList}>
                        {result.alternatives.map((alt, index) => (
                          <div key={index} style={styles.alternativeItem}>
                            <div>{alt.activity}</div>
                            <div style={styles.alternativeValue}>
                              {alt.emission_factor} {alt.unit}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={styles.card}>
                  <div style={styles.errorResult}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
                    <h3>Calculation Failed</h3>
                    <p>{result.error || 'Unable to calculate emissions'}</p>
                    {result.suggestion && (
                      <p style={styles.suggestion}>💡 {result.suggestion}</p>
                    )}
                  </div>
                </div>
              )
            ) : (
              <div style={styles.card}>
                <div style={styles.emptyResult}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🧮</div>
                  <h3>Ready to Calculate</h3>
                  <p>Enter activity details and click calculate to see results</p>
                </div>
              </div>
            )}

            {/* Search Factors */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>🔍 Search Emission Factors</h3>
              <div style={styles.searchBox}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for factors..."
                  style={styles.searchInput}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button onClick={handleSearch} style={styles.searchButton}>
                  Search
                </button>
              </div>

              {searchResults.length > 0 && (
                <div style={styles.searchResults}>
                  {searchResults.map((result, index) => (
                    <div key={index} style={styles.searchResultItem}>
                      <div style={styles.searchResultName}>{result.activity}</div>
                      <div style={styles.searchResultMeta}>
                        <span>{result.emission_factor} {result.unit}</span>
                        <span style={styles.searchResultSource}>{result.source}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f9fafb'
  },
  mainContent: {
    flex: 1,
    padding: '2rem',
    transition: 'margin-left 0.3s ease'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  menuButton: {
    fontSize: '1.5rem',
    padding: '0.5rem 1rem',
    backgroundColor: 'transparent',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    cursor: 'pointer'
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#1f2937'
  },
  subtitle: {
    fontSize: '1rem',
    color: '#6b7280',
    marginTop: '0.25rem'
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '2rem'
  },
  calculatorSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  resultsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem'
  },
  card: {
    backgroundColor: 'white',
    padding: '1.5rem',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  cardTitle: {
    fontSize: '1.25rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '1.5rem'
  },
  formGroup: {
    marginBottom: '1.25rem'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
    marginBottom: '1.25rem'
  },
  label: {
    display: 'block',
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '0.5rem'
  },
  input: {
    width: '100%',
    padding: '0.75rem',
    fontSize: '0.875rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    outline: 'none'
  },
  errorBox: {
    padding: '1rem',
    backgroundColor: '#fee2e2',
    border: '1px solid #f87171',
    color: '#991b1b',
    borderRadius: '0.5rem',
    marginBottom: '1rem',
    fontSize: '0.875rem'
  },
  calculateButton: {
    width: '100%',
    padding: '0.875rem',
    backgroundColor: '#8b5cf6',
    color: 'white',
    fontSize: '1rem',
    fontWeight: '600',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed'
  },
  quickCategory: {
    marginBottom: '1.5rem'
  },
  quickCategoryTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: '0.75rem',
    textTransform: 'uppercase'
  },
  quickButtonGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.5rem'
  },
  quickButton: {
    padding: '0.5rem',
    fontSize: '0.75rem',
    backgroundColor: '#f3f4f6',
    border: '1px solid #e5e7eb',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontWeight: '500'
  },
  resultHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1.5rem'
  },
  confidenceBadge: {
    padding: '0.5rem 1rem',
    borderRadius: '12px',
    fontSize: '0.875rem',
    fontWeight: '600'
  },
  mainResult: {
    textAlign: 'center',
    padding: '2rem',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    marginBottom: '1.5rem'
  },
  emissionValue: {
    fontSize: '3.5rem',
    fontWeight: 'bold',
    color: '#8b5cf6',
    marginBottom: '0.5rem'
  },
  emissionUnit: {
    fontSize: '1.25rem',
    color: '#6b7280',
    fontWeight: '500'
  },
  emissionTonnes: {
    fontSize: '0.875rem',
    color: '#9ca3af',
    marginTop: '0.5rem'
  },
  detailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '1rem',
    marginBottom: '1.5rem'
  },
  detailItem: {
    padding: '1rem',
    backgroundColor: '#f9fafb',
    borderRadius: '8px'
  },
  detailLabel: {
    fontSize: '0.75rem',
    color: '#6b7280',
    marginBottom: '0.25rem',
    textTransform: 'uppercase',
    fontWeight: '500'
  },
  detailValue: {
    fontSize: '0.875rem',
    color: '#1f2937',
    fontWeight: '600'
  },
  saveButton: {
    width: '100%',
    padding: '0.875rem',
    backgroundColor: '#10b981',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: '600',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    marginBottom: '1.5rem'
  },
  alternativesSection: {
    borderTop: '1px solid #e5e7eb',
    paddingTop: '1.5rem'
  },
  alternativesTitle: {
    fontSize: '0.875rem',
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: '1rem'
  },
  alternativesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem'
  },
  alternativeItem: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '0.75rem',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    fontSize: '0.875rem'
  },
  alternativeValue: {
    fontWeight: '600',
    color: '#6b7280'
  },
  errorResult: {
    textAlign: 'center',
    padding: '3rem 1rem',
    color: '#991b1b'
  },
  suggestion: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#fef3c7',
    borderRadius: '8px',
    color: '#92400e',
    fontSize: '0.875rem'
  },
  emptyResult: {
    textAlign: 'center',
    padding: '3rem 1rem',
    color: '#9ca3af'
  },
  searchBox: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1rem'
  },
  searchInput: {
    flex: 1,
    padding: '0.75rem',
    fontSize: '0.875rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem'
  },
  searchButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#8b5cf6',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: '600',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer'
  },
  searchResults: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    maxHeight: '300px',
    overflowY: 'auto'
  },
  searchResultItem: {
    padding: '0.75rem',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    fontSize: '0.875rem'
  },
  searchResultName: {
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '0.25rem'
  },
  searchResultMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#6b7280',
    fontSize: '0.75rem'
  },
  searchResultSource: {
    fontStyle: 'italic'
  }
};

export default EmissionCalculator;