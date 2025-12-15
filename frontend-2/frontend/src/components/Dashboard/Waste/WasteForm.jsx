import React, { useState } from 'react';
import { wasteAPI } from '../../../services/api';
import { useTheme } from '../../../context/ThemeContext';
import { useResponsive } from '../../../hooks/useResponsive';

const WasteForm = ({ companyId, onSuccess, onCancel }) => {
  const { colors, isDark } = useTheme();
  const { isMobile, isTablet } = useResponsive();
  
  const [formData, setFormData] = useState({
    waste_type: 'paper_cardboard',
    disposal_method: 'recycling',
    quantity: '',
    unit: 'kg',
    cost: '',
    emission_factor: '',
    hazard: false,
    facility_name: '',
    facility_location: '',
    date: new Date().toISOString().split('T')[0],
    additional_data: {}
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const wasteTypes = [
    { value: 'paper_cardboard', label: '📄 Paper & Cardboard', color: '#D97706' },
    { value: 'plastics', label: '🥤 Plastics', color: '#3B82F6' },
    { value: 'metals', label: '🔩 Metals', color: '#6B7280' },
    { value: 'e_waste', label: '💻 E-Waste', color: '#8B5CF6' },
    { value: 'biohazard', label: '☣️ Biohazard', color: '#EF4444' },
    { value: 'construction', label: '🏗️ Construction', color: '#78716C' },
    { value: 'organic', label: '🍂 Organic', color: '#22C55E' },
    { value: 'glass', label: '🫙 Glass', color: '#06B6D4' },
    { value: 'textile', label: '👕 Textile', color: '#EC4899' },
  ];

  const disposalMethods = [
    { value: 'landfill', label: '🏔️ Landfill', color: '#78716C' },
    { value: 'incineration', label: '🔥 Incineration', color: '#EF4444' },
    { value: 'recycling', label: '♻️ Recycling', color: '#22C55E' },
    { value: 'composting', label: '🌱 Composting', color: '#84CC16' },
    { value: 'anaerobic_digestion', label: '⚗️ Anaerobic Digestion', color: '#8B5CF6' },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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
        cost: formData.cost ? parseFloat(formData.cost) : null,
        emission_factor: formData.emission_factor ? parseFloat(formData.emission_factor) : null,
      };

      await wasteAPI.createWaste(companyId, payload);

      if (onSuccess) onSuccess();

      setFormData({
        waste_type: 'paper_cardboard',
        disposal_method: 'recycling',
        quantity: '',
        unit: 'kg',
        cost: '',
        emission_factor: '',
        hazard: false,
        facility_name: '',
        facility_location: '',
        date: new Date().toISOString().split('T')[0],
        additional_data: {}
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create waste record');
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
        : 'linear-gradient(145deg, #ffffff 0%, #fefce8 100%)',
      padding: isMobile ? '16px' : isTablet ? '20px' : '24px',
      borderRadius: isMobile ? '12px' : '16px',
      boxShadow: isDark 
        ? '0 8px 32px rgba(0,0,0,0.3)' 
        : '0 8px 32px rgba(234, 179, 8, 0.15)',
      marginBottom: isMobile ? '16px' : '24px',
      border: `1px solid ${isDark ? 'rgba(234, 179, 8, 0.2)' : 'rgba(234, 179, 8, 0.3)'}`,
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
        🗑️ Add Waste Disposal Record
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
          {/* Waste Type */}
          <div>
            <label style={labelStyle}>Waste Type *</label>
            <select
              name="waste_type"
              value={formData.waste_type}
              onChange={handleChange}
              required
              style={{
                ...inputStyle,
                cursor: 'pointer',
              }}
            >
              {wasteTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Disposal Method */}
          <div>
            <label style={labelStyle}>Disposal Method *</label>
            <select
              name="disposal_method"
              value={formData.disposal_method}
              onChange={handleChange}
              required
              style={{
                ...inputStyle,
                cursor: 'pointer',
              }}
            >
              {disposalMethods.map(method => (
                <option key={method.value} value={method.value}>
                  {method.label}
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

          {/* Quantity */}
          <div>
            <label style={labelStyle}>Quantity (kg) *</label>
            <input
              type="number"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              step="0.01"
              required
              style={inputStyle}
              placeholder="0.00"
            />
          </div>

          {/* Cost */}
          <div>
            <label style={labelStyle}>💰 Cost (₹)</label>
            <input
              type="number"
              name="cost"
              value={formData.cost}
              onChange={handleChange}
              step="0.01"
              style={inputStyle}
              placeholder="0.00"
            />
          </div>

          {/* Emission Factor */}
          <div>
            <label style={labelStyle}>Emission Factor (kg CO2e/kg)</label>
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

          {/* Facility Name */}
          <div>
            <label style={labelStyle}>🏭 Facility Name</label>
            <input
              type="text"
              name="facility_name"
              value={formData.facility_name}
              onChange={handleChange}
              style={inputStyle}
              placeholder="Disposal facility name"
            />
          </div>

          {/* Facility Location */}
          <div>
            <label style={labelStyle}>📍 Facility Location</label>
            <input
              type="text"
              name="facility_location"
              value={formData.facility_location}
              onChange={handleChange}
              style={inputStyle}
              placeholder="City, State"
            />
          </div>

          {/* Hazard Checkbox */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            paddingTop: isMobile ? '0' : '24px',
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
              color: formData.hazard ? (isDark ? '#F87171' : '#DC2626') : colors.textSecondary,
              padding: '10px 14px',
              background: formData.hazard 
                ? (isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2')
                : (isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6'),
              borderRadius: '10px',
              border: `1px solid ${formData.hazard 
                ? (isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA')
                : (isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB')}`,
              transition: 'all 0.2s',
            }}>
              <input
                type="checkbox"
                name="hazard"
                checked={formData.hazard}
                onChange={handleChange}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  accentColor: '#EF4444',
                }}
              />
              <span>⚠️ Hazardous Waste</span>
            </label>
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
                : 'linear-gradient(135deg, #eab308 0%, #f59e0b 100%)',
              color: 'white',
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: '600',
              border: 'none',
              borderRadius: '10px',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(234, 179, 8, 0.3)',
            }}
          >
            {loading ? '💾 Saving...' : '💾 Save Waste Record'}
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

export default WasteForm;
