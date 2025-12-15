import { useState, useEffect } from 'react';
import DashboardLayout from './DashboardLayout';
import { activitiesAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useResponsive } from '../../hooks/useResponsive';
import EditActivityModal from './EditActivityModal';
import AddActivityModal from './AddActivityModal';

function ActivityList() {
  const { user } = useAuth();
  const { isMobile, isTablet } = useResponsive();
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [scopeFilter, setScopeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [sortBy, setSortBy] = useState('activity_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);

  useEffect(() => {
    if (user?.company_id) {
      fetchActivities();
    }
  }, [user, scopeFilter, categoryFilter, sortBy, sortOrder]);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const params = {
        scope: scopeFilter || undefined,
        category: categoryFilter || undefined,
        limit: 1000, // Large limit to get all activities
      };
      const response = await activitiesAPI.getActivities(user.company_id, params);
      let data = response.data.activities || [];

      // Sort data
      data.sort((a, b) => {
        let aVal, bVal;

        if (sortBy === 'activity_date') {
          aVal = a.activity_date ? new Date(a.activity_date) : (sortOrder === 'asc' ? new Date(8640000000000000) : new Date(0));
          bVal = b.activity_date ? new Date(b.activity_date) : (sortOrder === 'asc' ? new Date(8640000000000000) : new Date(0));
        } else if (sortBy === 'emissions_kgco2e') {
          aVal = a.emissions_kgco2e != null ? a.emissions_kgco2e : (sortOrder === 'asc' ? Infinity : -Infinity);
          bVal = b.emissions_kgco2e != null ? b.emissions_kgco2e : (sortOrder === 'asc' ? Infinity : -Infinity);
        } else if (sortBy === 'activity_name') {
          aVal = (a.activity_name || `${a.activity_type} - ${a.quantity} ${a.unit}`).toLowerCase();
          bVal = (b.activity_name || `${b.activity_type} - ${b.quantity} ${b.unit}`).toLowerCase();
        }

        if (sortOrder === 'asc') {
          return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
        } else {
          return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
        }
      });

      setActivities(data);
    } catch (err) {
      setError('Failed to load activities');
      console.error('Error fetching activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditActivity = (activity) => {
    setSelectedActivity(activity);
    setShowEditModal(true);
  };

  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm('Are you sure you want to delete this activity?')) {
      return;
    }

    try {
      await activitiesAPI.deleteActivity(user.company_id, activityId);
      await fetchActivities(); // Refresh the list
    } catch (err) {
      console.error('Error deleting activity:', err);
      alert('Failed to delete activity');
    }
  };

  const handleActivityUpdated = () => {
    setShowEditModal(false);
    setSelectedActivity(null);
    fetchActivities(); // Refresh the list
  };

  const handleActivityAdded = () => {
    setShowAddModal(false);
    fetchActivities(); // Refresh the list
  };

  const filteredActivities = activities.filter(activity =>
    activity.activity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.activity_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatEmissions = (kg) => {
    if (!kg) return '0.00';
    return `${(kg / 1000).toFixed(4)} t`;
  };

  const getScopeColor = (scope) => {
    switch (scope) {
      case 'Scope 1': return '#ef4444';
      case 'Scope 2': return '#f59e0b';
      case 'Scope 3': return '#10b981';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>Loading activities...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div style={styles.errorContainer}>
          <p style={styles.errorText}>{error}</p>
          <button onClick={fetchActivities} style={styles.retryButton}>
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Hero Section */}
      <div style={{
        ...styles.heroSection,
        padding: isMobile ? '24px' : isTablet ? '32px' : '40px',
      }}>
        <div style={{
          ...styles.heroContent,
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '24px' : '40px',
        }}>
          <div style={styles.heroText}>
            <h1 style={{
              ...styles.heroTitle,
              fontSize: isMobile ? '28px' : isTablet ? '32px' : '36px',
            }}>
              Emission Activities
            </h1>
            <p style={{
              ...styles.heroSubtitle,
              fontSize: isMobile ? '14px' : isTablet ? '16px' : '18px',
            }}>
              Track and manage your company's carbon footprint with detailed activity monitoring
            </p>
            <div style={{
              ...styles.statsGrid,
              gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
              gap: isMobile ? '12px' : '20px',
            }}>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>{filteredActivities.length}</div>
                <div style={styles.statLabel}>Total Activities</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>
                  {(filteredActivities.reduce((sum, a) => sum + (a.emissions_kgco2e || 0), 0) / 1000 / 1000 * 1000).toFixed(4)}k
                </div>
                <div style={styles.statLabel}>Total Emissions (t CO2e)</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>
                  {new Set(filteredActivities.map(a => a.scope)).size}
                </div>
                <div style={styles.statLabel}>Active Scopes</div>
              </div>
            </div>
          </div>
          <div style={{
            ...styles.heroActions,
            minWidth: isMobile ? '100%' : '200px',
            flexDirection: isMobile ? 'row' : 'column',
          }}>
            <button
              onClick={() => setShowAddModal(true)}
              style={{
                ...styles.primaryButton,
                width: isMobile ? '100%' : 'auto',
              }}
            >
              <span style={styles.buttonIcon}>➕</span>
              {isMobile ? 'Add' : 'Add New Activity'}
            </button>
            <button
              onClick={fetchActivities}
              style={{
                ...styles.secondaryButton,
                width: isMobile ? '100%' : 'auto',
              }}
            >
              <span style={styles.buttonIcon}>🔄</span>
              {isMobile ? 'Refresh' : 'Refresh Data'}
            </button>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div style={styles.filtersSection}>
        <div style={styles.filtersCard}>
          <div style={styles.filtersHeader}>
            <h3 style={styles.filtersTitle}>🔍 Filter & Search</h3>
            <div style={styles.activeFilters}>
              {(searchTerm || scopeFilter || categoryFilter) && (
                <span style={styles.filterBadge}>
                  {[
                    searchTerm && 'Search',
                    scopeFilter && `Scope ${scopeFilter}`,
                    categoryFilter && categoryFilter
                  ].filter(Boolean).join(', ')}
                </span>
              )}
            </div>
          </div>

          <div style={{
            ...styles.filtersGrid,
            gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: isMobile ? '16px' : '20px',
          }}>
            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Search Activities</label>
              <div style={styles.searchWrapper}>
                <span style={styles.searchIcon}>🔍</span>
                <input
                  type="text"
                  placeholder="Search by name, type, or category..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={styles.searchInput}
                />
              </div>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Filter by Scope</label>
              <select
                value={scopeFilter}
                onChange={(e) => setScopeFilter(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="">All Scopes</option>
                <option value="1">🔴 Scope 1 - Direct</option>
                <option value="2">🟡 Scope 2 - Indirect</option>
                <option value="3">🟢 Scope 3 - Value Chain</option>
              </select>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Filter by Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="">All Categories</option>
                {[...new Set(activities.map(a => a.category).filter(Boolean))].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div style={styles.filterGroup}>
              <label style={styles.filterLabel}>Sort By</label>
              <select
                value={`${sortBy}_${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('_');
                  setSortBy(field);
                  setSortOrder(order);
                }}
                style={styles.filterSelect}
              >
                <option value="activity_date_desc">📅 Date (Newest First)</option>
                <option value="activity_date_asc">📅 Date (Oldest First)</option>
                <option value="emissions_kgco2e_desc">📈 Emissions (High to Low)</option>
                <option value="emissions_kgco2e_asc">📉 Emissions (Low to High)</option>
                <option value="activity_name_asc">📝 Name (A-Z)</option>
                <option value="activity_name_desc">📝 Name (Z-A)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Activities Table */}
      <div style={styles.tableSection}>
        <div style={styles.tableCard}>
          <div style={styles.tableHeader}>
            <h3 style={styles.tableTitle}>
              📊 Activity Details
              <span style={styles.tableCount}>
                ({filteredActivities.length} {filteredActivities.length === 1 ? 'activity' : 'activities'})
              </span>
            </h3>
          </div>

          <div style={styles.tableWrapper}>
            {isMobile ? (
              // Mobile Card View
              <div style={styles.mobileCardView}>
                {filteredActivities.length === 0 ? (
                  <div style={styles.emptyState}>
                    <div style={styles.emptyStateContent}>
                      <div style={styles.emptyStateIcon}>📭</div>
                      <h4 style={styles.emptyStateTitle}>No activities found</h4>
                      <p style={styles.emptyStateText}>
                        {searchTerm || scopeFilter || categoryFilter
                          ? 'Try adjusting your filters or search terms'
                          : 'Start by adding your first emission activity'
                        }
                      </p>
                      {!searchTerm && !scopeFilter && !categoryFilter && (
                        <button
                          onClick={() => setShowAddModal(true)}
                          style={styles.emptyStateButton}
                        >
                          Add Your First Activity
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  filteredActivities.map((activity, index) => (
                    <div key={activity.id} style={styles.mobileCard}>
                      <div style={styles.mobileCardHeader}>
                        <div style={styles.mobileCardTitle}>
                          {activity.activity_name || `${activity.activity_type} - ${activity.quantity} ${activity.unit}`}
                        </div>
                        <span style={{
                          ...styles.scopeBadge,
                          backgroundColor: getScopeColor(activity.scope),
                          fontSize: '10px',
                          padding: '2px 8px',
                        }}>
                          {activity.scope}
                        </span>
                      </div>
                      <div style={styles.mobileCardBody}>
                        <div style={styles.mobileCardRow}>
                          <span style={styles.mobileCardLabel}>Type:</span>
                          <span style={styles.mobileCardValue}>{activity.activity_type}</span>
                        </div>
                        <div style={styles.mobileCardRow}>
                          <span style={styles.mobileCardLabel}>Quantity:</span>
                          <span style={styles.mobileCardValue}>{activity.quantity?.toLocaleString()} {activity.unit}</span>
                        </div>
                        <div style={styles.mobileCardRow}>
                          <span style={styles.mobileCardLabel}>Emissions:</span>
                          <span style={{...styles.mobileCardValue, color: '#059669', fontWeight: '700'}}>
                            {formatEmissions(activity.emissions_kgco2e)}
                          </span>
                        </div>
                        <div style={styles.mobileCardRow}>
                          <span style={styles.mobileCardLabel}>Category:</span>
                          <span style={styles.mobileCardValue}>{activity.category || 'N/A'}</span>
                        </div>
                        <div style={styles.mobileCardRow}>
                          <span style={styles.mobileCardLabel}>Date:</span>
                          <span style={styles.mobileCardValue}>{formatDate(activity.created_at)}</span>
                        </div>
                      </div>
                      <div style={styles.mobileCardActions}>
                        <button
                          onClick={() => handleEditActivity(activity)}
                          style={{...styles.editButton, flex: 1, marginRight: '8px'}}
                        >
                          <span style={styles.buttonIcon}>✏️</span>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteActivity(activity.id)}
                          style={{...styles.deleteButton, flex: 1}}
                        >
                          <span style={styles.buttonIcon}>🗑️</span>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              // Desktop Table View
              <table style={styles.table}>
                <thead style={styles.tableHead}>
                  <tr>
                    <th style={styles.th}>Activity Details</th>
                    <th style={styles.th}>Type & Quantity</th>
                    <th style={styles.th}>Emissions</th>
                    <th style={styles.th}>Classification</th>
                    <th style={styles.th}>Date & Source</th>
                    <th style={styles.th}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={styles.emptyState}>
                        <div style={styles.emptyStateContent}>
                          <div style={styles.emptyStateIcon}>📭</div>
                          <h4 style={styles.emptyStateTitle}>No activities found</h4>
                          <p style={styles.emptyStateText}>
                            {searchTerm || scopeFilter || categoryFilter
                              ? 'Try adjusting your filters or search terms'
                              : 'Start by adding your first emission activity'
                            }
                          </p>
                          {!searchTerm && !scopeFilter && !categoryFilter && (
                            <button
                              onClick={() => setShowAddModal(true)}
                              style={styles.emptyStateButton}
                            >
                              Add Your First Activity
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredActivities.map((activity, index) => (
                    <tr key={activity.id} style={{
                      ...styles.tr,
                      backgroundColor: index % 2 === 0 ? '#ffffff' : '#fafafa'
                    }}>
                      <td style={styles.td}>
                        <div style={styles.activityCell}>
                          <div style={styles.activityName}>
                            {activity.activity_name || `${activity.activity_type} - ${activity.quantity} ${activity.unit}`}
                          </div>
                          {activity.description && (
                            <div style={styles.activityDescription}>
                              {activity.description}
                            </div>
                          )}
                          {activity.is_verified && (
                            <div style={styles.verifiedBadge}>
                              ✅ Verified
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.typeCell}>
                          <div style={styles.activityType}>
                            {activity.activity_type}
                          </div>
                          <div style={styles.quantity}>
                            {activity.quantity?.toLocaleString()} {activity.unit}
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.emissionsCell}>
                          <div style={styles.emissionsValue}>
                            {formatEmissions(activity.emissions_kgco2e)}
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.classificationCell}>
                          <span style={{
                            ...styles.scopeBadge,
                            backgroundColor: getScopeColor(activity.scope)
                          }}>
                            {activity.scope}
                          </span>
                          <div style={styles.category}>
                            {activity.category || 'N/A'}
                          </div>
                          {activity.subcategory && !/^\d+(\.\d+)*$/.test(activity.subcategory) && (
                            <div style={styles.subcategory}>
                              {activity.subcategory}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.dateCell}>
                          <div style={styles.activityDate}>
                            {formatDate(activity.created_at)}
                          </div>
                          <div style={styles.source}>
                            {activity.source_document ? (
                              <span style={styles.sourceDoc}>
                                📄 {activity.source_document}
                              </span>
                            ) : (
                              <span style={styles.manualEntry}>
                                ✏️ Manual Entry
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={styles.td}>
                        <div style={styles.actionsCell}>
                          <button
                            onClick={() => handleEditActivity(activity)}
                            style={styles.editButton}
                            title="Edit activity"
                          >
                            <span style={styles.buttonIcon}>✏️</span>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteActivity(activity.id)}
                            style={styles.deleteButton}
                            title="Delete activity"
                          >
                            <span style={styles.buttonIcon}>🗑️</span>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {showEditModal && selectedActivity && (
        <EditActivityModal
          user={user}
          activity={selectedActivity}
          onClose={() => {
            setShowEditModal(false);
            setSelectedActivity(null);
          }}
          onSuccess={handleActivityUpdated}
        />
      )}

      {showAddModal && (
        <AddActivityModal
          user={user}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleActivityAdded}
        />
      )}
    </DashboardLayout>
  );
}

const styles = {
  // Hero Section - Compact
  heroSection: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '16px',
    color: 'white',
    boxShadow: '0 6px 20px rgba(102, 126, 234, 0.25)',
  },
  heroContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '24px',
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    fontSize: '24px',
    fontWeight: '700',
    margin: '0 0 8px 0',
    textShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  heroSubtitle: {
    fontSize: '13px',
    margin: '0 0 16px 0',
    opacity: 0.9,
    lineHeight: '1.4',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
    gap: '12px',
  },
  statCard: {
    background: 'rgba(255,255,255,0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '10px',
    padding: '12px',
    textAlign: 'center',
    border: '1px solid rgba(255,255,255,0.2)',
  },
  statNumber: {
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '2px',
  },
  statLabel: {
    fontSize: '10px',
    opacity: 0.8,
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
  },
  heroActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minWidth: '140px',
  },
  primaryButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '10px 16px',
    background: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
  },
  secondaryButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px 14px',
    background: 'transparent',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.3)',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'all 0.3s ease',
  },
  buttonIcon: {
    fontSize: '14px',
  },

  // Filters Section - Compact
  filtersSection: {
    marginBottom: '16px',
  },
  filtersCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    border: '1px solid #e5e7eb',
  },
  filtersHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  filtersTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  activeFilters: {
    display: 'flex',
    gap: '6px',
  },
  filterBadge: {
    background: '#e0f2fe',
    color: '#0369a1',
    padding: '3px 10px',
    borderRadius: '16px',
    fontSize: '11px',
    fontWeight: '500',
  },
  filtersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
  },
  filterGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  filterLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '6px',
  },
  searchWrapper: {
    position: 'relative',
  },
  searchIcon: {
    position: 'absolute',
    left: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#6b7280',
    fontSize: '14px',
  },
  searchInput: {
    width: '100%',
    padding: '10px 12px 10px 34px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '13px',
    outline: 'none',
    transition: 'border-color 0.3s ease',
    boxSizing: 'border-box',
  },
  filterSelect: {
    padding: '10px 12px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    fontSize: '13px',
    outline: 'none',
    background: 'white',
    cursor: 'pointer',
    transition: 'border-color 0.3s ease',
  },

  // Table Section - Compact
  tableSection: {
    marginBottom: '16px',
  },
  tableCard: {
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
    border: '1px solid #e5e7eb',
  },
  tableHeader: {
    padding: '16px',
    borderBottom: '1px solid #e5e7eb',
    background: '#f9fafb',
  },
  tableTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  tableCount: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '400',
    marginLeft: '6px',
  },
  tableWrapper: {
    overflowX: 'auto',
    maxWidth: '100%',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
  },
  tableHead: {
    background: '#f9fafb',
  },
  th: {
    padding: '12px 10px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: '600',
    color: '#374151',
    borderBottom: '2px solid #e5e7eb',
    whiteSpace: 'nowrap',
  },
  tr: {
    transition: 'background-color 0.2s ease',
  },
  td: {
    padding: '10px',
    fontSize: '12px',
    color: '#374151',
    verticalAlign: 'top',
    borderBottom: '1px solid #f3f4f6',
    wordBreak: 'break-word',
  },

  // Cell Styles - Compact
  activityCell: {
    maxWidth: '180px',
    overflow: 'hidden',
  },
  activityName: {
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '2px',
    lineHeight: '1.3',
    fontSize: '12px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
  },
  activityDescription: {
    fontSize: '10px',
    color: '#6b7280',
    lineHeight: '1.2',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  verifiedBadge: {
    display: 'inline-block',
    background: '#dcfce7',
    color: '#166534',
    padding: '1px 5px',
    borderRadius: '6px',
    fontSize: '9px',
    fontWeight: '500',
    marginTop: '2px',
  },
  typeCell: {
    minWidth: '80px',
  },
  activityType: {
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: '1px',
    fontSize: '11px',
  },
  quantity: {
    fontSize: '10px',
    color: '#6b7280',
  },
  emissionsCell: {
    minWidth: '80px',
  },
  emissionsValue: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#059669',
    marginBottom: '1px',
  },
  emissionFactor: {
    fontSize: '9px',
    color: '#6b7280',
  },
  classificationCell: {
    minWidth: '100px',
  },
  scopeBadge: {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '10px',
    fontWeight: '600',
    marginBottom: '3px',
  },
  category: {
    fontSize: '11px',
    fontWeight: '500',
    color: '#374151',
  },
  subcategory: {
    fontSize: '9px',
    color: '#6b7280',
  },
  dateCell: {
    minWidth: '80px',
  },
  activityDate: {
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: '1px',
    fontSize: '11px',
  },
  source: {
    fontSize: '10px',
  },
  sourceDoc: {
    color: '#0369a1',
    fontWeight: '500',
  },
  manualEntry: {
    color: '#6b7280',
  },
  actionsCell: {
    minWidth: '100px',
  },
  editButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '5px 8px',
    backgroundColor: 'white',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '10px',
    fontWeight: '500',
    marginRight: '4px',
    transition: 'all 0.2s ease',
  },
  deleteButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '5px 8px',
    backgroundColor: 'white',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '10px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },

  // Empty State
  emptyState: {
    textAlign: 'center',
    padding: '40px 16px',
  },
  emptyStateContent: {
    maxWidth: '320px',
    margin: '0 auto',
  },
  emptyStateIcon: {
    fontSize: '40px',
    marginBottom: '12px',
  },
  emptyStateTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 6px 0',
  },
  emptyStateText: {
    fontSize: '12px',
    color: '#6b7280',
    margin: '0 0 16px 0',
    lineHeight: '1.4',
  },
  emptyStateButton: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
  },

  // Loading and Error States
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #f3f4f6',
    borderTop: '3px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '12px',
  },
  errorContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
  },
  errorText: {
    color: '#ef4444',
    fontSize: '14px',
    marginBottom: '12px',
  },
  retryButton: {
    padding: '10px 20px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
  },
  // Mobile Card View - Compact
  mobileCardView: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '12px',
  },
  mobileCard: {
    background: 'white',
    borderRadius: '10px',
    padding: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  },
  mobileCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '10px',
    paddingBottom: '10px',
    borderBottom: '1px solid #e5e7eb',
  },
  mobileCardTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginRight: '6px',
  },
  mobileCardBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    marginBottom: '10px',
  },
  mobileCardRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '12px',
  },
  mobileCardLabel: {
    color: '#6b7280',
    fontWeight: '500',
  },
  mobileCardValue: {
    color: '#1f2937',
    fontWeight: '600',
  },
  mobileCardActions: {
    display: 'flex',
    gap: '6px',
    paddingTop: '10px',
    borderTop: '1px solid #e5e7eb',
  },
};

export default ActivityList;
