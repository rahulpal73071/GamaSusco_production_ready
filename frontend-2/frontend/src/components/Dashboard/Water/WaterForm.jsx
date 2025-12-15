import React, { useState } from 'react';
import { waterAPI } from '../../../services/api';
import { useTheme } from '../../../context/ThemeContext';
import { useResponsive } from '../../../hooks/useResponsive';

const WaterForm = ({ companyId, onSuccess, onCancel }) => {
  const { colors, isDark } = useTheme();
  const { isMobile, isTablet } = useResponsive();
  
  const [formData, setFormData] = useState({
    source: 'municipal',
    withdrawal_volume: '',
    unit: 'm3',
    consumption_volume: '',
    discharge_volume: '',
    recycled_volume: '',
    emission_factor: '',
    discharge_quality: '',
    water_stress_index: '',
    date: new Date().toISOString().split('T')[0],
    additional_data: {}
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const waterSources = [
    { value: 'municipal', label: '🏛️ Municipal Supply', color: '#3B82F6' },
    { value: 'groundwater', label: '🌍 Groundwater', color: '#8B5CF6' },
    { value: 'surface', label: '🌊 Surface Water', color: '#06B6D4' },
    { value: 'rainwater', label: '🌧️ Rainwater', color: '#10B981' },
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
        withdrawal_volume: parseFloat(formData.withdrawal_volume),
        consumption_volume: formData.consumption_volume ? parseFloat(formData.consumption_volume) : null,
        discharge_volume: formData.discharge_volume ? parseFloat(formData.discharge_volume) : null,
        recycled_volume: formData.recycled_volume ? parseFloat(formData.recycled_volume) : null,
        emission_factor: formData.emission_factor ? parseFloat(formData.emission_factor) : null,
        water_stress_index: formData.water_stress_index ? parseFloat(formData.water_stress_index) : null,
      };

      await waterAPI.createWater(companyId, payload);

      if (onSuccess) onSuccess();

      setFormData({
        source: 'municipal',
        withdrawal_volume: '',
        unit: 'm3',
        consumption_volume: '',
        discharge_volume: '',
        recycled_volume: '',
        emission_factor: '',
        discharge_quality: '',
        water_stress_index: '',
        date: new Date().toISOString().split('T')[0],
        additional_data: {}
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create water record');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: isMobile ? '10px 12px' : '12px 14px',
    fontSize: isMobile ? '13px' : '14px',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : '#d1d5db'}`,
    borderRadius: '10px',
    outline: 'none',
    transition: 'all 0.2s',
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'white',
    color: colors.text,
    boxSizing: 'border-box',
  };

  const labelStyle = {
    fontSize: isMobile ? '12px' : '13px',
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: '6px',
    display: 'block',
  };

  return (
    <div style={{
      background: isDark 
        ? 'linear-gradient(145deg, #1e293b 0%, #0f172a 100%)' 
        : 'linear-gradient(145deg, #ffffff 0%, #f0f9ff 100%)',
      padding: isMobile ? '16px' : isTablet ? '20px' : '24px',
      borderRadius: isMobile ? '12px' : '16px',
      boxShadow: isDark 
        ? '0 8px 32px rgba(0,0,0,0.3)' 
        : '0 8px 32px rgba(14, 165, 233, 0.15)',
      marginBottom: isMobile ? '16px' : '24px',
      border: `1px solid ${isDark ? 'rgba(14, 165, 233, 0.2)' : 'rgba(14, 165, 233, 0.3)'}`,
    }}>
      <h3 style={{
        fontSize: isMobile ? '16px' : '18px',
        fontWeight: '700',
        color: colors.text,
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        💧 Add Water Usage Record
      </h3>

      {error && (
        <div style={{
          padding: '12px 16px',
          background: isDark ? 'rgba(239, 68, 68, 0.15)' : '#fee2e2',
          border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.3)' : '#fecaca'}`,
          color: isDark ? '#f87171' : '#dc2626',
          borderRadius: '10px',
          marginBottom: '16px',
          fontSize: '13px',
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: isMobile ? '12px' : '16px',
          marginBottom: '20px',
        }}>
          {/* Source */}
          <div>
            <label style={labelStyle}>Water Source *</label>
            <select
              name="source"
              value={formData.source}
              onChange={handleChange}
              required
              style={{
                ...inputStyle,
                cursor: 'pointer',
              }}
            >
              {waterSources.map(source => (
                <option key={source.value} value={source.value}>
                  {source.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label style={labelStyle}>📅 Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              style={inputStyle}
            />
          </div>

          {/* Withdrawal Volume */}
          <div>
            <label style={labelStyle}>Withdrawal Volume (m³) *</label>
            <input
              type="number"
              name="withdrawal_volume"
              value={formData.withdrawal_volume}
              onChange={handleChange}
              step="0.01"
              required
              style={inputStyle}
              placeholder="0.00"
            />
          </div>

          {/* Consumption Volume */}
          <div>
            <label style={labelStyle}>Consumption Volume (m³)</label>
            <input
              type="number"
              name="consumption_volume"
              value={formData.consumption_volume}
              onChange={handleChange}
              step="0.01"
              style={inputStyle}
              placeholder="0.00"
            />
          </div>

          {/* Discharge Volume */}
          <div>
            <label style={labelStyle}>Discharge Volume (m³)</label>
            <input
              type="number"
              name="discharge_volume"
              value={formData.discharge_volume}
              onChange={handleChange}
              step="0.01"
              style={inputStyle}
              placeholder="0.00"
            />
          </div>

          {/* Recycled Volume */}
          <div>
            <label style={labelStyle}>♻️ Recycled Volume (m³)</label>
            <input
              type="number"
              name="recycled_volume"
              value={formData.recycled_volume}
              onChange={handleChange}
              step="0.01"
              style={inputStyle}
              placeholder="0.00"
            />
          </div>

          {/* Emission Factor */}
          <div>
            <label style={labelStyle}>Emission Factor (kg CO2e/m³)</label>
            <input
              type="number"
              name="emission_factor"
              value={formData.emission_factor}
              onChange={handleChange}
              step="0.0001"
              style={inputStyle}
              placeholder="0.0000"
            />
          </div>

          {/* Water Stress Index */}
          <div>
            <label style={labelStyle}>Water Stress Index</label>
            <input
              type="number"
              name="water_stress_index"
              value={formData.water_stress_index}
              onChange={handleChange}
              step="0.01"
              style={inputStyle}
              placeholder="0.00"
            />
          </div>

          {/* Discharge Quality - Full Width */}
          <div style={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
            <label style={labelStyle}>Discharge Quality</label>
            <input
              type="text"
              name="discharge_quality"
              value={formData.discharge_quality}
              onChange={handleChange}
              placeholder="e.g., BOD: 30 mg/L, COD: 100 mg/L"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          paddingTop: '12px',
          borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
          flexDirection: isMobile ? 'column' : 'row',
        }}>
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: isMobile ? 'none' : 1,
              padding: isMobile ? '12px 16px' : '12px 24px',
              background: loading 
                ? (isDark ? '#475569' : '#9ca3af')
                : 'linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%)',
              color: 'white',
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: '600',
              border: 'none',
              borderRadius: '10px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(14, 165, 233, 0.3)',
            }}
          >
            {loading ? '💾 Saving...' : '💾 Save Water Record'}
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              style={{
                flex: isMobile ? 'none' : 1,
                padding: isMobile ? '12px 16px' : '12px 24px',
                background: isDark ? 'rgba(255,255,255,0.1)' : '#f3f4f6',
                color: colors.textSecondary,
                fontSize: isMobile ? '13px' : '14px',
                fontWeight: '600',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : '#e5e7eb'}`,
                borderRadius: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default WaterForm;
