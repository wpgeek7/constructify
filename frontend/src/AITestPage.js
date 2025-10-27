import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AIAnalysisModal from './AIAnalysisModal';
import './AITestPage.css';

const AITestPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState({});
  const [analysisResults, setAnalysisResults] = useState({});
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [selectedImageSrc, setSelectedImageSrc] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/jobs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const jobsData = response.data.data.data || [];
        // Filter jobs that have uploads
        const jobsWithUploads = jobsData.filter(job => job.uploads && job.uploads.length > 0);
        setJobs(jobsWithUploads);
        
        // Load existing analyses for all uploads
        await loadExistingAnalyses(jobsWithUploads);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      alert('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const loadExistingAnalyses = async (jobsData) => {
    const token = localStorage.getItem('auth_token');
    const results = {};
    
    for (const job of jobsData) {
      for (const upload of job.uploads) {
        if (upload.ai_analyzed) {
          try {
            const response = await axios.get(
              `${API_URL}/uploads/${upload.id}/analysis`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            if (response.data.success) {
              results[upload.id] = response.data.data;
            }
          } catch (error) {
            // Analysis doesn't exist yet
            console.log(`No analysis for upload ${upload.id}`);
          }
        }
      }
    }
    
    setAnalysisResults(results);
  };

  const analyzePhoto = async (uploadId, jobName) => {
    setAnalyzing(prev => ({ ...prev, [uploadId]: true }));
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${API_URL}/uploads/${uploadId}/analyze`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setAnalysisResults(prev => ({
          ...prev,
          [uploadId]: response.data.data
        }));
        alert(`✅ Analysis Complete!\n\nCompliance Score: ${response.data.data.compliance_score}%\nViolations Found: ${response.data.data.violations_count}`);
      }
    } catch (error) {
      console.error('Analysis error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Analysis failed';
      alert(`❌ Error: ${errorMsg}`);
    } finally {
      setAnalyzing(prev => ({ ...prev, [uploadId]: false }));
    }
  };

  const getAnalysis = async (uploadId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(
        `${API_URL}/uploads/${uploadId}/analysis`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setAnalysisResults(prev => ({
          ...prev,
          [uploadId]: response.data.data
        }));
      }
    } catch (error) {
      console.error('Error:', error);
      alert('No analysis found for this upload');
    }
  };

  const openAnalysisModal = (analysis, imageSrc) => {
    setSelectedAnalysis(analysis);
    setSelectedImageSrc(imageSrc);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAnalysis(null);
    setSelectedImageSrc(null);
  };

  const getComplianceColor = (score) => {
    if (score >= 90) return '#10b981'; // green
    if (score >= 70) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  if (loading) {
    return <div className="ai-test-page"><div className="loading">Loading...</div></div>;
  }

  return (
    <div className="ai-test-page">
      <div className="page-header">
        <h1>🤖 AI Photo Analysis - Test Page</h1>
        <p>Test Moondream AI integration by analyzing uploaded construction photos</p>
      </div>

      {jobs.length === 0 ? (
        <div className="empty-state">
          <p>No jobs with uploads found</p>
          <small>Go to Worker Dashboard and upload some construction photos first!</small>
        </div>
      ) : (
        <div className="jobs-grid">
          {jobs.map(job => (
            <div key={job.id} className="job-card">
              <h3>{job.job_name}</h3>
              <p className="job-address">{job.job_address}</p>
              
              <div className="uploads-list">
                <h4>📸 Uploaded Photos ({job.uploads.length})</h4>
                {job.uploads
                  .filter(upload => upload.file_type === 'image' || upload.file_type === 'photo')
                  .map(upload => {
                    const analysis = analysisResults[upload.id];
                    const isAnalyzing = analyzing[upload.id];
                    
                    return (
                      <div key={upload.id} className="upload-item">
                        {/* Image Preview */}
                        <div className="upload-image-preview">
                          <img 
                            src={`${API_URL.replace('/api', '')}/storage/${upload.file_path}`}
                            alt={upload.description || 'Construction site photo'}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="150"%3E%3Crect fill="%23ddd" width="200" height="150"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" fill="%23999" dy=".3em"%3EImage Not Found%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        </div>

                        <div className="upload-info">
                          <strong>Upload ID: {upload.id}</strong>
                          <p>{upload.description || 'No description'}</p>
                          <small>Uploaded: {new Date(upload.created_at).toLocaleString()}</small>
                          {upload.ai_analyzed && <span className="analyzed-badge">✅ Analyzed</span>}
                        </div>

                        <div className="upload-actions">
                          {!isAnalyzing && !analysis && (
                            <button 
                              className="btn-analyze"
                              onClick={() => analyzePhoto(upload.id, job.job_name)}
                            >
                              🤖 Analyze with AI
                            </button>
                          )}

                          {isAnalyzing && (
                            <div className="analyzing-spinner">
                              <div className="spinner"></div>
                              <span>Analyzing...</span>
                            </div>
                          )}

                          {analysis && !isAnalyzing && (
                            <div className="analyzed-section">
                              <div className="analysis-header">
                                <span 
                                  className="compliance-badge"
                                  style={{ backgroundColor: getComplianceColor(analysis.compliance_score) }}
                                >
                                  {analysis.compliance_score}% Compliant
                                </span>
                                <button 
                                  className="btn-reanalyze-small"
                                  onClick={() => analyzePhoto(upload.id, job.job_name)}
                                  title="Re-analyze"
                                >
                                  🔄 Re-analyze
                                </button>
                              </div>
                              <button 
                                className="btn-see-details"
                                onClick={() => openAnalysisModal(analysis, `${API_URL.replace('/api', '')}/storage/${upload.file_path}`)}
                              >
                                📊 See Detailed Analysis
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Analysis Details Modal */}
      {showModal && selectedAnalysis && (
        <AIAnalysisModal 
          analysis={selectedAnalysis}
          imageSrc={selectedImageSrc}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default AITestPage;

