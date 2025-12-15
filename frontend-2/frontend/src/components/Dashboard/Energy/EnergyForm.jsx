import React, { useState } from 'react';
import { energyAPI } from '../../../services/api';

const EnergyForm = ({ companyId, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    energy_type: 'electricity',
    quantity: '',
    unit: 'kWh',
    date: new Date().toISOString().split('T')[0],
    emission_factor: '',
    emission_factor_unit: '',
    location: '',
    renewable_percentage: '',
    certificate_id: '',
    additional_data: {}
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const energyTypes = [
    'electricity',
    'diesel',
    'petrol',
    'natural_gas',
    'lpg',
    'coal',
    'biomass',
    'solar',
    'wind',
    'hydro'
  ];

  const units = [
    'kWh',
    'MWh',
    'GJ',
    'litre',
    'kg',
    'tonne',
    'm3'
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        quantity: parseFloat(formData.quantity),
        emission_factor: formData.emission_factor ? parseFloat(formData.emission_factor) : null,
        renewable_percentage: formData.renewable_percentage ? parseFloat(formData.renewable_percentage) : null,
      };

      await energyAPI.createEnergy(companyId, payload);

      if (onSuccess) onSuccess();

      setFormData({
        energy_type: 'electricity',
        quantity: '',
        unit: 'kWh',
        date: new Date().toISOString().split('T')[0],
        emission_factor: '',
        emission_factor_unit: '',
        location: '',
        renewable_percentage: '',
        certificate_id: '',
        additional_data: {}
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create energy record');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.formContainer}>
      <h3 style={styles.formTitle}>Add Energy Consumption Record</h3>

      {error && (
        <div style={styles.errorBox}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={styles.gridContainer}>
          {/* Energy Type */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Energy Type *</label>
            <select
              name="energy_type"
              value={formData.energy_type}
              onChange={handleChange}
              required
              style={styles.input}
            >
              {energyTypes.map(type => (
                <option key={type} value={type}>
                  {type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </option>
              ))}
            </select>
          </div>

          {/* Unit */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Unit *</label>
            <select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              required
              style={styles.input}
            >
              {units.map(unit => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          {/* Quantity */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Quantity *</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              step="0.01"
              required
              style={styles.input}
              placeholder="0.00"
            />
          </div>

          {/* Location */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              style={styles.input}
              placeholder="City, State"
            />
          </div>

          {/* Emission Factor */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Emission Factor</label>
            <input
              type="number"
              name="emission_factor"
              value={formData.emission_factor}
              onChange={handleChange}
              step="0.0001"
              style={styles.input}
              placeholder="0.0000"
            />
          </div>

          {/* Emission Factor Unit */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Emission Factor Unit</label>
            <input
              type="text"
              name="emission_factor_unit"
              value={formData.emission_factor_unit}
              onChange={handleChange}
              style={styles.input}
              placeholder="e.g., kg CO2e/kWh"
            />
          </div>

          {/* Renewable Percentage */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Renewable % (0-100)</label>
            <input
              type="number"
              name="renewable_percentage"
              value={formData.renewable_percentage}
              onChange={handleChange}
              min="0"
              max="100"
              step="0.1"
              style={styles.input}
              placeholder="0.0"
            />
          </div>

          {/* Certificate ID */}
          <div style={styles.formGroup}>
            <label style={styles.label}>Certificate ID</label>
            <input
              type="text"
              name="certificate_id"
              value={formData.certificate_id}
              onChange={handleChange}
              style={styles.input}
              placeholder="Renewable energy certificate ID"
            />
          </div>
        </div>

        {/* Buttons */}
        <div style={styles.buttonContainer}>
          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.submitButton,
              ...(loading ? styles.submitButtonDisabled : {})
            }}
          >
            {loading ? 'Saving...' : 'Save Energy Record'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={styles.cancelButton}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

const styles = {
  formContainer: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    marginBottom: '2rem'
  },
  formTitle: {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '1.5rem'
  },
  errorBox: {
    padding: '1rem',
    backgroundColor: '#fee2e2',
    border: '1px solid #f87171',
    color: '#991b1b',
    borderRadius: '0.5rem',
    marginBottom: '1rem'
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
    marginBottom: '2rem'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    fontSize: '0.875rem',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '0.5rem'
  },
  input: {
    padding: '0.75rem',
    fontSize: '0.875rem',
    border: '1px solid #d1d5db',
    borderRadius: '0.5rem',
    outline: 'none',
    transition: 'all 0.2s',
    backgroundColor: 'white',
    color: '#1f2937'
  },
  buttonContainer: {
    display: 'flex',
    gap: '1rem',
    paddingTop: '1rem'
  },
  submitButton: {
    padding: '0.75rem 2rem',
    backgroundColor: '#10b981',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: '600',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 4px rgba(16,185,129,0.3)'
  },
  submitButtonDisabled: {
    backgroundColor: '#9ca3af',
    cursor: 'not-allowed',
    boxShadow: 'none'
  },
  cancelButton: {
    padding: '0.75rem 2rem',
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
    fontSize: '0.875rem',
    fontWeight: '600',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s'
  }
};

export default EnergyForm;