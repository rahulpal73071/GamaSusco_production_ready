import { useState, useEffect } from 'react';
import { activitiesAPI, emissionFactorsAPI } from '../../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';


const ActivityForm = ({ onSuccess, editActivity, isDark: propIsDark, colors: propColors }) => {
  // Use props if provided, otherwise use hook
  const themeContext = useTheme();
  const isDark = propIsDark !== undefined ? propIsDark : themeContext.isDark;
  const colors = propColors || themeContext.colors;
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    scope: 'Scope 1',
    category: '',
    activity_type: '',
    quantity: '',
    unit: '',
    emission_factor_id: '',
    notes: ''
  });

  const [emissionFactors, setEmissionFactors] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [filteredFactors, setFilteredFactors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [estimatedEmissions, setEstimatedEmissions] = useState(0);

  // Fetch emission factors on mount
  useEffect(() => {
    fetchEmissionFactors();
  }, []);

  // Load edit data
  useEffect(() => {
    if (editActivity) {
      setFormData({
        date: editActivity.date.split('T')[0],
        scope: editActivity.scope,
        category: editActivity.category,
        activity_type: editActivity.activity_type,
        quantity: editActivity.quantity,
        unit: editActivity.unit,
        emission_factor_id: editActivity.emission_factor_id,
        notes: editActivity.notes || ''
      });
    }
  }, [editActivity]);

  // Update categories when scope changes
  useEffect(() => {
    if (emissionFactors.length > 0) {
      updateAvailableCategories();
    }
  }, [formData.scope, emissionFactors]);

  // Update factors when category changes
  useEffect(() => {
    if (emissionFactors.length > 0 && formData.category) {
      filterEmissionFactors();
    }
  }, [formData.scope, formData.category, emissionFactors]);

  // Calculate estimate when quantity or factor changes
  useEffect(() => {
    calculateEstimate();
  }, [formData.quantity, formData.emission_factor_id, filteredFactors]);

  const fetchEmissionFactors = async () => {
    try {
      const response = await emissionFactorsAPI.getAll();
      setEmissionFactors(response.data);
    } catch (error) {
      console.error('Failed to fetch emission factors:', error);
      alert('Failed to load emission factors');
    }
  };

  const updateAvailableCategories = () => {
    const scopeFactors = emissionFactors.filter(ef => ef.scope === formData.scope);
    const uniqueCategories = [...new Set(scopeFactors.map(ef => ef.category))];

    setAvailableCategories(uniqueCategories);

    // Auto-select first category if current is invalid
    if (uniqueCategories.length > 0 && !uniqueCategories.includes(formData.category)) {
      setFormData(prev => ({
        ...prev,
        category: uniqueCategories[0],
        emission_factor_id: '',
        activity_type: '',
        unit: ''
      }));
    }
  };

  const filterEmissionFactors = () => {
    const filtered = emissionFactors.filter(
      ef => ef.scope === formData.scope && ef.category === formData.category
    );

    setFilteredFactors(filtered);

    // Auto-select first factor if available
    if (filtered.length > 0 && !formData.emission_factor_id) {
      const firstFactor = filtered[0];
      setFormData(prev => ({
        ...prev,
        emission_factor_id: firstFactor.id,
        activity_type: firstFactor.activity_type,
        unit: firstFactor.unit
      }));
    }
  };

  const calculateEstimate = () => {
    if (formData.quantity && formData.emission_factor_id) {
      const factor = filteredFactors.find(f => f.id === parseInt(formData.emission_factor_id));
      if (factor) {
        const estimate = parseFloat(formData.quantity) * factor.emission_factor;
        setEstimatedEmissions(estimate);
      }
    } else {
      setEstimatedEmissions(0);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'scope') {
      // Reset category and factor when scope changes
      setFormData(prev => ({
        ...prev,
        [name]: value,
        category: '',
        emission_factor_id: '',
        activity_type: '',
        unit: ''
      }));
    } else if (name === 'category') {
      // Reset factor when category changes
      setFormData(prev => ({
        ...prev,
        [name]: value,
        emission_factor_id: '',
        activity_type: '',
        unit: ''
      }));
    } else if (name === 'emission_factor_id') {
      const factor = filteredFactors.find(f => f.id === parseInt(value));
      if (factor) {
        setFormData(prev => ({
          ...prev,
          emission_factor_id: value,
          activity_type: factor.activity_type,
          unit: factor.unit
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // DEBUG: Check authentication
    const token = localStorage.getItem('token');
    console.log('=== DEBUG INFO ===');
    console.log('Token exists:', !!token);
    console.log('Token value:', token);
    console.log('=================');

    // Prepare data for submission
    const submitData = {
      date: formData.date,
      scope: formData.scope,
      category: formData.category,
      activity_type: formData.activity_type,
      quantity: parseFloat(formData.quantity),
      unit: formData.unit,
      emission_factor_id: parseInt(formData.emission_factor_id),
      notes: formData.notes || ''
    };

    console.log('Submitting:', submitData);

    try {
      if (editActivity) {
        await activitiesAPI.update(editActivity.id, submitData);
      } else {
        await activitiesAPI.create(submitData);
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save activity:', error);
      console.error('Error details:', error.response?.data);
      alert(`Failed to save activity: ${error.response?.data?.detail || 'Please check all fields'}`);
    } finally {
      setLoading(false);
    }
  };

  const getScopeIcon = (scope) => {
    if (scope === 'Scope 1') return '🔥';
    if (scope === 'Scope 2') return '⚡';
    if (scope === 'Scope 3') return '🚚';
    return '📊';
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h2 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          marginBottom: '10px',
          background: 'linear-gradient(135deg, #00A86B, #1E88E5)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {editActivity ? 'Edit Activity' : 'Add New Activity'}
        </h2>
        <p style={{ fontSize: '16px', color: colors.textSecondary }}>
          Track emissions with precision across all scopes
        </p>
      </div>

      <div style={{
        background: isDark 
          ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(124, 58, 237, 0.1))' 
          : 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(124, 58, 237, 0.05))',
        borderLeft: '4px solid #8b5cf6',
        borderRadius: '15px',
        padding: '20px',
        marginBottom: '35px'
      }}>
        <div style={{ display: 'flex', alignItems: 'start', gap: '15px' }}>
          <span style={{ fontSize: '32px' }}>💡</span>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 'bold', color: isDark ? '#a78bfa' : '#6b21a8', marginBottom: '8px' }}>
              Smart Tip
            </h3>
            <p style={{ fontSize: '14px', color: colors.textSecondary, lineHeight: '1.6' }}>
              Select the scope and category that best matches your activity. Our system uses IPCC-approved emission factors.
            </p>
          </div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '25px',
        marginBottom: '30px'
      }}>
        {/* Date */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '10px',
            fontWeight: '700',
            color: colors.text,
            fontSize: '14px'
          }}>
            📅 DATE
          </label>
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '14px 16px',
              border: `2px solid ${isDark ? '#334155' : '#e5e7eb'}`,
              borderRadius: '12px',
              fontSize: '15px',
              background: isDark ? '#0f172a' : 'white',
              color: colors.text
            }}
          />
        </div>

        {/* Scope */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '10px',
            fontWeight: '700',
            color: colors.text,
            fontSize: '14px'
          }}>
            {getScopeIcon(formData.scope)} SCOPE
          </label>
          <select
            name="scope"
            value={formData.scope}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '14px 16px',
              border: `2px solid ${isDark ? '#334155' : '#e5e7eb'}`,
              borderRadius: '12px',
              fontSize: '15px',
              background: isDark ? '#0f172a' : 'white',
              color: colors.text,
              cursor: 'pointer'
            }}
          >
            <option value="Scope 1">Scope 1 - Direct Emissions</option>
            <option value="Scope 2">Scope 2 - Energy Indirect</option>
            <option value="Scope 3">Scope 3 - Other Indirect</option>
          </select>
        </div>

        {/* Category */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '10px',
            fontWeight: '700',
            color: colors.text,
            fontSize: '14px'
          }}>
            🏷️ CATEGORY
          </label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            style={{
              width: '100%',
              padding: '14px 16px',
              border: `2px solid ${isDark ? '#334155' : '#e5e7eb'}`,
              borderRadius: '12px',
              fontSize: '15px',
              background: isDark ? '#0f172a' : 'white',
              color: colors.text,
              cursor: 'pointer'
            }}
          >
            {availableCategories.length === 0 ? (
              <option value="">Loading...</option>
            ) : (
              availableCategories.map(cat => (
                <option key={cat} value={cat}>
                  {cat.replace(/_/g, ' ').toUpperCase()}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Activity Type */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '10px',
            fontWeight: '700',
            color: colors.text,
            fontSize: '14px'
          }}>
            ⚙️ ACTIVITY TYPE
          </label>
          <select
            name="emission_factor_id"
            value={formData.emission_factor_id}
            onChange={handleChange}
            required
            disabled={filteredFactors.length === 0}
            style={{
              width: '100%',
              padding: '14px 16px',
              border: `2px solid ${isDark ? '#334155' : '#e5e7eb'}`,
              borderRadius: '12px',
              fontSize: '15px',
              background: isDark ? '#0f172a' : 'white',
              color: colors.text,
              cursor: filteredFactors.length === 0 ? 'not-allowed' : 'pointer',
              opacity: filteredFactors.length === 0 ? 0.5 : 1
            }}
          >
            {filteredFactors.length === 0 ? (
              <option value="">Select category first</option>
            ) : (
              filteredFactors.map(factor => (
                <option key={factor.id} value={factor.id}>
                  {factor.activity_type.replace(/_/g, ' ').toUpperCase()} ({factor.unit})
                </option>
              ))
            )}
          </select>
        </div>

        {/* Quantity */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '10px',
            fontWeight: '700',
            color: colors.text,
            fontSize: '14px'
          }}>
            📊 QUANTITY ({formData.unit || 'units'})
          </label>
          <input
            type="number"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            placeholder="Enter quantity"
            style={{
              width: '100%',
              padding: '14px 16px',
              border: `2px solid ${isDark ? '#334155' : '#e5e7eb'}`,
              borderRadius: '12px',
              fontSize: '15px',
              background: isDark ? '#0f172a' : 'white',
              color: colors.text
            }}
          />
        </div>

        {/* Estimated Emissions */}
        <div>
          <label style={{
            display: 'block',
            marginBottom: '10px',
            fontWeight: '700',
            color: colors.text,
            fontSize: '14px'
          }}>
            🌍 ESTIMATED EMISSIONS
          </label>
          <div style={{
            padding: '14px 16px',
            borderRadius: '12px',
            fontSize: '22px',
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            boxShadow: '0 4px 15px rgba(16,185,129,0.3)'
          }}>
            {estimatedEmissions.toFixed(2)} kgCO₂e
          </div>
        </div>
      </div>

      {/* Notes */}
      <div style={{ marginBottom: '35px' }}>
        <label style={{
          display: 'block',
          marginBottom: '10px',
          fontWeight: '700',
          color: colors.text,
          fontSize: '14px'
        }}>
          📝 NOTES (Optional)
        </label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows="4"
          placeholder="Add any additional information..."
          style={{
            width: '100%',
            padding: '14px 16px',
            border: `2px solid ${isDark ? '#334155' : '#e5e7eb'}`,
            borderRadius: '12px',
            fontSize: '15px',
            resize: 'vertical',
            fontFamily: 'inherit',
            background: isDark ? '#0f172a' : 'white',
            color: colors.text
          }}
        />
      </div>

      {/* OR text*/}
      <div className='or-text' style={{margin: "10px 0", textAlign: "center", fontWeight:"bold", color: colors.textSecondary}}>
        or
      </div>

      {/*Upload document button*/}
      <Link to="/documents" style={{
            padding: '8px 16px',
            borderRadius: '8px',
            textDecoration: 'none',
            color: colors.text,
            fontWeight: '500',
            transition: 'background 0.2s'
          }}>
            Documents
          </Link>

      {/* Submit */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '18px 50px',
            background: loading ? '#9ca3af' : 'linear-gradient(135deg, #00A86B, #1E88E5)',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            boxShadow: '0 10px 30px rgba(0,168,107,0.3)'
          }}
        >
          {loading ? 'Saving...' : (editActivity ? 'Update Activity' : 'Add Activity')}
        </button>
      </div>
    </form>
  );
};

export default ActivityForm;