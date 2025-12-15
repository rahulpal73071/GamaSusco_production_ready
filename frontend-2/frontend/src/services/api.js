import axios from 'axios';

// Use relative URL - Vite proxy will forward to backend
const API_BASE_URL = "/api";

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors (token expiration, etc.)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If token is invalid or expired, remove it
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/v1/auth/register', data),
  registerCompany: (data) => api.post('/v1/auth/register-company', data),
  login: (data) => api.post('/v1/auth/login', new URLSearchParams(data), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  }),
  getCurrentUser: () => api.get('/v1/auth/me'),
};

// Activities APIs
export const activitiesAPI = {
  getActivities: (companyId, params = {}) => api.get(`/companies/${companyId}/activities`, { params }),
  createActivity: (companyId, data) => api.post(`/companies/${companyId}/activities`, data),
  getActivity: (companyId, activityId) => api.get(`/companies/${companyId}/activities/${activityId}`),
  updateActivity: (companyId, activityId, data) => api.put(`/companies/${companyId}/activities/${activityId}`, data),
  deleteActivity: (companyId, activityId) => api.delete(`/companies/${companyId}/activities/${activityId}`),
  getActivitiesFiltered: (companyId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.scope && params.scope.length > 0) params.scope.forEach(s => queryParams.append('scope', s));
    if (params.category && params.category.length > 0) queryParams.append('category', params.category.join(','));
    if (params.activity_type && params.activity_type.length > 0) queryParams.append('activity_type', params.activity_type.join(','));
    return api.get(`/companies/${companyId}/activities?${queryParams.toString()}`);
  },
};

// Dashboard APIs
export const dashboardAPI = {
  getDashboard: (companyId, period = null) => api.get(`/companies/${companyId}/dashboard${period ? `?period=${period}` : ''}`),
  getStats: (companyId) => api.get(`/companies/${companyId}/statistics`),
  getScopeBreakdown: (companyId, period = null) => api.get(`/companies/${companyId}/scope-breakdown${period ? `?period=${period}` : ''}`),
  getTimeline: (companyId, groupBy = 'month') => api.get(`/companies/${companyId}/timeline?group_by=${groupBy}`),
  getTopEmitters: (companyId, limit = 10, scope = null) => api.get(`/companies/${companyId}/top-emitters?limit=${limit}${scope ? `&scope=${scope}` : ''}`),
};

// Analytics APIs - using existing endpoints
export const analyticsAPI = {
  getStats: (companyId) => api.get(`/companies/${companyId}/statistics`),
  getScopeBreakdown: (companyId, period = null) => api.get(`/companies/${companyId}/scope-breakdown${period ? `?period=${period}` : ''}`),
  getTimeline: (companyId, groupBy = 'month') => api.get(`/companies/${companyId}/timeline?group_by=${groupBy}`),
  getTopEmitters: (companyId, limit = 10, scope = null) => api.get(`/companies/${companyId}/top-emitters?limit=${limit}${scope ? `&scope=${scope}` : ''}`),
  getActivitiesFiltered: (companyId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.scope && params.scope.length > 0) {
      queryParams.append('scope', params.scope.join(','));
    }
    if (params.category && params.category.length > 0) {
      queryParams.append('category', params.category.join(','));
    }
    if (params.start_date) queryParams.append('start_date', params.start_date);
    if (params.end_date) queryParams.append('end_date', params.end_date);
    return api.get(`/companies/${companyId}/activities?${queryParams.toString()}`);
  },
};

// Upload APIs
export const uploadAPI = {
  uploadDocument: (companyId, formData, config = {}) => {
    return api.post(`/companies/${companyId}/upload-document`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 240000, // 4 minutes
      ...config
    });
  },
  listUploads: (companyId) => api.get(`/companies/${companyId}/uploads`),
};

// Emissions APIs
export const emissionsAPI = {
  calculate: (data) => api.post('/emissions/calculate', data),
  calculateBatch: (data) => api.post('/emissions/calculate/batch', data),
  searchFactors: (query, limit = 10) => api.get('/emissions/search', {
    params: { query, limit }
  }),
  getStats: () => api.get('/emissions/stats'),
  getActivities: () => api.get('/emissions/activities')
};

// Goals APIs
export const goalsAPI = {
  createGoal: (companyId, data) => api.post(`/companies/${companyId}/goals`, data),
  getProgress: (companyId, params) => api.get(`/companies/${companyId}/goals/progress`, { params }),
  getProjection: (companyId, targetYear) => api.get(`/companies/${companyId}/goals/projection`, {
    params: { target_year: targetYear }
  }),
  getRoadmap: (companyId, params) => api.get(`/companies/${companyId}/goals/roadmap`, { params }),
  getStatus: (companyId, params) => api.get(`/companies/${companyId}/goals/status`, { params }),
};

