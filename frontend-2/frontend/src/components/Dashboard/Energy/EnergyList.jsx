import React, { useState, useEffect } from 'react';
import { energyAPI } from '../../../services/api';

const EnergyList = ({ companyId, refreshTrigger }) => {
  const [energies, setEnergies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalQuantity: 0,
    totalEmissions: 0,
    renewablePercentage: 0,
    recordCount: 0
  });

  useEffect(() => {
    fetchEnergies();
  }, [companyId, refreshTrigger]);

  const fetchEnergies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await energyAPI.listEnergy(companyId);
      const energyData = response.data.energies || [];
      setEnergies(energyData);

      const totalQuantity = energyData.reduce((sum, e) => sum + (e.quantity || 0), 0);
      const totalEmissions = energyData.reduce((sum, e) => sum + (e.emissions_kgco2e || 0), 0);
      const totalRenewable = energyData.reduce((sum, e) => sum + (e.renewable_percentage || 0), 0);

      const stats = {
        totalQuantity,
        totalEmissions,
        renewablePercentage: energyData.length > 0 ? totalRenewable / energyData.length : 0,
        recordCount: energyData.length
      };

      setStats(stats);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load energy records');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #16a34a',
          borderRadius: '50%',
          width: '3rem',
          height: '3rem',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '1rem',
        backgroundColor: '#fee2e2',
        border: '1px solid #f87171',
        color: '#991b1b',
        borderRadius: '0.5rem'
      }}>
        {error}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1rem'
      }}>
        {/* Total Consumption */}
        <div style={{
          backgroundColor: '#fef3c7',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          border: '1px solid #fcd34d',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#d97706', fontWeight: '500', marginBottom: '0.5rem' }}>
                Total Energy
              </p>
              <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#78350f', marginBottom: '0.25rem' }}>
                {stats.totalQuantity.toFixed(2)}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#fbbf24' }}>Units</p>
            </div>
            <span style={{ fontSize: '2.5rem' }}>⚡</span>
          </div>
        </div>

        {/* Total Emissions */}
        <div style={{
          backgroundColor: '#fef2f2',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          border: '1px solid #fecaca',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#dc2626', fontWeight: '500', marginBottom: '0.5rem' }}>
                Total Emissions
              </p>
              <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#7f1d1d', marginBottom: '0.25rem' }}>
                {stats.totalEmissions.toFixed(2)}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#f87171' }}>kg CO2e</p>
            </div>
            <span style={{ fontSize: '2.5rem' }}>📊</span>
          </div>
        </div>

        {/* Renewable Percentage */}
        <div style={{
          backgroundColor: '#d1fae5',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          border: '1px solid #6ee7b7',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#059669', fontWeight: '500', marginBottom: '0.5rem' }}>
                Renewable Energy
              </p>
              <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#064e3b', marginBottom: '0.25rem' }}>
                {stats.renewablePercentage.toFixed(1)}%
              </p>
              <p style={{ fontSize: '0.75rem', color: '#34d399' }}>Average</p>
            </div>
            <span style={{ fontSize: '2.5rem' }}>🌱</span>
          </div>
        </div>

        {/* Record Count */}
        <div style={{
          backgroundColor: '#e0e7ff',
          padding: '1.5rem',
          borderRadius: '0.75rem',
          border: '1px solid #c7d2fe',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.875rem', color: '#4f46e5', fontWeight: '500', marginBottom: '0.5rem' }}>
                Total Records
              </p>
              <p style={{ fontSize: '1.875rem', fontWeight: 'bold', color: '#312e81', marginBottom: '0.25rem' }}>
                {stats.recordCount}
              </p>
              <p style={{ fontSize: '0.75rem', color: '#818cf8' }}>entries</p>
            </div>
            <span style={{ fontSize: '2.5rem' }}>📋</span>
          </div>
        </div>
      </div>

      {/* Energy Records Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '0.75rem',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#1f2937', marginBottom: '0.25rem' }}>
            Energy Consumption Records
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
            {energies.length} total records
          </p>
        </div>

        {energies.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
            <p>No energy records found. Add your first energy consumption record above.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ backgroundColor: '#f9fafb' }}>
                <tr>
                  <th style={tableHeaderStyle}>Date</th>
                  <th style={tableHeaderStyle}>Energy Type</th>
                  <th style={tableHeaderStyle}>Quantity</th>
                  <th style={tableHeaderStyle}>Unit</th>
                  <th style={tableHeaderStyle}>Location</th>
                  <th style={tableHeaderStyle}>Renewable %</th>
                  <th style={tableHeaderStyle}>Emissions (kg CO2e)</th>
                </tr>
              </thead>
              <tbody>
                {energies.map((energy, index) => (
                  <tr key={energy.id} style={{
                    backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <td style={tableCellStyle}>
                      {energy.created_at ? new Date(energy.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={tableCellStyle}>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        backgroundColor: '#fef3c7',
                        color: '#92400e',
                        borderRadius: '0.375rem',
                        display: 'inline-block'
                      }}>
                        {energy.energy_type?.split('_').join(' ')}
                      </span>
                    </td>
                    <td style={tableCellStyle}>
                      {energy.quantity?.toFixed(2) || '0.00'}
                    </td>
                    <td style={tableCellStyle}>
                      {energy.unit || '-'}
                    </td>
                    <td style={tableCellStyle}>
                      {energy.location || '-'}
                    </td>
                    <td style={tableCellStyle}>
                      {energy.renewable_percentage ? (
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          backgroundColor: '#d1fae5',
                          color: '#065f46',
                          borderRadius: '0.375rem',
                          display: 'inline-block'
                        }}>
                          {energy.renewable_percentage}%
                        </span>
                      ) : '-'}
                    </td>
                    <td style={{ ...tableCellStyle, fontWeight: '500', color: '#dc2626' }}>
                      {energy.emissions_kgco2e?.toFixed(2) || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

const tableHeaderStyle = {
  padding: '0.75rem 1.5rem',
  textAlign: 'left',
  fontSize: '0.75rem',
  fontWeight: '500',
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
};

const tableCellStyle = {
  padding: '1rem 1.5rem',
  fontSize: '0.875rem',
  color: '#1f2937',
  whiteSpace: 'nowrap'
};

export default EnergyList;