import { useState } from 'react';
import { bulkAPI } from '../../services/api';
import DashboardLayout from './DashboardLayout';

function Bulk({ user }) {
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [aggregatedResults, setAggregatedResults] = useState(null);

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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (files) => {
    if (!user || !user.company_id) {
      setError('User not properly authenticated. Please log in again.');
      return;
    }

    setError('');
    setUploadResult(null);
    setAggregatedResults(null);
    setUploading(true);
    setTotalFiles(files.length);
    setCurrentFileIndex(0);

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ];

    // Filter valid files
    const validFiles = files.filter(file => {
      if (!validTypes.includes(file.type)) {
        setError(`Invalid file type for ${file.name}. Please upload Excel (.xlsx) or CSV files only.`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(`File ${file.name} too large. Maximum size is 10MB.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) {
      setUploading(false);
      return;
    }

    const aggregated = {
      summary: { successful: 0, failed: 0 },
      warnings: [],
      errors: []
    };

    for (let i = 0; i < validFiles.length; i++) {
      setCurrentFileIndex(i + 1);

      try {
        const formData = new FormData();
        formData.append('file', validFiles[i]);

        console.log(`📤 Bulk importing file ${i + 1}/${validFiles.length}:`, validFiles[i].name);
        console.log('User company_id:', user.company_id);

        const result = await bulkAPI.bulkImport(user.company_id, formData);
        console.log(`✅ Bulk import successful for ${validFiles[i].name}:`, result);

        // Aggregate results
        if (result.data.summary) {
          aggregated.summary.successful += result.data.summary.successful || 0;
          aggregated.summary.failed += result.data.summary.failed || 0;
        } else {
          aggregated.summary.successful += result.data.successful || 0;
          aggregated.summary.failed += result.data.failed || 0;
        }

        if (result.data.warnings) {
          aggregated.warnings.push(...result.data.warnings.map(w => `${validFiles[i].name}: ${w}`));
        }

        if (result.data.errors) {
          aggregated.errors.push(...result.data.errors.map(e => `${validFiles[i].name}: ${e}`));
        }

      } catch (err) {
        console.error(`❌ Bulk import error for ${validFiles[i].name}:`, err);
        aggregated.summary.failed += 1;
        aggregated.errors.push(`${validFiles[i].name}: ${err?.response?.data?.detail || err.message || 'Failed to import file'}`);
      }
    }

    setAggregatedResults(aggregated);
    setUploading(false);
  };

  const downloadTemplate = async () => {
    try {
      const response = await bulkAPI.downloadTemplate();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'bulk_import_template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading template:', error);
      setError('Failed to download template');
    }
  };

  return (
    <DashboardLayout>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>📊 Bulk Import</h1>
            <p style={styles.subtitle}>
              Import multiple emission activities from Excel or CSV files
            </p>
          </div>
        </div>

        {error && (
          <div style={styles.errorBox}>
            ❌ {error}
          </div>
        )}

        {/* Template Download */}
        <div style={styles.templateSection}>
          <div style={styles.templateCard}>
            <div style={styles.templateHeader}>
              <h3 style={styles.templateTitle}>📋 Download Template</h3>
              <p style={styles.templateText}>
                Get started with our pre-formatted Excel template
              </p>
            </div>
            <button onClick={downloadTemplate} style={styles.downloadBtn}>
              📥 Download Template
            </button>
          </div>
        </div>

        {/* Upload Section */}
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
                <p style={styles.uploadingText}>Processing bulk import...</p>
                <p style={styles.uploadingSubtext}>
                  Processing file {currentFileIndex} of {totalFiles}, please wait
                </p>
              </div>
            ) : (
              <>
                <div style={styles.uploadIcon}>📤</div>
                <h3 style={styles.dropZoneTitle}>
                  Drag & drop your file here
                </h3>
                <p style={styles.dropZoneText}>
                  or click to browse files
                </p>
                <input
                  type="file"
                  id="bulk-upload"
                  style={styles.fileInput}
                  onChange={handleChange}
                  accept=".xlsx,.xls,.csv"
                />
                <label htmlFor="bulk-upload" style={styles.browseBtn}>
                  Browse Files
                </label>
                <div style={styles.supportedFiles}>
                  <p style={styles.supportedTitle}>Supported formats:</p>
                  <div style={styles.fileTypes}>
                    <span style={styles.fileType}>📊 Excel (.xlsx)</span>
                    <span style={styles.fileType}>📊 Excel (.xls)</span>
                    <span style={styles.fileType}>📝 CSV</span>
                  </div>
                </div>
              </>
            )}
          </div>

          {aggregatedResults && (
            <div style={styles.resultSection}>
              <div style={styles.resultHeader}>
                <h3 style={styles.resultTitle}>✅ Import Complete!</h3>
                <p style={styles.resultSubtitle}>
                  Successfully processed {totalFiles} file(s)
                </p>
              </div>

              <div style={styles.summaryGrid}>
                <div style={styles.summaryCard}>
                  <div style={styles.summaryIcon}>✅</div>
                  <div style={styles.summaryContent}>
                    <div style={styles.summaryValue}>
                      {aggregatedResults.summary.successful}
                    </div>
                    <div style={styles.summaryLabel}>Activities Imported</div>
                  </div>
                </div>

                <div style={styles.summaryCard}>
                  <div style={styles.summaryIcon}>❌</div>
                  <div style={styles.summaryContent}>
                    <div style={styles.summaryValue}>
                      {aggregatedResults.summary.failed}
                    </div>
                    <div style={styles.summaryLabel}>Failed Imports</div>
                  </div>
                </div>

                <div style={styles.summaryCard}>
                  <div style={styles.summaryIcon}>⚠️</div>
                  <div style={styles.summaryContent}>
                    <div style={styles.summaryValue}>
                      {aggregatedResults.warnings.length}
                    </div>
                    <div style={styles.summaryLabel}>Warnings</div>
                  </div>
                </div>
              </div>

              {aggregatedResults.errors && aggregatedResults.errors.length > 0 && (
                <div style={styles.errorsSection}>
                  <h4 style={styles.errorsTitle}>Import Errors</h4>
                  <div style={styles.errorsList}>
                    {aggregatedResults.errors.map((error, index) => (
                      <div key={index} style={styles.errorItem}>
                        <span style={styles.errorIcon}>❌</span>
                        <span>{error}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div style={styles.resultActions}>
                <button onClick={() => { setAggregatedResults(null); setUploadResult(null); }} style={styles.uploadAnotherBtn}>
                  Upload More Files
                </button>
                <button onClick={() => window.location.href = '/dashboard'} style={styles.viewDashboardBtn}>
                  View Dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div style={styles.instructionsSection}>
          <h3 style={styles.instructionsTitle}>📋 How to Use Bulk Import</h3>
          <div style={styles.stepsGrid}>
            <div style={styles.step}>
              <div style={styles.stepNumber}>1</div>
              <h4 style={styles.stepTitle}>Download Template</h4>
              <p style={styles.stepText}>
                Get the Excel template with proper column headers and formatting
              </p>
            </div>
            <div style={styles.step}>
              <div style={styles.stepNumber}>2</div>
              <h4 style={styles.stepTitle}>Fill Your Data</h4>
              <p style={styles.stepText}>
                Add your emission activities following the template format
              </p>
            </div>
            <div style={styles.step}>
              <div style={styles.stepNumber}>3</div>
              <h4 style={styles.stepTitle}>Upload & Validate</h4>
              <p style={styles.stepText}>
                Upload your file and review any validation errors or warnings
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

const styles = {
  content: {
    padding: '32px',
    maxWidth: '1000px',
    margin: '0 auto',
  },
  header: {
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
  errorBox: {
    padding: '16px',
    background: '#fee',
    border: '1px solid #fcc',
    borderRadius: '12px',
    color: '#c33',
    fontSize: '14px',
    marginBottom: '20px',
  },
  templateSection: {
    marginBottom: '32px',
  },
  templateCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    border: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateHeader: {
    flex: 1,
  },
  templateTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '4px',
  },
  templateText: {
    fontSize: '14px',
    color: '#6b7280',
  },
  downloadBtn: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
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
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '20px',
    marginBottom: '24px',
  },
  summaryCard: {
    background: '#f9fafb',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    border: '1px solid #e5e7eb',
  },
  summaryIcon: {
    fontSize: '32px',
  },
  summaryContent: {
    flex: 1,
  },
  summaryValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937',
  },
  summaryLabel: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px',
  },
  errorsSection: {
    marginBottom: '24px',
  },
  errorsTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '12px',
  },
  errorsList: {
    background: '#fafafa',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #e5e7eb',
  },
  errorItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '8px',
    fontSize: '14px',
    color: '#dc2626',
  },
  errorIcon: {
    fontSize: '16px',
  },
  resultActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  uploadAnotherBtn: {
    padding: '12px 24px',
    background: '#f3f4f6',
    color: '#6b7280',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  viewDashboardBtn: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  instructionsSection: {
    background: 'white',
    borderRadius: '16px',
    padding: '32px',
    border: '1px solid #e5e7eb',
  },
  instructionsTitle: {
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

export default Bulk;
