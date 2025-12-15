import { useState, useEffect } from 'react';
import { activitiesAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import Navbar from '../Layout/Navbar';
import ActivityForm from './ActivityForm';

const ActivityList = () => {
  const { isDark, colors } = useTheme();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editActivity, setEditActivity] = useState(null);
  const [filterScope, setFilterScope] = useState('all');

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const response = await activitiesAPI.getAll();
      setActivities(response.data);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      try {
        await activitiesAPI.delete(id);
        fetchActivities();
      } catch (error) {
        console.error('Failed to delete activity:', error);
      }
    }
  };

  const handleEdit = (activity) => {
    setEditActivity(activity);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditActivity(null);
    fetchActivities();
  };

  const getScopeColor = (scope) => {
    switch (scope) {
      case 'Scope 1': return { bg: '#EF4444', light: '#FEE2E2', icon: '🔥' };
      case 'Scope 2': return { bg: '#F59E0B', light: '#FEF3C7', icon: '⚡' };
      case 'Scope 3': return { bg: '#10B981', light: '#D1FAE5', icon: '🚚' };
      default: return { bg: '#6B7280', light: '#F3F4F6', icon: '📊' };
    }
  };

  const filteredActivities = filterScope === 'all'
    ? activities
    : activities.filter(a => a.scope === filterScope);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: isDark 
        ? 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' 
        : 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)' 
    }}>
      <Navbar />

      {/* Hero Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        marginTop: '64px',
        padding: '80px 20px 60px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          opacity: 0.1,
          backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }}></div>

        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <div style={{ textAlign: 'center', color: 'white' }}>
            <div style={{
              display: 'inline-block',
              background: 'rgba(255,255,255,0.25)',
              padding: '8px 20px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 'bold',
              marginBottom: '20px',
              backdropFilter: 'blur(10px)'
            }}>
              CARBON TRACKING & MANAGEMENT
            </div>
            <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '15px' }}>
              Activity Management
            </h1>
            <p style={{ fontSize: '18px', opacity: 0.95, maxWidth: '600px', margin: '0 auto' }}>
              Track and manage your carbon emission activities across all scopes
            </p>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1200px', margin: '-50px auto 0', padding: '0 20px 80px', position: 'relative', zIndex: 2 }}>

        {/* Add Activity Button */}
        <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={() => {
              setEditActivity(null);
              setShowForm(!showForm);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '18px 40px',
              background: showForm ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #00A86B, #1E88E5)',
              color: 'white',
              border: 'none',
              borderRadius: '50px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: showForm ? '0 10px 30px rgba(239,68,68,0.3)' : '0 10px 30px rgba(0,168,107,0.3)',
              transition: 'all 0.3s',
              transform: showForm ? 'scale(0.98)' : 'scale(1)'
            }}
          >
            <span style={{ fontSize: '20px' }}>{showForm ? '✕' : '➕'}</span>
            {showForm ? 'Cancel' : 'Add New Activity'}
          </button>
        </div>

        {/* Form Section */}
        {showForm && (
          <div style={{
            marginBottom: '40px',
            animation: 'slideDown 0.4s ease'
          }}>
            <div style={{
              background: isDark ? '#1e293b' : 'white',
              borderRadius: '25px',
              padding: '40px',
              boxShadow: isDark ? '0 20px 60px rgba(0,0,0,0.4)' : '0 20px 60px rgba(0,0,0,0.15)',
              border: `1px solid ${isDark ? '#334155' : '#f0f0f0'}`
            }}>
              <ActivityForm onSuccess={handleFormSuccess} editActivity={editActivity} isDark={isDark} colors={colors} />
            </div>
          </div>
        )}

        {/* Filter Section */}
        <div style={{
          background: isDark ? '#1e293b' : 'white',
          borderRadius: '25px',
          padding: '30px',
          marginBottom: '40px',
          boxShadow: isDark ? '0 10px 40px rgba(0,0,0,0.3)' : '0 10px 40px rgba(0,0,0,0.08)',
          border: `1px solid ${isDark ? '#334155' : '#f0f0f0'}`
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '15px', fontWeight: '700', color: colors.text }}>
                Filter by Scope:
              </span>
              {['all', 'Scope 1', 'Scope 2', 'Scope 3'].map((scope) => {
                const isActive = filterScope === scope;
                return (
                  <button
                    key={scope}
                    onClick={() => setFilterScope(scope)}
                    style={{
                      padding: '10px 24px',
                      borderRadius: '50px',
                      border: 'none',
                      fontSize: '14px',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      background: isActive 
                        ? 'linear-gradient(135deg, #00A86B, #1E88E5)' 
                        : isDark ? '#0f172a' : '#f3f4f6',
                      color: isActive ? 'white' : colors.textSecondary,
                      boxShadow: isActive ? '0 4px 15px rgba(0,168,107,0.3)' : 'none',
                      transform: isActive ? 'scale(1.05)' : 'scale(1)'
                    }}
                  >
                    {scope === 'all' ? 'All Scopes' : scope}
                  </button>
                );
              })}
            </div>
            <div style={{
              background: isDark 
                ? 'linear-gradient(135deg, #334155, #475569)' 
                : 'linear-gradient(135deg, #f3f4f6, #e5e7eb)',
              padding: '10px 20px',
              borderRadius: '50px',
              fontSize: '14px',
              fontWeight: '600',
              color: colors.text
            }}>
              {filteredActivities.length} of {activities.length} activities
            </div>
          </div>
        </div>

        {/* Activities List */}
        {loading ? (
          <div style={{
            background: isDark ? '#1e293b' : 'white',
            borderRadius: '25px',
            padding: '80px',
            textAlign: 'center',
            boxShadow: isDark ? '0 10px 40px rgba(0,0,0,0.3)' : '0 10px 40px rgba(0,0,0,0.08)'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              border: `6px solid ${isDark ? '#34d399' : '#10b981'}`,
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 30px'
            }}></div>
            <p style={{ fontSize: '18px', color: colors.textSecondary, fontWeight: '500' }}>Loading activities...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div style={{
            background: isDark ? '#1e293b' : 'white',
            borderRadius: '25px',
            padding: '80px 40px',
            textAlign: 'center',
            boxShadow: isDark ? '0 10px 40px rgba(0,0,0,0.3)' : '0 10px 40px rgba(0,0,0,0.08)'
          }}>
            <div style={{ fontSize: '96px', marginBottom: '30px' }}>📋</div>
            <h3 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '15px', color: colors.text }}>
              {filterScope === 'all' ? 'No activities yet' : `No ${filterScope} activities`}
            </h3>
            <p style={{ fontSize: '18px', color: colors.textSecondary, marginBottom: '40px', maxWidth: '500px', margin: '0 auto 40px' }}>
              Start tracking your carbon emissions by adding your first activity
            </p>
            <button
              onClick={() => setShowForm(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '12px',
                padding: '18px 40px',
                background: 'linear-gradient(135deg, #00A86B, #1E88E5)',
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 10px 30px rgba(0,168,107,0.3)'
              }}
            >
              <span style={{ fontSize: '20px' }}>➕</span>
              Add First Activity
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '25px' }}>
            {filteredActivities.map((activity) => {
              const scopeStyle = getScopeColor(activity.scope);
              return (
                <div
                  key={activity.id}
                  style={{
                    background: isDark ? '#1e293b' : 'white',
                    borderRadius: '25px',
                    padding: '35px',
                    boxShadow: isDark ? '0 10px 40px rgba(0,0,0,0.3)' : '0 10px 40px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s',
                    cursor: 'pointer',
                    border: `1px solid ${isDark ? '#334155' : '#f0f0f0'}`
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-5px)';
                    e.currentTarget.style.boxShadow = isDark ? '0 20px 50px rgba(0,0,0,0.5)' : '0 20px 50px rgba(0,0,0,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = isDark ? '0 10px 40px rgba(0,0,0,0.3)' : '0 10px 40px rgba(0,0,0,0.08)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '30px' }}>
                    {/* Left Content */}
                    <div style={{ flex: 1 }}>
                      {/* Scope Badge & Date */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', flexWrap: 'wrap' }}>
                        <div style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: scopeStyle.light,
                          padding: '8px 18px',
                          borderRadius: '50px'
                        }}>
                          <span style={{ fontSize: '18px' }}>{scopeStyle.icon}</span>
                          <span style={{
                            fontSize: '14px',
                            fontWeight: 'bold',
                            color: scopeStyle.bg
                          }}>
                            {activity.scope}
                          </span>
                        </div>
                        <span style={{ fontSize: '14px', color: colors.textTertiary, fontWeight: '500' }}>
                          📅 {new Date(activity.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>

                      {/* Activity Title */}
                      <h3 style={{
                        fontSize: '26px',
                        fontWeight: 'bold',
                        marginBottom: '20px',
                        color: colors.text,
                        textTransform: 'capitalize'
                      }}>
                        {activity.activity_type.replace(/_/g, ' ')}
                      </h3>

                      {/* User Info & Approval Status */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        marginBottom: '20px',
                        padding: '12px',
                        background: isDark ? '#0f172a' : '#f9fafb',
                        borderRadius: '12px'
                      }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '14px'
                        }}>
                          {activity.created_by_name?.charAt(0) || 'U'}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: colors.text }}>
                            Created by {activity.created_by_name || 'Unknown User'}
                          </div>
                          <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                            {activity.created_by_email || 'No email'}
                          </div>
                        </div>
                        {activity.approval_status === 'pending' && (
                          <span style={{
                            background: '#fef3c7',
                            color: '#92400e',
                            padding: '6px 14px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            Pending Approval
                          </span>
                        )}
                        {activity.approval_status === 'approved' && (
                          <span style={{
                            background: '#d1fae5',
                            color: '#065f46',
                            padding: '6px 14px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 'bold'
                          }}>
                            Approved
                          </span>
                        )}
                      </div>

                      {/* Stats Grid */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '15px',
                        marginBottom: '20px'
                      }}>
                        <div style={{
                          background: isDark 
                            ? 'linear-gradient(135deg, #334155, #475569)' 
                            : 'linear-gradient(135deg, #f9fafb, #f3f4f6)',
                          borderRadius: '15px',
                          padding: '18px'
                        }}>
                          <div style={{ fontSize: '11px', color: colors.textSecondary, fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase' }}>
                            Category
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: colors.text, textTransform: 'capitalize' }}>
                            {activity.category}
                          </div>
                        </div>
                        <div style={{
                          background: isDark 
                            ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(37, 99, 235, 0.15))' 
                            : 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                          borderRadius: '15px',
                          padding: '18px'
                        }}>
                          <div style={{ fontSize: '11px', color: isDark ? '#60a5fa' : '#1e40af', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase' }}>
                            Quantity
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: 'bold', color: isDark ? '#93c5fd' : '#1e3a8a' }}>
                            {activity.quantity} {activity.unit}
                          </div>
                        </div>
                        <div style={{
                          background: isDark 
                            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.15))' 
                            : 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                          borderRadius: '15px',
                          padding: '18px'
                        }}>
                          <div style={{ fontSize: '11px', color: isDark ? '#34d399' : '#065f46', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase' }}>
                            CO₂e Emissions
                          </div>
                          <div style={{ fontSize: '18px', fontWeight: 'bold', color: isDark ? '#6ee7b7' : '#047857' }}>
                            {activity.co2e_calculated.toFixed(2)} kg
                          </div>
                        </div>
                      </div>

                      {/* Notes */}
                      {activity.notes && (
                        <div style={{
                          background: isDark 
                            ? 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.1))' 
                            : 'linear-gradient(135deg, #fef3c7, #fde68a)',
                          borderRadius: '15px',
                          padding: '18px',
                          marginTop: '15px'
                        }}>
                          <div style={{ fontSize: '11px', color: isDark ? '#fbbf24' : '#92400e', fontWeight: '700', marginBottom: '6px', textTransform: 'uppercase' }}>
                            Notes
                          </div>
                          <div style={{ fontSize: '14px', color: isDark ? '#fcd34d' : '#78350f', lineHeight: '1.6' }}>
                            {activity.notes}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Actions */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <button
                        onClick={() => handleEdit(activity)}
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '15px',
                          border: 'none',
                          background: isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff',
                          color: isDark ? '#60a5fa' : '#2563eb',
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#2563eb';
                          e.currentTarget.style.color = 'white';
                          e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff';
                          e.currentTarget.style.color = isDark ? '#60a5fa' : '#2563eb';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDelete(activity.id)}
                        style={{
                          width: '50px',
                          height: '50px',
                          borderRadius: '15px',
                          border: 'none',
                          background: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2',
                          color: isDark ? '#f87171' : '#dc2626',
                          cursor: 'pointer',
                          transition: 'all 0.3s',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '20px'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#dc2626';
                          e.currentTarget.style.color = 'white';
                          e.currentTarget.style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = isDark ? 'rgba(239, 68, 68, 0.2)' : '#fee2e2';
                          e.currentTarget.style.color = isDark ? '#f87171' : '#dc2626';
                          e.currentTarget.style.transform = 'scale(1)';
                        }}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ActivityList;