// Reports APIs - MERGED AND FIXED
export const reportsAPI = {
  // Basic report generation
  generateReport: (config) => api.post('/v1/reports/generate', config),

  // Export functions
  exportCSV: (config) => api.post('/v1/reports/export/csv', config, {
    responseType: 'blob'
  }),
  exportExcel: (config) => api.post('/v1/reports/export/excel', config, {
    responseType: 'blob'
  }),

  // Dashboard and comparison
  getDashboard: () => api.get('/v1/reports/dashboard'),
  getComparison: (year) => api.get(`/v1/reports/comparison/${year}`),

  // NEW: Comprehensive report functions
  generateComprehensivePDF: (config) =>
    api.post('/v1/reports/generate-comprehensive-pdf', config, {
      responseType: 'blob',
      headers: {
        'Accept': 'application/pdf'
      }
    }),

  generateComprehensiveExcel: (config) =>
    api.post('/v1/reports/generate-comprehensive-excel', config, {
      responseType: 'blob',
      headers: {
        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    }),

  generateComprehensiveCSV: (config) =>
    api.post('/v1/reports/generate-comprehensive-csv', config, {
      responseType: 'blob',
      headers: {
        'Accept': 'text/csv'
      }
    }),

  getCompanyProfile: () => api.get('/v1/reports/company-profile'),
};

// Recommendations APIs
export const recommendationsAPI = {
  getRecommendations: (companyId, period = null, maxRecommendations = 5, forceRefresh = false) => {
    const params = { 
      period: period || undefined, 
      max_recommendations: maxRecommendations,
      force_refresh: forceRefresh 
    };
    // Remove undefined values
    Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);
    return api.get(`/v1/recommendations/company/${companyId}`, { params });
  },
  getStoredRecommendations: (companyId, includeInactive = false) => {
    return api.get(`/v1/recommendations/company/${companyId}/stored`, {
      params: { include_inactive: includeInactive }
    });
  },
  getRecommendationById: (recommendationId) => {
    return api.get(`/v1/recommendations/${recommendationId}`);
  },
  getInfo: () => api.get('/v1/recommendations/'),
  getHealth: () => api.get('/v1/recommendations/health'),
  saveRecommendation: (companyId, recommendationId) => {
    return api.post(`/v1/recommendations/${recommendationId}/save`);
  },
  markAsImplemented: (companyId, recommendationId, data = {}) => {
    return api.post(`/v1/recommendations/${recommendationId}/implement`, null, {
      params: {
        implementation_notes: data.implementation_notes,
        implementation_progress: data.implementation_progress || 100
      }
    });
  },
};

// Benchmarks APIs
export const benchmarksAPI = {
  getBenchmarks: () => api.get('/v1/benchmarks/'),
};

// Bulk Import APIs
export const bulkAPI = {
  bulkImport: (companyId, formData, config = {}) => {
    return api.post(`/companies/${companyId}/bulk-import`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 minutes
      ...config
    });
  },
  downloadTemplate: (companyId) => api.get(`/companies/${companyId}/bulk-import/template`, {
    responseType: 'blob'
  }),
};

// Water APIs
export const waterAPI = {
  createWater: (companyId, data) => api.post(`/companies/${companyId}/water`, data),
  listWater: (companyId) => api.get(`/companies/${companyId}/water`),
};

// Waste APIs
export const wasteAPI = {
  createWaste: (companyId, data) => api.post(`/companies/${companyId}/waste`, data),
  listWaste: (companyId) => api.get(`/companies/${companyId}/waste`),
};

// Energy APIs
export const energyAPI = {
  createEnergy: (companyId, data) => api.post(`/companies/${companyId}/energy`, data),
  listEnergy: (companyId) => api.get(`/companies/${companyId}/energy`),
};

// CBAM (Carbon Border Adjustment Mechanism) APIs
export const cbamAPI = {
  // Installations
  getInstallations: (companyId) => api.get(`/companies/${companyId}/cbam/installations`),
  createInstallation: (companyId, data) => api.post(`/companies/${companyId}/cbam/installations`, data),
  getInstallation: (companyId, installationId) => api.get(`/companies/${companyId}/cbam/installations/${installationId}`),
  updateInstallation: (companyId, installationId, data) => api.put(`/companies/${companyId}/cbam/installations/${installationId}`, data),
  deleteInstallation: (companyId, installationId) => api.delete(`/companies/${companyId}/cbam/installations/${installationId}`),
  
  // Emissions
  getEmissions: (companyId, params = {}) => api.get(`/companies/${companyId}/cbam/emissions`, { params }),
  getAggregatedEmissions: (companyId, params = {}) => api.get(`/companies/${companyId}/cbam/emissions/aggregated`, { params }),
  recordEmissions: (companyId, data) => api.post(`/companies/${companyId}/cbam/emissions`, data),
  
  // Quarterly Reports
  generateQuarterlyReport: (companyId, quarter, year) => api.post(`/companies/${companyId}/cbam/reports/generate`, { quarter, year }),
  getQuarterlyReports: (companyId, year = null) => {
    const params = year ? { year } : {};
    return api.get(`/companies/${companyId}/cbam/reports`, { params });
  },
  exportReportXML: (companyId, reportId) => api.get(`/companies/${companyId}/cbam/reports/${reportId}/export`, {
    responseType: 'blob'
  }),
  
  // Goods Lookup
  getGoods: (companyId, params = {}) => api.get(`/companies/${companyId}/cbam/goods`, { params }),
  getGoodsByCode: (companyId, cnCode) => api.get(`/companies/${companyId}/cbam/goods/${cnCode}`),
};

export default api;