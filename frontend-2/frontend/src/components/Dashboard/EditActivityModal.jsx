import { useState, useEffect } from 'react';
import { activitiesAPI } from "../../services/api";

function EditActivityModal({ user, activity, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    activity_name: '',
    quantity: '',
    unit: '',
    activity_date: '',
    description: '',
    is_verified: false,
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activity) {
      setFormData({
        activity_name: activity.activity_name || '',
        quantity: activity.quantity || '',
        unit: activity.unit || '',
        activity_date: activity.activity_date ? new Date(activity.activity_date).toISOString().split('T')[0] : '',
        description: activity.description || '',
        is_verified: activity.is_verified || false,
        notes: activity.notes || '',
      });
    }
  }, [activity]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate
      if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
        throw new Error('Please enter a valid quantity');
      }

      // Prepare update data
      const updateData = {
        activity_name: formData.activity_name,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        activity_date: formData.activity_date,
        description: formData.description,
        is_verified: formData.is_verified,
        notes: formData.notes,
      };

      // Call API
      const result = await activitiesAPI.updateActivity(user.company_id, activity.id, updateData);

      console.log('✅ Activity updated:', result);
      onSuccess(); // Refresh data
      onClose(); // Close modal

    } catch (err) {
      console.error('❌ Error updating activity:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to update activity');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>✏️ Edit Activity</h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && (
            <div style={styles.error}>
              ❌ {error}
            </div>
          )}

          {/* Activity Name */}
          <div style={styles.field}>
            <label style={styles.label}>Activity Name</label>
            <input
              type="text"
              value={formData.activity_name}
              onChange={(e) => setFormData({ ...formData, activity_name: e.target.value })}
              placeholder="Activity name"
              style={styles.input}
            />
          </div>

          {/* Quantity & Unit */}
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Quantity</label>
              <input
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="Enter quantity"
                style={styles.input}
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Unit</label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="Unit"
                style={styles.input}
                required
              />
            </div>
          </div>

          {/* Date */}
          <div style={styles.field}>
            <label style={styles.label}>Date</label>
            <input
              type="date"
              value={formData.activity_date}
              onChange={(e) => setFormData({ ...formData, activity_date: e.target.value })}
              style={styles.input}
              required
            />
          </div>

          {/* Description */}
          <div style={styles.field}>
            <label style={styles.label}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional details..."
              style={styles.textarea}
              rows="3"
            />
          </div>

          {/* Verification */}
          <div style={styles.field}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.is_verified}
                onChange={(e) => setFormData({ ...formData, is_verified: e.target.checked })}
                style={styles.checkbox}
              />
              Verified Activity
            </label>
          </div>

          {/* Notes */}
          <div style={styles.field}>
            <label style={styles.label}>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Internal notes..."
              style={styles.textarea}
              rows="2"
            />
          </div>

          {/* Buttons */}
          <div style={styles.buttons}>
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
              {loading ? '⏳ Updating...' : '✅ Update Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
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
    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px',
    borderBottom: '1px solid #eee',
  },
  title: {
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
  error: {
    padding: '12px',
    background: '#fee',
    color: '#c33',
    borderRadius: '8px',
    marginBottom: '16px',
  },
  field: {
    marginBottom: '20px',
    flex: 1,
  },
  row: {
    display: 'flex',
    gap: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    cursor: 'pointer',
  },
  checkbox: {
    marginRight: '8px',
  },
  input: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    outline: 'none',
    transition: 'border 0.3s',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    fontSize: '16px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    outline: 'none',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  buttons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '24px',
  },
  cancelBtn: {
    padding: '12px 24px',
    fontSize: '16px',
    background: '#f5f5f5',
    color: '#666',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  },
  submitBtn: {
    padding: '12px 24px',
    fontSize: '16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
  },
};

export default EditActivityModal;
