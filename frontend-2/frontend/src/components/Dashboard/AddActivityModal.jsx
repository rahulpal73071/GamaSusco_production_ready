// frontend/src/components/Dashboard/AddActivityModal.jsx
import { useState, useEffect, useRef, useMemo } from 'react';
import { activitiesAPI, emissionsAPI } from "../../services/api";

function AddActivityModal({ user, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    activity_type: '',
    quantity: '',
    unit: '',
    activity_name: '',
    description: '',
    activity_date: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Autocomplete states
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [commonActivities, setCommonActivities] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [searchLoading, setSearchLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false); // Track initial data load
  
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Function to auto-detect unit based on activity type
  const getDefaultUnit = useMemo(() => (activityType) => {
    if (!activityType) return '';
    
    const typeLower = activityType.toLowerCase().trim();
    
    // Liquid fuels → litre
    const liquidFuels = ['petrol', 'diesel', 'gasoline', 'fuel', 'oil', 'kerosene', 'biodiesel'];
    if (liquidFuels.some(fuel => typeLower.includes(fuel))) {
      return 'litre';
    }
    
    // Electricity → kwh
    if (typeLower.includes('electric') || typeLower.includes('power') || typeLower === 'electricity') {
      return 'kwh';
    }
    
    // Solid fuels → kg
    const solidFuels = ['coal', 'charcoal', 'wood', 'biomass', 'coke', 'lpg'];
    if (solidFuels.some(fuel => typeLower.includes(fuel))) {
      return 'kg';
    }
    
    // Natural gas → m3
    if (typeLower.includes('natural gas') || typeLower.includes('natural_gas') || typeLower === 'gas') {
      return 'm3';
    }
    
    // Transport → km
    const transport = ['flight', 'air travel', 'air_travel', 'travel', 'trip', 'journey', 
                       'train', 'rail', 'bus', 'car', 'taxi', 'vehicle', 'transport', 
                       'commute', 'driving', 'road'];
    if (transport.some(t => typeLower.includes(t))) {
      return 'km';
    }
    
    // Materials → kg or tonne
    const materials = ['steel', 'cement', 'concrete', 'aluminum', 'aluminium', 'plastic', 
                       'paper', 'glass', 'metal', 'iron'];
    if (materials.some(m => typeLower.includes(m))) {
      return 'kg';
    }
    
    // Waste → kg
    if (typeLower.includes('waste') || typeLower.includes('garbage') || typeLower.includes('trash')) {
      return 'kg';
    }
    
    // Water → m3 or litre
    if (typeLower.includes('water')) {
      return 'm3';
    }
    
    // Default: return empty to let user choose
    return '';
  }, []);

  // Auto-fill unit when activity type changes
  useEffect(() => {
    if (formData.activity_type && !formData.unit) {
      const defaultUnit = getDefaultUnit(formData.activity_type);
      if (defaultUnit) {
        setFormData(prev => ({ ...prev, unit: defaultUnit }));
      }
    }
  }, [formData.activity_type, getDefaultUnit]);

  // Fetch data in background - don't block modal opening
  useEffect(() => {
    // Set a small delay to let modal render first
    const timer = setTimeout(() => {
      setDataLoading(true);
      Promise.all([
        fetchCommonActivities(),
        fetchRecentActivities()
      ]).finally(() => {
        setDataLoading(false);
      });
    }, 100); // 100ms delay to let modal appear first

    return () => clearTimeout(timer);
  }, [user?.company_id]);

  // Debounced search for activity suggestions
  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const timer = setTimeout(() => {
        searchActivities(searchQuery);
      }, 300); // 300ms debounce
      return () => clearTimeout(timer);
    } else if (searchQuery.trim().length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target) &&
        inputRef.current &&
        !inputRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchCommonActivities = async () => {
    try {
      const response = await emissionsAPI.getActivities();
      if (response.data?.categories) {
        setCommonActivities(response.data.categories);
      }
    } catch (err) {
      console.error('Failed to fetch common activities:', err);
      // Set fallback common activities if API fails
      setCommonActivities({
        fuels: { activities: ['diesel', 'petrol', 'natural gas', 'LPG', 'coal'], units: ['litre', 'kg', 'm3'] },
        energy: { activities: ['electricity', 'heating', 'cooling'], units: ['kwh', 'mwh'] },
        transport: { activities: ['flight', 'train', 'taxi', 'bus', 'car'], units: ['km'] },
        materials: { activities: ['steel', 'cement', 'concrete', 'aluminum', 'plastic', 'paper'], units: ['kg', 'tonne'] }
      });
    }
  };

  const fetchRecentActivities = async () => {
    if (!user?.company_id) return;
    try {
      // Reduce limit to 5 for faster loading
      const response = await activitiesAPI.getActivities(user.company_id, { limit: 5 });
      if (response.data?.activities) {
        // Get unique activity types from recent activities
        const uniqueTypes = new Map();
        response.data.activities.forEach(activity => {
          if (activity.activity_type && !uniqueTypes.has(activity.activity_type)) {
            uniqueTypes.set(activity.activity_type, {
              activity_type: activity.activity_type,
              unit: activity.unit,
              activity_name: activity.activity_name,
              category: activity.category,
              scope: activity.scope,
            });
          }
        });
        setRecentActivities(Array.from(uniqueTypes.values()));
      }
    } catch (err) {
      console.error('Failed to fetch recent activities:', err);
      // Don't block if this fails
    }
  };

  const searchActivities = async (query) => {
    if (!query || query.trim().length < 2) return;
    
    setSearchLoading(true);
    try {
      // Search emission factors with timeout
      const searchPromise = emissionsAPI.searchFactors(query, 10);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Search timeout')), 3000)
      );
      
      const searchResponse = await Promise.race([searchPromise, timeoutPromise]);
      
      if (searchResponse.data?.results) {
        const searchResults = searchResponse.data.results.map(result => ({
          activity_type: result.activity_type || result.name,
          unit: result.unit,
          category: result.category || result.scope,
          scope: result.scope,
          emission_factor: result.emission_factor,
          source: result.source,
          type: 'search',
        }));
        setSuggestions(searchResults);
        setShowSuggestions(true);
      }
    } catch (err) {
      console.error('Search error:', err);
      // Fallback to local search immediately
      performLocalSearch(query);
    } finally {
      setSearchLoading(false);
    }
  };

  const performLocalSearch = (query) => {
    const queryLower = query.toLowerCase();
    const localSuggestions = [];

    // Search in common activities
    Object.entries(commonActivities).forEach(([category, data]) => {
      data.activities?.forEach(activity => {
        if (activity.toLowerCase().includes(queryLower)) {
          localSuggestions.push({
            activity_type: activity,
            unit: data.units?.[0] || getDefaultUnit(activity),
            category: category,
            type: 'common',
          });
        }
      });
    });

    // Search in recent activities
    recentActivities.forEach(activity => {
      if (activity.activity_type?.toLowerCase().includes(queryLower)) {
        localSuggestions.push({
          ...activity,
          type: 'recent',
        });
      }
    });

    setSuggestions(localSuggestions.slice(0, 10));
    setShowSuggestions(localSuggestions.length > 0);
  };

  const handleActivityTypeChange = (e) => {
    const value = e.target.value;
    const defaultUnit = getDefaultUnit(value);
    
    setFormData(prev => ({
      ...prev,
      activity_type: value,
      // Auto-fill unit if empty or if we detect a clear match
      unit: prev.unit || defaultUnit
    }));
    setSearchQuery(value);
    setShowSuggestions(true);
    setSelectedSuggestionIndex(-1);
  };

  const handleSelectSuggestion = (suggestion) => {
    const suggestedUnit = suggestion.unit || getDefaultUnit(suggestion.activity_type);
    
    setFormData({
      ...formData,
      activity_type: suggestion.activity_type,
      unit: suggestedUnit || formData.unit,
    });
    setSearchQuery(suggestion.activity_type);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedSuggestionIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      handleSelectSuggestion(suggestions[selectedSuggestionIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const getCategoryIcon = (category) => {
    const icons = {
      fuels: '🔥',
      energy: '⚡',
      transport: '🚚',
      materials: '📦',
      recent: '🕒',
      search: '🔍',
    };
    return icons[category] || icons[category?.toLowerCase()] || '📊';
  };

  const getCategoryColor = (category) => {
    const colors = {
      fuels: '#ef4444',
      energy: '#3b82f6',
      transport: '#8b5cf6',
      materials: '#10b981',
      recent: '#f59e0b',
      search: '#6366f1',
    };
    return colors[category] || colors[category?.toLowerCase()] || '#6b7280';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate
      if (!formData.activity_type || formData.activity_type.trim() === '') {
        throw new Error('Please enter an activity type');
      }
      if (!formData.unit || formData.unit.trim() === '') {
        throw new Error('Please enter a unit');
      }
      if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
        throw new Error('Please enter a valid quantity');
      }

      // Call API
      const result = await activitiesAPI.createActivity(user.company_id, {
        activity_type: formData.activity_type,
        quantity: parseFloat(formData.quantity),
        unit: formData.unit,
        activity_name: formData.activity_name || `${formData.activity_type} - ${formData.quantity} ${formData.unit}`,
        description: formData.description,
        activity_date: formData.activity_date,
      });

      console.log('✅ Activity created:', result);
      onSuccess(); // Refresh dashboard
      onClose(); // Close modal

    } catch (err) {
      console.error('❌ Error creating activity:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to create activity');
    } finally {
      setLoading(false);
    }
  };

  // Get initial suggestions to show when input is focused but empty
  const getInitialSuggestions = () => {
    const initial = [];
    
    // Add recent activities
    if (recentActivities.length > 0) {
      initial.push({
        type: 'section',
        label: '🕒 Recent Activities',
        items: recentActivities.slice(0, 5).map(a => ({ ...a, type: 'recent' })),
      });
    }

    // Add popular activities from common categories
    Object.entries(commonActivities).forEach(([category, data]) => {
      if (data.activities && data.activities.length > 0) {
        initial.push({
          type: 'section',
          label: `${getCategoryIcon(category)} ${category.charAt(0).toUpperCase() + category.slice(1)}`,
          items: data.activities.slice(0, 3).map(activity => ({
            activity_type: activity,
            unit: data.units?.[0] || getDefaultUnit(activity),
            category: category,
            type: 'common',
          })),
        });
      }
    });

    return initial;
  };

  const initialSuggestions = getInitialSuggestions();

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>➕ Add New Activity</h2>
          <button onClick={onClose} style={styles.closeBtn}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && (
            <div style={styles.error}>
              ❌ {error}
            </div>
          )}

          {/* Activity Type with Autocomplete */}
          <div style={styles.field}>
            <label style={styles.label}>Activity Type *</label>
            <div style={styles.autocompleteWrapper}>
              <input
                ref={inputRef}
                type="text"
                value={formData.activity_type}
                onChange={handleActivityTypeChange}
                onFocus={() => {
                  if (suggestions.length === 0 && searchQuery.length === 0) {
                    setShowSuggestions(true);
                  } else if (suggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="Start typing to search... (e.g., diesel, electricity, flight)"
                style={styles.input}
                required
                autoComplete="off"
              />
              {searchLoading && (
                <span style={styles.searchLoader}>⏳</span>
              )}
              
              {/* Suggestions Dropdown */}
              {showSuggestions && (
                <div ref={suggestionsRef} style={styles.suggestions}>
                  {dataLoading && suggestions.length === 0 && searchQuery.length === 0 ? (
                    <div style={styles.loadingState}>
                      <span>⏳ Loading suggestions...</span>
                    </div>
                  ) : suggestions.length > 0 ? (
                    // Search results
                    suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        onClick={() => handleSelectSuggestion(suggestion)}
                        onMouseEnter={() => setSelectedSuggestionIndex(index)}
                        style={{
                          ...styles.suggestionItem,
                          ...(selectedSuggestionIndex === index ? styles.suggestionItemHover : {}),
                        }}
                      >
                        <span style={styles.suggestionIcon}>
                          {getCategoryIcon(suggestion.category || suggestion.type)}
                        </span>
                        <div style={styles.suggestionContent}>
                          <div style={styles.suggestionName}>{suggestion.activity_type}</div>
                          <div style={styles.suggestionMeta}>
                            {suggestion.unit && `Unit: ${suggestion.unit}`}
                            {suggestion.category && ` • ${suggestion.category}`}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : searchQuery.length === 0 ? (
                    // Initial suggestions (recent + popular)
                    initialSuggestions.length > 0 ? (
                      initialSuggestions.map((section, sectionIndex) => (
                        <div key={sectionIndex}>
                          <div style={styles.suggestionSectionHeader}>{section.label}</div>
                          {section.items.map((item, itemIndex) => {
                            const globalIndex = sectionIndex * 10 + itemIndex;
                            return (
                              <div
                                key={itemIndex}
                                onClick={() => handleSelectSuggestion(item)}
                                onMouseEnter={() => setSelectedSuggestionIndex(globalIndex)}
                                style={{
                                  ...styles.suggestionItem,
                                  ...(selectedSuggestionIndex === globalIndex ? styles.suggestionItemHover : {}),
                                }}
                              >
                                <span style={styles.suggestionIcon}>
                                  {getCategoryIcon(item.category || item.type)}
                                </span>
                                <div style={styles.suggestionContent}>
                                  <div style={styles.suggestionName}>{item.activity_type}</div>
                                  <div style={styles.suggestionMeta}>
                                    {item.unit && `Unit: ${item.unit}`}
                                    {item.activity_name && ` • ${item.activity_name}`}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))
                    ) : (
                      <div style={styles.noSuggestions}>
                        Start typing to search for activities...
                      </div>
                    )
                  ) : (
                    <div style={styles.noSuggestions}>
                      No suggestions found. Try a different search term.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Add Buttons for Common Activities */}
          {formData.activity_type.length === 0 && commonActivities && Object.keys(commonActivities).length > 0 && (
            <div style={styles.quickAddSection}>
              <div style={styles.quickAddLabel}>Quick Add:</div>
              <div style={styles.quickAddButtons}>
                {Object.entries(commonActivities).slice(0, 4).map(([category, data]) => (
                  data.activities?.slice(0, 2).map((activity, idx) => (
                    <button
                      key={`${category}-${idx}`}
                      type="button"
                      onClick={() => handleSelectSuggestion({
                        activity_type: activity,
                        unit: data.units?.[0] || getDefaultUnit(activity),
                        category: category,
                      })}
                      style={{
                        ...styles.quickAddButton,
                        borderColor: getCategoryColor(category),
                      }}
                    >
                      <span style={styles.quickAddIcon}>{getCategoryIcon(category)}</span>
                      {activity}
                    </button>
                  ))
                ))}
              </div>
            </div>
          )}

          {/* Quantity & Unit */}
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>Quantity *</label>
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
              <label style={styles.label}>
                Unit * 
                {formData.unit && (
                  <span style={styles.autoFillBadge}>✓ Auto-filled</span>
                )}
              </label>
              <input
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="e.g., litre, kg, km, kwh"
                style={{
                  ...styles.input,
                  ...(formData.unit && formData.activity_type ? styles.autoFilledInput : {}),
                }}
                required
                list="unit-suggestions"
              />
              <datalist id="unit-suggestions">
                {formData.activity_type && commonActivities[Object.keys(commonActivities).find(cat => 
                  commonActivities[cat].activities?.some(a => 
                    a.toLowerCase() === formData.activity_type.toLowerCase()
                  )
                )]?.units?.map(unit => (
                  <option key={unit} value={unit} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Activity Name */}
          <div style={styles.field}>
            <label style={styles.label}>Activity Name (Optional)</label>
            <input
              type="text"
              value={formData.activity_name}
              onChange={(e) => setFormData({ ...formData, activity_name: e.target.value })}
              placeholder="e.g., Office Generator Fuel"
              style={styles.input}
            />
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
            <label style={styles.label}>Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Additional details..."
              style={styles.textarea}
              rows="3"
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
              {loading ? '⏳ Adding...' : '✅ Add Activity'}
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
    position: 'relative',
  },
  row: {
    display: 'flex',
    gap: '16px',
  },
  label: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '8px',
  },
  autoFillBadge: {
    fontSize: '11px',
    fontWeight: 'normal',
    color: '#10b981',
    background: '#d1fae5',
    padding: '2px 8px',
    borderRadius: '12px',
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
  autoFilledInput: {
    borderColor: '#10b981',
    background: '#f0fdf4',
  },
  autocompleteWrapper: {
    position: 'relative',
  },
  searchLoader: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '18px',
  },
  suggestions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    background: 'white',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    marginTop: '4px',
    maxHeight: '300px',
    overflowY: 'auto',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    zIndex: 1001,
  },
  loadingState: {
    padding: '16px',
    textAlign: 'center',
    color: '#666',
    fontSize: '14px',
  },
  suggestionSectionHeader: {
    padding: '8px 12px',
    fontSize: '12px',
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    background: '#f9fafb',
    borderBottom: '1px solid #eee',
  },
  suggestionItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    cursor: 'pointer',
    borderBottom: '1px solid #f0f0f0',
    transition: 'background 0.2s',
  },
  suggestionItemHover: {
    background: '#f3f4f6',
  },
  suggestionIcon: {
    fontSize: '20px',
    marginRight: '12px',
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionName: {
    fontSize: '15px',
    fontWeight: '500',
    color: '#333',
    marginBottom: '2px',
  },
  suggestionMeta: {
    fontSize: '12px',
    color: '#666',
  },
  noSuggestions: {
    padding: '16px',
    textAlign: 'center',
    color: '#999',
    fontSize: '14px',
  },
  quickAddSection: {
    marginBottom: '20px',
    padding: '16px',
    background: '#f9fafb',
    borderRadius: '8px',
  },
  quickAddLabel: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#666',
    marginBottom: '8px',
    textTransform: 'uppercase',
  },
  quickAddButtons: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  quickAddButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    background: 'white',
    border: '2px solid #e0e0e0',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  quickAddIcon: {
    fontSize: '16px',
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

export default AddActivityModal;