import { useMemo, useState } from 'react';
import DashboardLayout from './DashboardLayout';
import { uploadAPI, bulkAPI } from '../../services/api';
import { useResponsive } from '../../hooks/useResponsive';
import { useTheme } from '../../context/ThemeContext';

const makeJobId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const statusStyles = {
  queued: { label: 'Queued', color: 'rgba(148, 163, 184, 0.2)', text: '#475569' },
  uploading: { label: 'Processing', color: 'rgba(59, 130, 246, 0.15)', text: '#2563eb' },
  success: { label: 'Completed', color: 'rgba(16, 185, 129, 0.15)', text: '#059669' },
  error: { label: 'Failed', color: 'rgba(239, 68, 68, 0.15)', text: '#dc2626' },
};

// File type detection - AI decides which endpoint to use
const isSpreadsheetFile = (file) => {
  const spreadsheetTypes = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'application/vnd.ms-excel', // .xls
    'text/csv', // .csv
  ];
  return spreadsheetTypes.includes(file.type) || 
         /\.(xlsx|xls|csv)$/i.test(file.name);
};

const isDocumentFile = (file) => {
  const documentTypes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
  ];
  return documentTypes.includes(file.type) || 
         /\.(pdf|png|jpg|jpeg)$/i.test(file.name);
};

