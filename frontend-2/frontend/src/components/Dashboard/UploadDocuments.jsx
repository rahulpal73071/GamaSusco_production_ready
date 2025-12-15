// frontend/src/components/Dashboard/UploadDocuments.jsx
// COMPLETE FIXED VERSION - All emissions display correctly
import { useState } from 'react';
import DashboardLayout from './DashboardLayout';
import { uploadAPI } from '../../services/api';

function UploadDocuments({ user }) {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState('');

  console.log('UploadDocuments user:', user);
  console.log('User company_id:', user?.company_id);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file) => {
    if (!user || !user.company_id) {
      setError('User not properly authenticated. Please log in again.');
      setUploading(false);
      return;
    }

    setError('');
    setUploadResult(null);
    setUploading(true);

    const validTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload PDF, Excel, CSV, or Image files.');
      setUploading(false);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File too large. Maximum size is 10MB.');
      setUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', file);

      console.log('📤 Uploading to:', `/api/companies/${user.company_id}/upload-document`);
      console.log('User company_id:', user.company_id);

      const result = await uploadAPI.uploadDocument(user.company_id, formData);
      console.log('✅ Upload successful:', result);
      console.log('📊 Full response:', JSON.stringify(result.data, null, 2));

      setUploadResult(result.data);

    } catch (err) {
      console.error('❌ Upload error:', err);
      setError(err?.response?.data?.detail || err.message || 'Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const addActivitiesToDashboard = () => {
    alert('✅ Activities will be added to dashboard! (Feature coming soon)');
    setUploadResult(null);
  };

  return (
    <DashboardLayout>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>📤 Upload Documents</h1>
          <p style={styles.subtitle}>
            Upload bills, invoices, and receipts for automatic emission extraction
          </p>
        </div>
      </div>

      <div style={styles.uploadSection}>
        <div
          style={{
            ...styles.dropZone,
            ...(dragActive ? styles.dropZoneActive : {}),
          }}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {uploading ? (
            <div style={styles.uploadingState}>
              <div style={styles.spinner}>⏳</div>
              <p style={styles.uploadingText}>Processing document with AI...</p>
              <p style={styles.uploadingSubtext}>
                Extracting emission data, please wait
              </p>
            </div>
          ) : (
            <>
              <div style={styles.uploadIcon}>📤</div>
              <h3 style={styles.dropZoneTitle}>
                Drag & drop your document here
              </h3>
              <p style={styles.dropZoneText}>
                or click to browse files
              </p>
              <input
                type="file"
                id="file-upload"
                style={styles.fileInput}
                onChange={handleChange}
                accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg"
              />
              <label htmlFor="file-upload" style={styles.browseBtn}>
                Browse Files
              </label>
              <div style={styles.supportedFiles}>
                <p style={styles.supportedTitle}>Supported formats:</p>
                <div style={styles.fileTypes}>
                  <span style={styles.fileType}>📄 PDF</span>
                  <span style={styles.fileType}>📊 Excel</span>
                  <span style={styles.fileType}>📝 CSV</span>
                  <span style={styles.fileType}>🖼️ Images</span>
                </div>
              </div>
            </>
          )}
        </div>

        {error && (
          <div style={styles.errorBox}>
            <span style={styles.errorIcon}>❌</span>
            <span>{error}</span>
          </div>
        )}

        {/* 🔧 COMPLETELY FIXED RESULT SECTION */}
        {uploadResult && (
          <div style={styles.resultSection}>
            <div style={styles.resultHeader}>
              <h3 style={styles.resultTitle}>✅ Extraction Complete!</h3>
              <p style={styles.resultSubtitle}>
                {uploadResult.document_info?.type_detected || 'Document'} processed successfully
              </p>
              {uploadResult.document_info?.type_detected && (
                <div style={styles.documentTypeBadge}>
                  📄 {uploadResult.document_info.type_detected}
                </div>
              )}
            </div>

            {/* 🔧 FIXED: Changed total_emissions to emissions_summary */}
            <div style={styles.summaryCard}>
              <div style={styles.summaryIcon}>📊</div>
              <div style={styles.summaryContent}>
                <div style={styles.summaryValue}>
                  {uploadResult.emissions_summary?.readable || '0 kg CO2e'}
                </div>
                <div style={styles.summaryLabel}>Total Emissions Extracted</div>
              </div>
            </div>

            <div style={styles.activitiesFound}>
              <h4 style={styles.activitiesTitle}>
                Activities Found ({uploadResult.activities?.length || 0})
              </h4>

              <div style={styles.activityList}>
                {uploadResult.activities?.map((activity, index) => {
                  // Extract document-specific details from raw_data or activity fields
                  const rawData = activity.raw_data || {};
                  const docType = uploadResult?.document_info?.type_detected?.toLowerCase() || '';
                  
                  // Hotel bill details
                  const hotelName = rawData.hotel_name || rawData.hotelName;
                  const hotelLocation = rawData.location || rawData.hotel_location;
                  const checkIn = rawData.check_in_date || rawData.checkInDate;
                  const checkOut = rawData.check_out_date || rawData.checkOutDate;
                  const nights = rawData.nights || activity.quantity;
                  
                  // Cab receipt details
                  const serviceProvider = rawData.service_provider || rawData.serviceProvider || activity.description?.match(/Taxi\/Cab - (.+)/)?.[1];
                  const pickupLocation = rawData.pickup_location || rawData.pickupLocation || activity.from_location;
                  const dropoffLocation = rawData.dropoff_location || rawData.dropoffLocation || activity.to_location;
                  const distance = rawData.distance_km || rawData.distanceKm || activity.quantity;
                  const vehicleType = rawData.vehicle_type || rawData.vehicleType;
                  
                  // Train ticket details
                  const trainName = rawData.train_name || rawData.trainName;
                  const fromStation = rawData.from_station || rawData.fromStation || activity.from_location;
                  const toStation = rawData.to_station || rawData.toStation || activity.to_location;
                  
                  // Flight ticket details
                  const airline = rawData.airline || rawData.airlineName;
                  const departure = rawData.departure || rawData.from || activity.from_location;
                  const arrival = rawData.arrival || rawData.to || activity.to_location;
                  
                  // Fuel receipt details
                  const fuelType = rawData.fuel_type || rawData.fuelType;
                  const pumpName = rawData.pump_name || rawData.pumpName || rawData.vendor_name;
                  
                  return (
                    <div key={index} style={styles.activityCard}>
                      <div style={styles.activityHeader}>
                        <div style={styles.activityIcon}>✓</div>
                        <div style={styles.activityInfo}>
                          <div style={styles.activityName}>
                            {activity.activity_type || activity.activity_name || activity.name || 'Activity'}
                          </div>
                          <div style={styles.activityScope}>
                            {activity.scope || 'N/A'}
                          </div>
                        </div>
                        <div style={styles.activityEmissions}>
                          {activity.emissions_kgco2e 
                            ? `${(activity.emissions_kgco2e / 1000).toFixed(3)} t CO₂e`
                            : activity.emissions?.readable ||
                             activity.emissions?.amount ||
                             'Calculating...'}
                        </div>
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
              </div>
            </div>

            <div style={styles.resultActions}>
              <button onClick={() => setUploadResult(null)} style={styles.cancelBtn}>
                Upload Another
              </button>
              <button onClick={addActivitiesToDashboard} style={styles.addBtn}>
                ✅ Add to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>

      <div style={styles.infoSection}>
        <h3 style={styles.infoTitle}>How it works</h3>
        <div style={styles.stepsGrid}>
          <div style={styles.step}>
            <div style={styles.stepNumber}>1</div>
            <h4 style={styles.stepTitle}>Upload Document</h4>
            <p style={styles.stepText}>
              Drag & drop your bill, invoice, or receipt
            </p>
          </div>
          <div style={styles.step}>
            <div style={styles.stepNumber}>2</div>
            <h4 style={styles.stepTitle}>AI Processing</h4>
            <p style={styles.stepText}>
              Our AI extracts emission data automatically
            </p>
          </div>
          <div style={styles.step}>
            <div style={styles.stepNumber}>3</div>
            <h4 style={styles.stepTitle}>Review & Add</h4>
            <p style={styles.stepText}>
              Review extracted activities and add to dashboard
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

const styles = {
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
  uploadSection: {
    marginBottom: '40px',
  },
  dropZone: {
    background: 'white',
    border: '3px dashed #d1d5db',
    borderRadius: '16px',
    padding: '60px 40px',
    textAlign: 'center',
    transition: 'all 0.3s',
    cursor: 'pointer',
  },
  dropZoneActive: {
    borderColor: '#667eea',
    background: '#f0f4ff',
  },
  uploadIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  dropZoneTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '8px',
  },
  dropZoneText: {
    fontSize: '15px',
    color: '#6b7280',
    marginBottom: '24px',
  },
  fileInput: {
    display: 'none',
  },
  browseBtn: {
    display: 'inline-block',
    padding: '12px 32px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    borderRadius: '10px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  supportedFiles: {
    marginTop: '32px',
  },
  supportedTitle: {
    fontSize: '13px',
    color: '#9ca3af',
    marginBottom: '12px',
  },
  fileTypes: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  fileType: {
    padding: '6px 12px',
    background: '#f3f4f6',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: '500',
  },
  uploadingState: {
    padding: '40px',
  },
  spinner: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  uploadingText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '8px',
  },
  uploadingSubtext: {
    fontSize: '14px',
    color: '#6b7280',
  },
  errorBox: {
    marginTop: '20px',
    padding: '16px',
    background: '#fee',
    border: '1px solid #fcc',
    borderRadius: '12px',
    color: '#c33',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  errorIcon: {
    fontSize: '20px',
  },
  resultSection: {
    marginTop: '32px',
    background: 'white',
    borderRadius: '16px',
    padding: '32px',
    border: '1px solid #e5e7eb',
  },
  resultHeader: {
    textAlign: 'center',
    marginBottom: '24px',
  },
  resultTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#059669',
    marginBottom: '8px',
  },
  resultSubtitle: {
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '12px',
  },
  documentTypeBadge: {
    display: 'inline-block',
    padding: '8px 16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: '600',
    marginTop: '8px',
  },
  summaryCard: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '24px',
  },
  summaryIcon: {
    fontSize: '48px',
  },
  summaryContent: {
    flex: 1,
  },
  summaryValue: {
    fontSize: '32px',
    fontWeight: '700',
    color: 'white',
  },
  summaryLabel: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.8)',
    marginTop: '4px',
  },
  activitiesFound: {
    marginBottom: '24px',
  },
  activitiesTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '16px',
  },
  activityList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  activityItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    background: '#f9fafb',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  activityCard: {
    padding: '16px',
    background: '#f9fafb',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
    marginBottom: '12px',
  },
  activityHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  activityIcon: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    background: '#d1fae5',
    color: '#059669',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
    flexShrink: 0,
  },
  activityInfo: {
    flex: 1,
    minWidth: 0,
  },
  activityName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '4px',
  },
  activityScope: {
    fontSize: '11px',
    color: '#6b7280',
    fontWeight: '500',
  },
  activityDetails: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '2px',
  },
  activityEmissions: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#667eea',
    flexShrink: 0,
  },
  extractedDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    paddingTop: '12px',
    borderTop: '1px solid #e5e7eb',
    marginTop: '12px',
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
    color: '#6b7280',
    minWidth: '90px',
  },
  detailValue: {
    color: '#1f2937',
    fontWeight: '500',
  },
  resultActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  },
  cancelBtn: {
    padding: '12px 24px',
    background: '#f3f4f6',
    color: '#6b7280',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  addBtn: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  infoSection: {
    background: 'white',
    borderRadius: '16px',
    padding: '32px',
    border: '1px solid #e5e7eb',
  },
  infoTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '24px',
    textAlign: 'center',
  },
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '24px',
  },
  step: {
    textAlign: 'center',
  },
  stepNumber: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    fontSize: '24px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  stepTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '8px',
  },
  stepText: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.5',
  },
};

export default UploadDocuments;