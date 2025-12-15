import { useState, useEffect } from 'react';
import { goalsAPI } from '../../services/api';
import DashboardLayout from './DashboardLayout';

function Goals({ user }) {
  const [goals, setGoals] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);

      setGoals([]);
    } catch (error) {
      console.error('Error fetching goals:', error);
      setError('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const createGoal = async (goalData) => {
    try {
      const response = await goalsAPI.createGoal(user.company_id, goalData);
      console.log('Goal created:', response.data);
      setShowCreateModal(false);
      fetchGoals(); // Refresh goals
    } catch (error) {
      console.error('Error creating goal:', error);
      setError(error.response?.data?.detail || 'Failed to create goal');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div style={styles.loadingContainer}>
          <div style={styles.loadingSpinner}>⏳</div>
          <p style={styles.loadingText}>Loading goals...</p>
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
            <h1 style={styles.title}>🎯 Goals & Targets</h1>
            <p style={styles.subtitle}>
              Set and track emission reduction goals
            </p>
          </div>
          <button onClick={() => setShowCreateModal(true)} style={styles.createBtn}>
            ➕ Create Goal
          </button>
        </div>

        {error && (
          <div style={styles.errorBox}>
            ❌ {error}
          </div>
        )}

        {/* Goals List */}
        <div style={styles.goalsSection}>
          {goals.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>🎯</div>
              <p style={styles.emptyText}>No goals set yet</p>
              <p style={styles.emptySubtext}>
                Create your first emission reduction goal to start tracking progress
              </p>
              <button onClick={() => setShowCreateModal(true)} style={styles.emptyBtn}>
                Create Your First Goal
              </button>
            </div>
          ) : (
            <div style={styles.goalsGrid}>
              {goals.map((goal) => (
                <GoalCard key={goal.id} goal={goal} />
              ))}
            </div>
          )}
        </div>

        {showCreateModal && (
          <CreateGoalModal
            user={user}
            onClose={() => setShowCreateModal(false)}
            onCreate={createGoal}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

// Goal Card Component
function GoalCard({ goal }) {
  return (
    <div style={styles.goalCard}>
      <div style={styles.goalHeader}>
        <h3 style={styles.goalName}>{goal.goal_name}</h3>
        <span style={styles.goalStatus}>Active</span>
      </div>

      <div style={styles.goalDetails}>
        <div style={styles.goalMetric}>
          <span style={styles.metricLabel}>Target Year:</span>
          <span style={styles.metricValue}>{goal.target_year}</span>
        </div>
        <div style={styles.goalMetric}>
          <span style={styles.metricLabel}>Reduction:</span>
          <span style={styles.metricValue}>{goal.target_reduction_percentage}%</span>
        </div>
        <div style={styles.goalMetric}>
          <span style={styles.metricLabel}>Scope:</span>
          <span style={styles.metricValue}>{goal.scope_target}</span>
        </div>
      </div>

      <div style={styles.goalProgress}>
        <div style={styles.progressBar}>
          <div style={{...styles.progressFill, width: '0%'}} />
        </div>
        <div style={styles.progressText}>0% Complete</div>
      </div>

      <div style={styles.goalActions}>
        <button style={styles.viewBtn}>View Details</button>
        <button style={styles.editBtn}>Edit</button>
      </div>
    </div>
  );
}

// Create Goal Modal Component
function CreateGoalModal({ user, onClose, onCreate }) {
  const [formData, setFormData] = useState({
    goal_name: '',
    baseline_year: new Date().getFullYear() - 1,
    target_year: new Date().getFullYear() + 5,
    target_reduction_percentage: 30,
    scope_target: 'All',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onCreate(formData);
    } catch (error) {
      // Error handled in parent
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h2 style={styles.modalTitle}>🎯 Create New Goal</h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Goal Name *</label>
            <input
              type="text"
              value={formData.goal_name}
              onChange={(e) => setFormData({...formData, goal_name: e.target.value})}
              placeholder="e.g., Net Zero by 2050"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Baseline Year *</label>
              <input
                type="number"
                value={formData.baseline_year}
                onChange={(e) => setFormData({...formData, baseline_year: parseInt(e.target.value)})}
                min="2000"
                max={new Date().getFullYear()}
                style={styles.input}
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Target Year *</label>
              <input
                type="number"
                value={formData.target_year}
                onChange={(e) => setFormData({...formData, target_year: parseInt(e.target.value)})}
                min={new Date().getFullYear() + 1}
                max="2050"
                style={styles.input}
                required
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Target Reduction (%) *</label>
            <input
              type="number"
              value={formData.target_reduction_percentage}
              onChange={(e) => setFormData({...formData, target_reduction_percentage: parseFloat(e.target.value)})}
              min="1"
              max="100"
              step="0.1"
              style={styles.input}
              required
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Scope Target *</label>
            <select
              value={formData.scope_target}
              onChange={(e) => setFormData({...formData, scope_target: e.target.value})}
              style={styles.select}
              required
            >
              <option value="All">All Scopes</option>
              <option value="Scope 1">Scope 1</option>
              <option value="Scope 2">Scope 2</option>
              <option value="Scope 3">Scope 3</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe your goal..."
              style={styles.textarea}
              rows="3"
            />
          </div>

          <div style={styles.modalActions}>
            <button
              type="button"
              onClick={onClose}
              style={styles.cancelBtn}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={styles.submitBtn}
              disabled={loading}
            >
              {loading ? '⏳ Creating...' : '✅ Create Goal'}
            </button>
          </div>
        </form>
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  createBtn: {
    padding: '12px 28px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
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
  goalsSection: {
    background: 'white',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid #e5e7eb',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 20px',
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
    marginBottom: '24px',
  },
  emptyBtn: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  goalsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
  },
  goalCard: {
    background: '#fafafa',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
  },
  goalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  goalName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
  },
  goalStatus: {
    padding: '4px 12px',
    background: '#d1fae5',
    color: '#059669',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600',
  },
  goalDetails: {
    marginBottom: '20px',
  },
  goalMetric: {
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
  goalProgress: {
    marginBottom: '20px',
  },
  progressBar: {
    height: '8px',
    background: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '8px',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '4px',
    transition: 'width 0.3s',
  },
  progressText: {
    fontSize: '12px',
    color: '#6b7280',
    textAlign: 'center',
  },
  goalActions: {
    display: 'flex',
    gap: '8px',
  },
  viewBtn: {
    flex: 1,
    padding: '8px 16px',
    background: '#f3f4f6',
    color: '#374151',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  editBtn: {
    flex: 1,
    padding: '8px 16px',
    background: '#667eea',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    background: 'white',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '90vh',
    overflow: 'auto',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px',
    borderBottom: '1px solid #eee',
  },
  modalTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#999',
    padding: '0',
    width: '32px',
    height: '32px',
  },
  form: {
    padding: '24px',
  },
  field: {
    marginBottom: '20px',
  },
  row: {
    display: 'flex',
    gap: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '16px',
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '16px',
    background: 'white',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '16px',
    fontFamily: 'inherit',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px',
  },
  cancelBtn: {
    padding: '12px 24px',
    background: '#f5f5f5',
    color: '#666',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  submitBtn: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};

export default Goals;