const ImportHub = ({ user }) => {
  const { isMobile, isTablet } = useResponsive();
  const { colors } = useTheme();
  const companyId = user?.company_id;

  const [allJobs, setAllJobs] = useState([]);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const [expandedJobs, setExpandedJobs] = useState(new Set());

  const summary = useMemo(() => {
    return allJobs.reduce(
      (acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        if (job.status === 'success') {
          if (job.fileType === 'spreadsheet') {
            acc.totalImported += job.result?.summary?.successful || 0;
            acc.totalFailed += job.result?.summary?.failed || 0;
            acc.totalWarnings += job.result?.warnings?.length || 0;
          } else if (job.fileType === 'document') {
            acc.totalActivities += job.result?.activities?.length || 0;
            acc.totalEmissions += parseFloat(job.result?.emissions_summary?.amount || 0);
          }
        }
        return acc;
      },
      { 
        queued: 0, 
        uploading: 0, 
        success: 0, 
        error: 0,
        totalImported: 0,
        totalFailed: 0,
        totalWarnings: 0,
        totalActivities: 0,
        totalEmissions: 0,
      }
    );
  }, [allJobs]);

  const requireCompany = () => {
    if (!companyId) {
      alert('User session missing company. Please login again.');
      return false;
    }
    return true;
  };

  const validateFile = (file, maxSizeMb) => {
    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];

    if (!allowedTypes.includes(file.type) && !isDocumentFile(file) && !isSpreadsheetFile(file)) {
      return `Unsupported file type for ${file.name}. Please upload PDF, Excel, CSV, or Image files.`;
    }
    if (file.size > maxSizeMb * 1024 * 1024) {
      return `${file.name} exceeds ${maxSizeMb}MB limit.`;
    }
    return null;
  };

  const enqueueFiles = (fileList) => {
    if (!requireCompany()) return;
    const files = Array.from(fileList);
    if (files.length === 0) return;

    const jobsToAdd = [];
    files.forEach((file) => {
      const maxSize = isSpreadsheetFile(file) ? 15 : 10;
      const validation = validateFile(file, maxSize);
      if (validation) {
        setError(validation);
        return;
      }

      // AI automatically detects file type
      const fileType = isSpreadsheetFile(file) ? 'spreadsheet' : 'document';

      const id = makeJobId();
      jobsToAdd.push({
        id,
        name: file.name,
        size: file.size,
        type: file.type,
        fileType, // 'spreadsheet' or 'document'
        status: 'queued',
        startedAt: new Date().toISOString(),
        result: null,
        error: null,
      });

      // Process based on detected type
      if (fileType === 'spreadsheet') {
        processSpreadsheetFile(id, file);
      } else {
        processDocumentFile(id, file);
      }
    });

    if (jobsToAdd.length) {
      setAllJobs((prev) => [...jobsToAdd, ...prev]);
      setError('');
    }
  };

  const processDocumentFile = async (jobId, file) => {
    setAllJobs((prev) =>
      prev.map((job) => (job.id === jobId ? { ...job, status: 'uploading', error: null } : job))
    );

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await uploadAPI.uploadDocument(companyId, formData);

      setAllJobs((prev) =>
        prev.map((job) =>
          job.id === jobId
            ? {
                ...job,
                status: 'success',
                completedAt: new Date().toISOString(),
                result: response.data,
              }
            : job
        )
      );
    } catch (error) {
      const message = error?.response?.data?.detail || error.message || 'Upload failed';
      setAllJobs((prev) =>
        prev.map((job) =>
          job.id === jobId
            ? {
                ...job,
                status: 'error',
                completedAt: new Date().toISOString(),
                error: message,
              }
            : job
        )
      );
    }
  };

  const processSpreadsheetFile = async (jobId, file) => {
    setAllJobs((prev) =>
      prev.map((job) => (job.id === jobId ? { ...job, status: 'uploading', error: null } : job))
    );

    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await bulkAPI.bulkImport(companyId, formData);
      const payload = response.data || {};

      setAllJobs((prev) =>
        prev.map((job) =>
          job.id === jobId
            ? {
                ...job,
                status: 'success',
                completedAt: new Date().toISOString(),
                result: {
                  summary: payload.summary || {
                    successful: payload.successful || 0,
                    failed: payload.failed || 0,
                  },
                  warnings: payload.warnings || [],
                  errors: payload.errors || [],
                },
              }
            : job
        )
      );
    } catch (error) {
      const message = error?.response?.data?.detail || error.message || 'Import failed';
      setAllJobs((prev) =>
        prev.map((job) =>
          job.id === jobId
            ? {
                ...job,
                status: 'error',
                completedAt: new Date().toISOString(),
                error: message,
              }
            : job
        )
      );
    }
  };

  const handleInput = (event) => {
    enqueueFiles(event.target.files);
    event.target.value = '';
  };

  const downloadTemplate = async () => {
    if (!requireCompany()) return;
    try {
      setDownloadingTemplate(true);
      const response = await bulkAPI.downloadTemplate(companyId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bulk_import_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Failed to download template. Please try again.');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const renderStatusPill = (status) => {
    const style = statusStyles[status] || statusStyles.queued;
    return (
      <span style={{ ...styles.statusPill, background: style.color, color: style.text }}>
        {style.label}
      </span>
    );
  };

  const renderFileTypeBadge = (fileType) => {
    const badgeStyle = fileType === 'spreadsheet' 
      ? { background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' }
      : { background: 'rgba(16, 185, 129, 0.1)', color: '#059669' };
    
    return (
      <span style={{ ...styles.fileTypeBadge, ...badgeStyle }}>
        {fileType === 'spreadsheet' ? '📊 Spreadsheet' : '📄 Document'}
      </span>
    );
  };

  const toggleJobExpansion = (jobId) => {
    setExpandedJobs(prev => {
      const newSet = new Set(prev);
      if (newSet.has(jobId)) {
        newSet.delete(jobId);
      } else {
        newSet.add(jobId);
      }
      return newSet;
    });
  };

  const formatDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 'N/A';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end - start;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return `${diffSec}s`;
    const diffMin = Math.floor(diffSec / 60);
    const sec = diffSec % 60;
    return `${diffMin}m ${sec}s`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderDetailedInfo = (job) => {
    const isExpanded = expandedJobs.has(job.id);
    const result = job.result;
    const styles = getStyles(colors);
    
    if (job.fileType === 'spreadsheet') {
      return (
        <div style={styles.detailedSection}>
          {/* Summary Metrics */}
          <div style={styles.metricsGrid}>
            <div style={styles.metricCard}>
              <span style={styles.metricIcon}>✅</span>
              <div>
                <span style={styles.metricValue}>
                  {result?.summary?.successful || 0}
                </span>
                <span style={styles.metricLabel}>Rows Imported</span>
              </div>
            </div>
            <div style={styles.metricCard}>
              <span style={styles.metricIcon}>❌</span>
              <div>
                <span style={styles.metricValue}>
                  {result?.summary?.failed || 0}
                </span>
                <span style={styles.metricLabel}>Failed</span>
              </div>
            </div>
            <div style={styles.metricCard}>
              <span style={styles.metricIcon}>📊</span>
              <div>
                <span style={styles.metricValue}>
                  {result?.summary?.total_rows || 0}
                </span>
                <span style={styles.metricLabel}>Total Rows</span>
              </div>
            </div>
            <div style={styles.metricCard}>
              <span style={styles.metricIcon}>🌍</span>
              <div>
                <span style={styles.metricValue}>
                  {result?.summary?.total_emissions_tonnes 
                    ? `${result.summary.total_emissions_tonnes.toFixed(2)} t`
                    : result?.summary?.total_emissions_kg
                    ? `${(result.summary.total_emissions_kg / 1000).toFixed(2)} t`
                    : 'N/A'}
                </span>
                <span style={styles.metricLabel}>Total Emissions</span>
              </div>
            </div>
          </div>

          {/* Processing Info */}
          <div style={styles.infoRow}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>⏱️ Processing Time:</span>
              <span style={styles.infoValue}>
                {formatDuration(job.startedAt, job.completedAt)}
              </span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>📅 Completed:</span>
              <span style={styles.infoValue}>
                {formatDate(job.completedAt)}
              </span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>💾 File Size:</span>
              <span style={styles.infoValue}>
                {(job.size / 1024).toFixed(2)} KB
              </span>
            </div>
            {result?.imported_by && (
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>👤 Imported By:</span>
                <span style={styles.infoValue}>{result.imported_by}</span>
              </div>
            )}
            {result?.company_name && (
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>🏢 Company:</span>
                <span style={styles.infoValue}>{result.company_name}</span>
              </div>
            )}
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>💾 Saved to DB:</span>
              <span style={styles.infoValue}>
                {result?.saved_to_database ? '✅ Yes' : '❌ No'}
              </span>
            </div>
          </div>

          {/* Scope Breakdown */}
          {result?.scope_breakdown && (
            <div style={styles.breakdownSection}>
              <h4 style={styles.breakdownTitle}>📊 Scope Breakdown</h4>
              <div style={styles.breakdownGrid}>
                {Object.entries(result.scope_breakdown).map(([scope, data]) => (
                  <div key={scope} style={styles.breakdownItem}>
                    <span style={styles.breakdownScope}>{scope}</span>
                    <span style={styles.breakdownValue}>
                      {typeof data === 'object' && data.total_kg
                        ? `${(data.total_kg / 1000).toFixed(2)} t CO₂e`
                        : typeof data === 'number'
                        ? `${(data / 1000).toFixed(2)} t CO₂e`
                        : data}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Warnings */}
          {result?.warnings && result.warnings.length > 0 && (
            <div style={styles.warningsSection}>
              <h4 style={styles.warningsTitle}>
                ⚠️ Warnings ({result.warnings.length})
              </h4>
              <div style={styles.warningsList}>
                {result.warnings.slice(0, isExpanded ? result.warnings.length : 3).map((warning, idx) => (
                  <div key={idx} style={styles.warningItem}>
                    {typeof warning === 'string' ? warning : warning.message || JSON.stringify(warning)}
                  </div>
                ))}
                {result.warnings.length > 3 && !isExpanded && (
                  <button
                    onClick={() => toggleJobExpansion(job.id)}
                    style={styles.expandBtn}
                  >
                    Show {result.warnings.length - 3} more...
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Errors */}
          {result?.errors && result.errors.length > 0 && (
            <div style={styles.errorsSection}>
              <h4 style={styles.errorsTitle}>
                ❌ Errors ({result.errors.length})
              </h4>
              <div style={styles.errorsList}>
                {result.errors.slice(0, isExpanded ? result.errors.length : 5).map((error, idx) => (
                  <div key={idx} style={styles.errorItem}>
                    {typeof error === 'string' 
                      ? error 
                      : error.error 
                      ? `Row ${error.row || 'N/A'}: ${error.error}`
                      : JSON.stringify(error)}
                  </div>
                ))}
                {result.errors.length > 5 && !isExpanded && (
                  <button
                    onClick={() => toggleJobExpansion(job.id)}
                    style={styles.expandBtn}
                  >
                    Show {result.errors.length - 5} more...
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activities Preview with Extracted Details */}
          {result?.activities && result.activities.length > 0 && (
            <div style={styles.activitiesSection}>
              <h4 style={styles.activitiesTitle}>
                📋 Activities ({result.activities.length})
              </h4>
              <div style={styles.activitiesList}>
                {result.activities.slice(0, isExpanded ? result.activities.length : 5).map((activity, idx) => {
                  // Extract document-specific details from multiple sources
                  const detailedActivity = result?.technical_details?.activities_detailed?.[idx] || {};
                  const rawData = activity.raw_data || 
                                 detailedActivity.raw_data ||
                                 detailedActivity.data ||
                                 result?.technical_details?.raw_extracted_data || 
                                 {};
                  const docType = result?.document_info?.type_detected?.toLowerCase() || '';
                  
                  // Hotel bill details
                  const hotelName = rawData.hotel_name || rawData.hotelName || detailedActivity.hotel_name;
                  const hotelLocation = rawData.location || rawData.hotel_location || detailedActivity.location;
                  const checkIn = rawData.check_in_date || rawData.checkInDate || detailedActivity.check_in_date;
                  const checkOut = rawData.check_out_date || rawData.checkOutDate || detailedActivity.check_out_date;
                  const nights = rawData.nights || detailedActivity.nights || activity.quantity;
                  
                  // Cab receipt details
                  const serviceProvider = rawData.service_provider || rawData.serviceProvider || detailedActivity.service_provider || activity.description?.match(/Taxi\/Cab - (.+)/)?.[1];
                  const pickupLocation = rawData.pickup_location || rawData.pickupLocation || detailedActivity.pickup_location || activity.from_location;
                  const dropoffLocation = rawData.dropoff_location || rawData.dropoffLocation || detailedActivity.dropoff_location || activity.to_location;
                  const distance = rawData.distance_km || rawData.distanceKm || detailedActivity.distance_km || activity.quantity;
                  const vehicleType = rawData.vehicle_type || rawData.vehicleType || detailedActivity.vehicle_type;
                  
                  // Train ticket details
                  const trainName = rawData.train_name || rawData.trainName || detailedActivity.train_name;
                  const fromStation = rawData.from_station || rawData.fromStation || detailedActivity.from_station || activity.from_location;
                  const toStation = rawData.to_station || rawData.toStation || detailedActivity.to_station || activity.to_location;
                  
                  // Flight ticket details
                  const airline = rawData.airline || rawData.airlineName || detailedActivity.airline;
                  const departure = rawData.departure || rawData.from || detailedActivity.departure || activity.from_location;
                  const arrival = rawData.arrival || rawData.to || detailedActivity.arrival || activity.to_location;
                  
                  // Fuel receipt details
                  const fuelType = rawData.fuel_type || rawData.fuelType || detailedActivity.fuel_type;
                  const pumpName = rawData.pump_name || rawData.pumpName || rawData.vendor_name || detailedActivity.pump_name || detailedActivity.vendor_name;
                  
                  return (
                    <div key={idx} style={styles.activityCard}>
                      <div style={styles.activityHeader}>
                        <div style={styles.activityMainInfo}>
                          <span style={styles.activityType}>
                            {activity.activity_type || activity.category || 'Unknown'}
                          </span>
                          <span style={styles.activityEmissions}>
                            {activity.emissions_kgco2e 
                              ? `${(activity.emissions_kgco2e / 1000).toFixed(3)} t CO₂e`
                              : activity.emissions?.readable || 'N/A'}
                          </span>
                        </div>
                        <span style={styles.activityScope}>
                          {activity.scope || 'N/A'}
                        </span>
                      </div>
                      
                      {/* Extracted Details Section */}
                      <div style={styles.extractedDetails}>
                        {/* Hotel Bill Details */}
                        {hotelName && (
                          <div style={styles.detailRow}>
                            <span style={styles.detailLabel}>🏨 Hotel:</span>
                            <span style={styles.detailValue}>{hotelName}</span>
                            {hotelLocation && (
                              <span style={styles.detailValue}>, {hotelLocation}</span>
                            )}
                          </div>
                        )}
                        {checkIn && (
                          <div style={styles.detailRow}>
                            <span style={styles.detailLabel}>📅 Check-in:</span>
                            <span style={styles.detailValue}>{checkIn}</span>
                            {checkOut && (
                              <>
                                <span style={styles.detailValue}> → {checkOut}</span>
                                {nights && <span style={styles.detailValue}> ({nights} night{nights !== 1 ? 's' : ''})</span>}
                              </>
                            )}
                          </div>
                        )}
                        
                        {/* Cab Receipt Details */}
                        {serviceProvider && (
                          <div style={styles.detailRow}>
                            <span style={styles.detailLabel}>🚕 Service:</span>
                            <span style={styles.detailValue}>{serviceProvider}</span>
                            {vehicleType && (
                              <span style={styles.detailValue}> ({vehicleType})</span>
                            )}
                          </div>
                        )}
                        {pickupLocation && dropoffLocation && (
                          <div style={styles.detailRow}>
                            <span style={styles.detailLabel}>📍 Route:</span>
                            <span style={styles.detailValue}>{pickupLocation} → {dropoffLocation}</span>
                            {distance && (
                              <span style={styles.detailValue}> ({distance} km)</span>
                            )}
                          </div>
                        )}
                        {pickupLocation && !dropoffLocation && (
                          <div style={styles.detailRow}>
                            <span style={styles.detailLabel}>📍 From:</span>
                            <span style={styles.detailValue}>{pickupLocation}</span>
                          </div>
                        )}
                        
                        {/* Train Ticket Details */}
                        {trainName && (
                          <div style={styles.detailRow}>
                            <span style={styles.detailLabel}>🚂 Train:</span>
                            <span style={styles.detailValue}>{trainName}</span>
                          </div>
                        )}
                        {fromStation && toStation && (
                          <div style={styles.detailRow}>
                            <span style={styles.detailLabel}>📍 Route:</span>
                            <span style={styles.detailValue}>{fromStation} → {toStation}</span>
                            {distance && (
                              <span style={styles.detailValue}> ({distance} km)</span>
                            )}
                          </div>
                        )}
                        
                        {/* Flight Ticket Details */}
                        {airline && (
                          <div style={styles.detailRow}>
                            <span style={styles.detailLabel}>✈️ Airline:</span>
                            <span style={styles.detailValue}>{airline}</span>
                          </div>
                        )}
                        {departure && arrival && (
                          <div style={styles.detailRow}>
                            <span style={styles.detailLabel}>📍 Route:</span>
                            <span style={styles.detailValue}>{departure} → {arrival}</span>
                          </div>
                        )}
                        
                        {/* Fuel Receipt Details */}
                        {fuelType && (
                          <div style={styles.detailRow}>
                            <span style={styles.detailLabel}>⛽ Fuel:</span>
                            <span style={styles.detailValue}>{fuelType}</span>
                            {pumpName && (
                              <span style={styles.detailValue}> @ {pumpName}</span>
                            )}
                            {activity.quantity && (
                              <span style={styles.detailValue}> ({activity.quantity} {activity.unit || 'litres'})</span>
                            )}
                          </div>
                        )}
                        
                        {/* Generic details for other document types */}
                        {!hotelName && !serviceProvider && !trainName && !airline && !fuelType && activity.description && (
                          <div style={styles.detailRow}>
                            <span style={styles.detailLabel}>📝 Details:</span>
                            <span style={styles.detailValue}>{activity.description}</span>
                          </div>
                        )}
                        
                        {/* Quantity and Unit */}
                        {activity.quantity && activity.unit && !hotelName && !serviceProvider && (
                          <div style={styles.detailRow}>
                            <span style={styles.detailLabel}>📊 Quantity:</span>
                            <span style={styles.detailValue}>{activity.quantity} {activity.unit}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {result.activities.length > 5 && !isExpanded && (
                  <button
                    onClick={() => toggleJobExpansion(job.id)}
                    style={styles.expandBtn}
                  >
                    Show {result.activities.length - 5} more activities...
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      );
    } else {
      // Document file detailed info
      return (
        <div style={styles.detailedSection}>
          {/* Summary Metrics */}
          <div style={styles.metricsGrid}>
            <div style={styles.metricCard}>
              <span style={styles.metricIcon}>🌍</span>
              <div>
                <span style={styles.metricValue}>
                  {result?.emissions_summary?.readable || 'N/A'}
                </span>
                <span style={styles.metricLabel}>Total Emissions</span>
              </div>
            </div>
            <div style={styles.metricCard}>
              <span style={styles.metricIcon}>📋</span>
              <div>
                <span style={styles.metricValue}>
                  {result?.activities?.length || 0}
                </span>
                <span style={styles.metricLabel}>Activities</span>
              </div>
            </div>
            <div style={styles.metricCard}>
              <span style={styles.metricIcon}>📄</span>
              <div>
                <span style={styles.metricValue}>
                  {result?.document_info?.type_detected || 'Unknown'}
                </span>
                <span style={styles.metricLabel}>Document Type</span>
              </div>
            </div>
            <div style={styles.metricCard}>
              <span style={styles.metricIcon}>⭐</span>
              <div>
                <span style={styles.metricValue}>
                  {result?.data_quality?.overall_score 
                    ? `${(result.data_quality.overall_score * 100).toFixed(0)}%`
                    : 'N/A'}
                </span>
                <span style={styles.metricLabel}>Data Quality</span>
              </div>
            </div>
          </div>

          {/* Processing Info */}
          <div style={styles.infoRow}>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>⏱️ Processing Time:</span>
              <span style={styles.infoValue}>
                {formatDuration(job.startedAt, job.completedAt)}
              </span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>📅 Processed:</span>
              <span style={styles.infoValue}>
                {formatDate(result?.document_info?.processed_at || job.completedAt)}
              </span>
            </div>
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>💾 File Size:</span>
              <span style={styles.infoValue}>
                {result?.document_info?.file_size_kb 
                  ? `${result.document_info.file_size_kb} KB`
                  : `${(job.size / 1024).toFixed(2)} KB`}
              </span>
            </div>
            {result?.document_info?.uploaded_by && (
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>👤 Uploaded By:</span>
                <span style={styles.infoValue}>{result.document_info.uploaded_by}</span>
              </div>
            )}
            {result?.document_info?.company_name && (
              <div style={styles.infoItem}>
                <span style={styles.infoLabel}>🏢 Company:</span>
                <span style={styles.infoValue}>{result.document_info.company_name}</span>
              </div>
            )}
            <div style={styles.infoItem}>
              <span style={styles.infoLabel}>💾 Saved to DB:</span>
              <span style={styles.infoValue}>
                {result?.saved_to_database ? '✅ Yes' : '❌ No'}
              </span>
            </div>
          </div>

          {/* Emissions Equivalent */}
          {result?.emissions_summary?.equivalent_to && (
            <div style={styles.equivalentSection}>
              <h4 style={styles.equivalentTitle}>🌱 Equivalent To:</h4>
              <p style={styles.equivalentText}>
                {result.emissions_summary.equivalent_to}
              </p>
            </div>
          )}

          {/* Scope Breakdown */}
          {result?.scope_breakdown && (
            <div style={styles.breakdownSection}>
              <h4 style={styles.breakdownTitle}>📊 Scope Breakdown</h4>
              <div style={styles.breakdownGrid}>
                {Object.entries(result.scope_breakdown).map(([scope, data]) => (
                  <div key={scope} style={styles.breakdownItem}>
                    <span style={styles.breakdownScope}>{scope}</span>
                    <span style={styles.breakdownValue}>
                      {typeof data === 'object' && data.total_kg
                        ? `${(data.total_kg / 1000).toFixed(2)} t CO₂e`
                        : typeof data === 'number'
                        ? `${(data / 1000).toFixed(2)} t CO₂e`
                        : data}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {result?.recommendations && result.recommendations.length > 0 && (
            <div style={styles.recommendationsSection}>
              <h4 style={styles.recommendationsTitle}>
                💡 AI Recommendations ({result.recommendations.length})
              </h4>
              <div style={styles.recommendationsList}>
                {result.recommendations.slice(0, isExpanded ? result.recommendations.length : 3).map((rec, idx) => (
                  <div key={idx} style={styles.recommendationItem}>
                    {typeof rec === 'string' ? rec : rec.recommendation || rec.message || JSON.stringify(rec)}
                  </div>
                ))}
                {result.recommendations.length > 3 && !isExpanded && (
                  <button
                    onClick={() => toggleJobExpansion(job.id)}
                    style={styles.expandBtn}
                  >
                    Show {result.recommendations.length - 3} more...
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Activities with Extracted Details */}
          {result?.activities && result.activities.length > 0 && (
            <div style={styles.activitiesSection}>
              <h4 style={styles.activitiesTitle}>
                📋 Extracted Activities ({result.activities.length})
              </h4>
              <div style={styles.activitiesList}>
                {result.activities.slice(0, isExpanded ? result.activities.length : 5).map((activity, idx) => {
                  // Extract document-specific details from multiple sources
                  const detailedActivity = result?.technical_details?.activities_detailed?.[idx] || {};
                  const rawData = activity.raw_data || 
                                 detailedActivity.raw_data ||
                                 detailedActivity.data ||
                                 result?.technical_details?.raw_extracted_data || 
                                 {};
                  const docType = result?.document_info?.type_detected?.toLowerCase() || '';
                  
                  // Hotel bill details
                  const hotelName = rawData.hotel_name || rawData.hotelName || detailedActivity.hotel_name;
                  const hotelLocation = rawData.location || rawData.hotel_location || detailedActivity.location;
                  const checkIn = rawData.check_in_date || rawData.checkInDate || detailedActivity.check_in_date;
                  const checkOut = rawData.check_out_date || rawData.checkOutDate || detailedActivity.check_out_date;
                  const nights = rawData.nights || detailedActivity.nights || activity.quantity;
                  
                  // Cab receipt details
                  const serviceProvider = rawData.service_provider || rawData.serviceProvider || detailedActivity.service_provider || activity.description?.match(/Taxi\/Cab - (.+)/)?.[1];
                  const pickupLocation = rawData.pickup_location || rawData.pickupLocation || detailedActivity.pickup_location || activity.from_location;
                  const dropoffLocation = rawData.dropoff_location || rawData.dropoffLocation || detailedActivity.dropoff_location || activity.to_location;
                  const distance = rawData.distance_km || rawData.distanceKm || detailedActivity.distance_km || activity.quantity;
                  const vehicleType = rawData.vehicle_type || rawData.vehicleType || detailedActivity.vehicle_type;
                  
                  // Train ticket details
                  const trainName = rawData.train_name || rawData.trainName || detailedActivity.train_name;
                  const fromStation = rawData.from_station || rawData.fromStation || detailedActivity.from_station || activity.from_location;
                  const toStation = rawData.to_station || rawData.toStation || detailedActivity.to_station || activity.to_location;
                  
                  // Flight ticket details
                  const airline = rawData.airline || rawData.airlineName || detailedActivity.airline;
                  const departure = rawData.departure || rawData.from || detailedActivity.departure || activity.from_location;
                  const arrival = rawData.arrival || rawData.to || detailedActivity.arrival || activity.to_location;
                  
                  // Fuel receipt details
                  const fuelType = rawData.fuel_type || rawData.fuelType || detailedActivity.fuel_type;
                  const pumpName = rawData.pump_name || rawData.pumpName || rawData.vendor_name || detailedActivity.pump_name || detailedActivity.vendor_name;
                  
                  return (
                    <div key={idx} style={styles.activityCard}>
                      <div style={styles.activityHeader}>
                        <div style={styles.activityMainInfo}>
                          <span style={styles.activityType}>
                            {activity.activity_type || activity.category || 'Unknown'}
                          </span>
                          <span style={styles.activityEmissions}>
                            {activity.emissions_kgco2e 
                              ? `${(activity.emissions_kgco2e / 1000).toFixed(3)} t CO₂e`
                              : activity.emissions?.readable || 'N/A'}
                          </span>
                        </div>
                        <span style={styles.activityScope}>
                          {activity.scope || 'N/A'}
                        </span>
                      </div>
                      
                      {/* Extracted Details Section */}
                      <div style={styles.extractedDetails}>
                        {/* Hotel Bill Details */}
                        {hotelName && (
                          <div style={styles.detailRow}>
                            <span style={styles.detailLabel}>🏨 Hotel:</span>
                            <span style={styles.detailValue}>{hotelName}</span>
                            {hotelLocation && (
                              <span style={styles.detailValue}>, {hotelLocation}</span>
                            )}
                          </div>
                        )}
                        {checkIn && (
                          <div style={styles.detailRow}>
                            <span style={styles.detailLabel}>📅 Check-in:</span>
                            <span style={styles.detailValue}>{checkIn}</span>
                            {checkOut && (
                              <>
                                <span style={styles.detailValue}> → {checkOut}</span>
                                {nights && <span style={styles.detailValue}> ({nights} night{nights !== 1 ? 's' : ''})</span>}
                              </>
                            )}
                          </div>
                        )}
                        
                        {/* Cab Receipt Details */}
                        {serviceProvider && (
                          <div style={styles.detailRow}>
                            <span style={styles.detailLabel}>🚕 Service:</span>
                            <span style={styles.detailValue}>{serviceProvider}</span>
                            {vehicleType && (
                              <span style={styles.detailValue}> ({vehicleType})</span>
                            )}
                          </div>
                        )}
                        {pickupLocation && dropoffLocation && (
                          <div style={styles.detailRow}>
                            <span style={styles.detailLabel}>📍 Route:</span>
                            <span style={styles.detailValue}>{pickupLocation} → {dropoffLocation}</span>
                            {distance && (
                              <span style={styles.detailValue}> ({distance} km)</span>
                            )}
                          </div>
                        )}
                        {pickupLocation && !dropoffLocation && (
                          <div style={styles.detailRow}>
                            <span style={styles.detailLabel}>📍 From:</span>
                            <span style={styles.detailValue}>{pickupLocation}</span>
                          </div>
                        )}
                        
                        {/* Train Ticket Details */}
                        {trainName && (
                          <div style={styles.detailRow}>
                            <span style={styles.detailLabel}>🚂 Train:</span>
                            <span style={styles.detailValue}>{trainName}</span>
                          </div>
                        )}
                        {fromStation && toStation && (
                          <div style={styles.detailRow}>
                            <span style={styles.detailLabel}>📍 Route:</span>
                            <span style={styles.detailValue}>{fromStation} → {toStation}</span>
                            {distance && (
                              <span style={styles.detailValue}> ({distance} km)</span>
                            )}
                          </div>
                        )}
                        
                        {/* Flight Ticket Details */}
                        {airline && (
                          <div style={styles.detailRow}>
                            <span style={styles.detailLabel}>✈️ Airline:</span>
                            <span style={styles.detailValue}>{airline}</span>
                          </div>
                        )}
                        {departure && arrival && (
                          <div style={styles.detailRow}>
                            <span style={styles.detailLabel}>📍 Route:</span>
                            <span style={styles.detailValue}>{departure} → {arrival}</span>
                          </div>
                        )}
                        
                        {/* Fuel Receipt Details */}
                        {fuelType && (
                          <div style={styles.detailRow}>
                            <span style={styles.detailLabel}>⛽ Fuel:</span>
                            <span style={styles.detailValue}>{fuelType}</span>
                            {pumpName && (
                              <span style={styles.detailValue}> @ {pumpName}</span>
                            )}
                            {activity.quantity && (
                              <span style={styles.detailValue}> ({activity.quantity} {activity.unit || 'litres'})</span>
                            )}
                          </div>
                        )}
                        
                        {/* Generic details for other document types */}
                        {!hotelName && !serviceProvider && !trainName && !airline && !fuelType && activity.description && (
                          <div style={styles.detailRow}>
                            <span style={styles.detailLabel}>📝 Details:</span>
                            <span style={styles.detailValue}>{activity.description}</span>
                          </div>
                        )}
                        
                        {/* Quantity and Unit */}
                        {activity.quantity && activity.unit && !hotelName && !serviceProvider && (
                          <div style={styles.detailRow}>
                            <span style={styles.detailLabel}>📊 Quantity:</span>
                            <span style={styles.detailValue}>{activity.quantity} {activity.unit}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {result.activities.length > 5 && !isExpanded && (
                  <button
                    onClick={() => toggleJobExpansion(job.id)}
                    style={styles.expandBtn}
                  >
                    Show {result.activities.length - 5} more activities...
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Data Quality */}
          {result?.data_quality && (
            <div style={styles.qualitySection}>
              <h4 style={styles.qualityTitle}>📊 Data Quality Metrics</h4>
              <div style={styles.qualityGrid}>
                {Object.entries(result.data_quality).map(([key, value]) => (
                  <div key={key} style={styles.qualityItem}>
                    <span style={styles.qualityLabel}>
                      {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                    </span>
                    <span style={styles.qualityValue}>
                      {typeof value === 'number' && value < 1 
                        ? `${(value * 100).toFixed(1)}%`
                        : typeof value === 'number'
                        ? value.toFixed(2)
                        : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }
  };

  const styles = getStyles(colors);

  return (
    <DashboardLayout>
      <div style={{
        ...styles.page,
        ...(isMobile ? styles.pageMobile : {}),
      }}>
        <header style={styles.header}>
          <div>
            <p style={styles.kicker}>Unified Import Workspace</p>
            <h1 style={{
              ...styles.title,
              fontSize: isMobile ? '28px' : isTablet ? '32px' : '36px',
            }}>Import Workspace</h1>
            <p style={{
              ...styles.subtitle,
              fontSize: isMobile ? '14px' : '16px',
            }}>
              Drag and drop any file - documents, invoices, receipts, or spreadsheets. 
              Our AI automatically detects the file type and processes it accordingly. 
              Upload single or multiple files simultaneously.
            </p>
          </div>
        </header>

        <section style={styles.mainSection}>
          {error && (
            <div style={styles.errorBox}>
              <span>⚠️ {error}</span>
            </div>
          )}

          <div
            style={{
              ...styles.dropZone,
              ...(dragActive ? styles.dropZoneActive : {}),
              padding: isMobile ? '30px 16px' : '50px 24px',
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragActive(false);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDragActive(false);
              enqueueFiles(e.dataTransfer.files);
            }}
          >
            <div style={styles.dropIcon}>📤</div>
            <h3 style={{
              ...styles.dropTitle,
              fontSize: isMobile ? '18px' : '24px',
            }}>Drop files here or click to browse</h3>
            <p style={{
              ...styles.dropText,
              fontSize: isMobile ? '13px' : '15px',
            }}>
              Supports PDF, Excel (.xlsx, .xls), CSV, PNG, and JPG files
              {!isMobile && (
                <>
                  <br />
                  <span style={styles.dropSubtext}>
                    AI automatically detects file type and routes to the appropriate processor
                  </span>
                </>
              )}
            </p>
            <input
              type="file"
              multiple
              id="file-upload"
              style={styles.hiddenInput}
              onChange={handleInput}
              accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg"
            />
            <label htmlFor="file-upload" style={styles.primaryBtn}>
              Browse Files
            </label>
            <div style={styles.templateSection}>
              <button
                onClick={downloadTemplate}
                style={styles.secondaryBtn}
                disabled={downloadingTemplate}
              >
                {downloadingTemplate ? 'Downloading...' : '📥 Download Spreadsheet Template'}
              </button>
            </div>
          </div>

          {/* Summary Stats Below Drop Zone */}
          <div style={{
            ...styles.summaryRow,
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            marginTop: isMobile ? '20px' : '24px',
          }}>
            <div style={styles.summaryCard}>
              <span style={styles.summaryValue}>{allJobs.length || 0}</span>
              <span style={styles.summaryLabel}>Files queued</span>
            </div>
            <div style={styles.summaryCard}>
              <span style={styles.summaryValue}>{summary.totalImported || 0}</span>
              <span style={styles.summaryLabel}>Rows imported</span>
            </div>
            <div style={styles.summaryCard}>
              <span style={styles.summaryValue}>{summary.totalActivities || 0}</span>
              <span style={styles.summaryLabel}>Activities extracted</span>
            </div>
            <div style={styles.summaryCard}>
              <span style={styles.summaryValue}>
                {summary.uploading || 0}
              </span>
              <span style={styles.summaryLabel}>Processing now</span>
            </div>
          </div>

          <div style={styles.jobsSection}>
            <div style={styles.jobsHeader}>
              <h2 style={styles.jobsTitle}>Processing Queue</h2>
              <p style={styles.jobsSubtitle}>
                {allJobs.length === 0 
                  ? 'No files queued yet. Drop files above to get started.'
                  : `${allJobs.length} file(s) in queue`}
              </p>
            </div>

            <div style={styles.jobsList}>
              {allJobs.length === 0 ? (
                <p style={styles.emptyState}>No files processed yet. Drop a file to get started.</p>
              ) : (
                allJobs.map((job) => (
                  <div key={job.id} style={styles.jobCard}>
                    <div style={styles.jobHeader}>
                      <div style={styles.jobMeta}>
                        <div style={styles.jobNameRow}>
                          <div style={styles.jobName}>{job.name}</div>
                          {renderFileTypeBadge(job.fileType)}
                        </div>
                        <div style={styles.jobDetails}>
                          <span>{(job.size / 1024).toFixed(1)} KB • </span>
                          <span>{job.type || 'unknown type'}</span>
                        </div>
                      </div>
                      {renderStatusPill(job.status)}
                    </div>

                    {job.result && job.status === 'success' && (
                      <div style={styles.jobResult}>
                        {/* Quick Summary */}
                        <div style={styles.quickSummary}>
                          {job.fileType === 'spreadsheet' ? (
                            <>
                              <div style={styles.quickMetric}>
                                <span style={styles.quickLabel}>✅ Imported</span>
                                <span style={styles.quickValue}>
                                  {job.result.summary?.successful || 0}
                                </span>
                              </div>
                              <div style={styles.quickMetric}>
                                <span style={styles.quickLabel}>❌ Failed</span>
                                <span style={styles.quickValue}>
                                  {job.result.summary?.failed || 0}
                                </span>
                              </div>
                              {job.result.summary?.total_emissions_tonnes && (
                                <div style={styles.quickMetric}>
                                  <span style={styles.quickLabel}>🌍 Emissions</span>
                                  <span style={styles.quickValue}>
                                    {job.result.summary.total_emissions_tonnes.toFixed(2)} t
                                  </span>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div style={styles.quickMetric}>
                                <span style={styles.quickLabel}>🌍 Emissions</span>
                                <span style={styles.quickValue}>
                                  {job.result?.emissions_summary?.readable || 'N/A'}
                                </span>
                              </div>
                              <div style={styles.quickMetric}>
                                <span style={styles.quickLabel}>📋 Activities</span>
                                <span style={styles.quickValue}>
                                  {job.result?.activities?.length || 0}
                                </span>
                              </div>
                              {job.result?.document_info?.type_detected && (
                                <div style={styles.quickMetric}>
                                  <span style={styles.quickLabel}>📄 Type</span>
                                  <span style={styles.quickValue}>
                                    {job.result.document_info.type_detected}
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Expand/Collapse Button */}
                        <button
                          onClick={() => toggleJobExpansion(job.id)}
                          style={styles.expandButton}
                        >
                          {expandedJobs.has(job.id) ? '▼ Show Less' : '▶ Show More Details'}
                        </button>

                        {/* Detailed Information */}
                        {expandedJobs.has(job.id) && renderDetailedInfo(job)}
                      </div>
                    )}

                    {job.error && (
                      <div style={styles.jobError}>
                        <span style={styles.errorIcon}>❌</span>
                        {job.error}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </DashboardLayout>
  );
};

const getStyles = (colors) => ({
  page: {
    padding: '32px',
    maxWidth: '1200px',
    margin: '0 auto',
    width: '100%',
  },
  pageMobile: {
    padding: '16px',
  },
  header: {
    marginBottom: '32px',
  },
  kicker: {
    fontSize: '13px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    color: '#0ea5e9',
    fontWeight: '700',
    marginBottom: '6px',
  },
  title: {
    fontSize: '36px',
    fontWeight: '800',
    margin: 0,
    color: colors.text,
  },
  subtitle: {
    fontSize: '16px',
    color: colors.textSecondary,
    maxWidth: '720px',
    marginTop: '8px',
    lineHeight: '1.6',
  },
  summaryRow: {
    display: 'grid',
    gap: '16px',
  },
  summaryCard: {
    minWidth: '140px',
    background: colors.bgSecondary,
    borderRadius: '16px',
    padding: '16px 20px',
    border: `1px solid ${colors.border}`,
  },
  summaryValue: {
    fontSize: '24px',
    fontWeight: '700',
    display: 'block',
    color: colors.text,
  },
  summaryLabel: {
    fontSize: '13px',
    color: colors.textTertiary,
  },
  mainSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  dropZone: {
    border: '2px dashed #cbd5f5',
    borderRadius: '18px',
    padding: '50px 24px',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    background: 'linear-gradient(135deg, rgba(14,165,233,0.05), rgba(59,130,246,0.03))',
  },
  dropZoneActive: {
    borderColor: '#0ea5e9',
    background: 'linear-gradient(135deg, rgba(14,165,233,0.12), rgba(59,130,246,0.08))',
    boxShadow: '0 12px 30px rgba(14,165,233,0.15)',
  },
  dropIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  dropTitle: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
    color: colors.text,
    marginBottom: '8px',
  },
  dropText: {
    fontSize: '15px',
    color: colors.textSecondary,
    marginBottom: '24px',
    lineHeight: '1.6',
  },
  dropSubtext: {
    fontSize: '13px',
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
  templateSection: {
    marginTop: '20px',
  },
  hiddenInput: {
    display: 'none',
  },
  primaryBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px 32px',
    background: 'linear-gradient(135deg, #00A86B, #1E88E5)',
    color: 'white',
    borderRadius: '999px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    border: 'none',
    boxShadow: '0 12px 30px rgba(30,136,229,0.25)',
    transition: 'transform 0.2s',
  },
  secondaryBtn: {
    padding: '10px 20px',
    background: 'transparent',
    border: `1px solid ${colors.border}`,
    borderRadius: '999px',
    color: colors.text,
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  jobsSection: {
    background: colors.surface,
    borderRadius: '20px',
    padding: '28px',
    border: `1px solid ${colors.border}`,
    boxShadow: colors.cardShadow,
  },
  jobsHeader: {
    marginBottom: '20px',
  },
  jobsTitle: {
    fontSize: '22px',
    fontWeight: '700',
    margin: 0,
    color: colors.text,
  },
  jobsSubtitle: {
    fontSize: '14px',
    color: colors.textSecondary,
    marginTop: '6px',
  },
  jobsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxHeight: '500px',
    overflowY: 'auto',
    paddingRight: '4px',
  },
  jobCard: {
    border: `1px solid ${colors.border}`,
    borderRadius: '14px',
    padding: '16px',
    background: colors.bgSecondary,
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  jobHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
  },
  jobMeta: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  jobNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  jobName: {
    fontSize: '15px',
    fontWeight: '600',
    color: colors.text,
  },
  fileTypeBadge: {
    padding: '4px 10px',
    borderRadius: '999px',
    fontSize: '11px',
    fontWeight: '600',
  },
  jobDetails: {
    fontSize: '12px',
    color: colors.textTertiary,
  },
  jobResult: {
    marginTop: '12px',
    padding: '16px',
    background: colors.surface,
    borderRadius: '12px',
    border: `1px solid ${colors.border}`,
  },
  sheetMetrics: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
  },
  documentMetrics: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
  },
  resultMetric: {
    minWidth: '100px',
  },
  jobError: {
    color: colors.error,
    fontSize: '13px',
    background: `rgba(239, 68, 68, 0.1)`,
    borderRadius: '10px',
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  errorIcon: {
    fontSize: '16px',
  },
  statusPill: {
    alignSelf: 'flex-start',
    padding: '4px 12px',
    borderRadius: '999px',
    fontSize: '12px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
  },
  errorBox: {
    background: `rgba(239, 68, 68, 0.1)`,
    border: `1px solid rgba(239, 68, 68, 0.4)`,
    borderRadius: '12px',
    padding: '12px 16px',
    fontSize: '13px',
    color: colors.error,
  },
  emptyState: {
    fontSize: '13px',
    color: colors.textTertiary,
    textAlign: 'center',
    padding: '32px 0',
  },
  // Enhanced detailed info styles
  quickSummary: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    marginBottom: '12px',
  },
  quickMetric: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minWidth: '100px',
  },
  quickLabel: {
    fontSize: '12px',
    color: colors.textSecondary,
    fontWeight: '500',
  },
  quickValue: {
    fontSize: '16px',
    fontWeight: '700',
    color: colors.text,
  },
  expandButton: {
    padding: '8px 16px',
    background: colors.primary,
    color: colors.textInverse,
    border: 'none',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
    marginTop: '8px',
  },
  detailedSection: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: `1px solid ${colors.border}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '12px',
  },
  metricCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: colors.surface,
    borderRadius: '10px',
    border: `1px solid ${colors.border}`,
  },
  metricIcon: {
    fontSize: '24px',
  },
  metricValue: {
    fontSize: '18px',
    fontWeight: '700',
    color: colors.text,
    display: 'block',
  },
  metricLabel: {
    fontSize: '11px',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  infoRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '12px',
    background: colors.surface,
    borderRadius: '10px',
    border: `1px solid ${colors.border}`,
  },
  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '13px',
  },
  infoLabel: {
    color: colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    color: colors.text,
    fontWeight: '600',
  },
  breakdownSection: {
    padding: '12px',
    background: colors.surface,
    borderRadius: '10px',
    border: `1px solid ${colors.border}`,
  },
  breakdownTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: colors.text,
    margin: '0 0 12px 0',
  },
  breakdownGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  breakdownItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px',
    background: colors.bgSecondary,
    borderRadius: '6px',
  },
  breakdownScope: {
    fontSize: '13px',
    fontWeight: '600',
    color: colors.text,
  },
  breakdownValue: {
    fontSize: '13px',
    fontWeight: '600',
    color: colors.primary,
  },
  warningsSection: {
    padding: '12px',
    background: 'rgba(251, 191, 36, 0.1)',
    borderRadius: '10px',
    border: '1px solid rgba(251, 191, 36, 0.3)',
  },
  warningsTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: colors.text,
    margin: '0 0 12px 0',
  },
  warningsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  warningItem: {
    fontSize: '12px',
    color: colors.text,
    padding: '6px 10px',
    background: colors.surface,
    borderRadius: '6px',
  },
  errorsSection: {
    padding: '12px',
    background: 'rgba(239, 68, 68, 0.1)',
    borderRadius: '10px',
    border: '1px solid rgba(239, 68, 68, 0.3)',
  },
  errorsTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: colors.text,
    margin: '0 0 12px 0',
  },
  errorsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  errorItem: {
    fontSize: '12px',
    color: colors.error,
    padding: '6px 10px',
    background: colors.surface,
    borderRadius: '6px',
  },
  activitiesSection: {
    padding: '12px',
    background: colors.surface,
    borderRadius: '10px',
    border: `1px solid ${colors.border}`,
  },
  activitiesTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: colors.text,
    margin: '0 0 12px 0',
  },
  activitiesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  activityItem: {
    padding: '10px',
    background: colors.bgSecondary,
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
  },
  activityHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '6px',
  },
  activityType: {
    fontSize: '13px',
    fontWeight: '600',
    color: colors.text,
  },
  activityEmissions: {
    fontSize: '13px',
    fontWeight: '700',
    color: colors.primary,
  },
  activityDescription: {
    fontSize: '12px',
    color: colors.textSecondary,
    marginBottom: '6px',
  },
  activityMeta: {
    display: 'flex',
    gap: '12px',
    fontSize: '11px',
    color: colors.textTertiary,
  },
  activityScope: {
    fontSize: '11px',
    color: colors.textSecondary,
  },
  activityQuantity: {
    fontSize: '11px',
    color: colors.textSecondary,
  },
  activityCard: {
    padding: '14px',
    background: colors.bgSecondary,
    borderRadius: '10px',
    border: `1px solid ${colors.border}`,
    marginBottom: '10px',
  },
  activityMainInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
  },
  extractedDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    paddingTop: '10px',
    borderTop: `1px solid ${colors.border}`,
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '12px',
    flexWrap: 'wrap',
  },
  detailLabel: {
    fontWeight: '600',
    color: colors.textSecondary,
    minWidth: '80px',
  },
  detailValue: {
    color: colors.text,
    fontWeight: '500',
  },
  recommendationsSection: {
    padding: '12px',
    background: 'rgba(59, 130, 246, 0.1)',
    borderRadius: '10px',
    border: '1px solid rgba(59, 130, 246, 0.3)',
  },
  recommendationsTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: colors.text,
    margin: '0 0 12px 0',
  },
  recommendationsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  recommendationItem: {
    fontSize: '12px',
    color: colors.text,
    padding: '8px 10px',
    background: colors.surface,
    borderRadius: '6px',
    lineHeight: '1.5',
  },
  equivalentSection: {
    padding: '12px',
    background: 'rgba(16, 185, 129, 0.1)',
    borderRadius: '10px',
    border: '1px solid rgba(16, 185, 129, 0.3)',
  },
  equivalentTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: colors.text,
    margin: '0 0 8px 0',
  },
  equivalentText: {
    fontSize: '13px',
    color: colors.text,
    margin: 0,
    lineHeight: '1.5',
  },
  qualitySection: {
    padding: '12px',
    background: colors.surface,
    borderRadius: '10px',
    border: `1px solid ${colors.border}`,
  },
  qualityTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: colors.text,
    margin: '0 0 12px 0',
  },
  qualityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '8px',
  },
  qualityItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '8px',
    background: colors.bgSecondary,
    borderRadius: '6px',
  },
  qualityLabel: {
    fontSize: '11px',
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  qualityValue: {
    fontSize: '13px',
    fontWeight: '600',
    color: colors.text,
  },
  expandBtn: {
    padding: '6px 12px',
    background: colors.primary,
    color: colors.textInverse,
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'all 0.2s',
  },
});

export default ImportHub;