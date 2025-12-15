import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from './Sidebar';
import EnergyForm from './Energy/EnergyForm';
import EnergyList from './Energy/EnergyList';

const EnergyManagement = () => {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSuccess = () => {
    setShowForm(false);
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div style={styles.wrapper}>
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      {/* Main Content */}
      <div style={{
        ...styles.mainContent,
        marginLeft: sidebarOpen ? '280px' : '0',
      }}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} style={styles.menuButton}>
                ☰
              </button>
            )}
            <div>
              <h1 style={styles.title}>Energy Management</h1>
              <p style={styles.subtitle}>Track and manage energy consumption across your operations</p>
            </div>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={showForm ? styles.closeButton : styles.addButton}
          >
            {showForm ? '✕ Close Form' : '+ Add Energy Record'}
          </button>
        </div>

        {/* Form Section */}
        {showForm && (
          <EnergyForm
            companyId={user?.company_id}
            onSuccess={handleSuccess}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* List Section */}
        <EnergyList
          companyId={user?.company_id}
          refreshTrigger={refreshTrigger}
        />
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    position: 'relative'
  },
  mainContent: {
    flex: 1,
    padding: '2rem',
    transition: 'margin-left 0.3s ease',
    minHeight: '100vh'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap',
    gap: '1rem'
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
    cursor: 'pointer',
    color: '#374151',
    transition: 'all 0.2s'
  },
  title: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '0.25rem'
  },
  subtitle: {
    fontSize: '1rem',
    color: '#6b7280'
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
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
  closeButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.5rem',
    backgroundColor: '#ef4444',
    color: 'white',
    fontSize: '0.875rem',
    fontWeight: '600',
    border: 'none',
    borderRadius: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    boxShadow: '0 2px 4px rgba(239,68,68,0.3)'
  }
};

export default EnergyManagement;