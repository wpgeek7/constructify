import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import CircularTimer from './CircularTimer';
import VoiceRecorder from './VoiceRecorder';
import './WorkerDashboard.css';

const WorkerDashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timerState, setTimerState] = useState({});
  const [uploadModal, setUploadModal] = useState({ show: false, jobId: null });
  const [voiceModal, setVoiceModal] = useState({ show: false, jobId: null });
  const [uploadData, setUploadData] = useState({
    file: null,
    file_type: 'image',
    description: ''
  });
  const [locationWatching, setLocationWatching] = useState({});
  const watchIdRef = useRef({});

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    fetchMyJobs();
    
    // Cleanup location watching on unmount
    return () => {
      Object.values(watchIdRef.current).forEach(watchId => {
        if (watchId) navigator.geolocation.clearWatch(watchId);
      });
    };
  }, []);

  const fetchMyJobs = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/my-jobs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setJobs(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
      alert('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
      } else {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          (error) => reject(error),
          { enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 } // Faster, use cached location if available
        );
      }
    });
  };

  const startLocationTracking = (jobId) => {
    if (watchIdRef.current[jobId]) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocationWatching(prev => ({
          ...prev,
          [jobId]: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            timestamp: new Date()
          }
        }));
      },
      (error) => console.error('Location tracking error:', error),
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );

    watchIdRef.current[jobId] = watchId;
  };

  const stopLocationTracking = (jobId) => {
    if (watchIdRef.current[jobId]) {
      navigator.geolocation.clearWatch(watchIdRef.current[jobId]);
      delete watchIdRef.current[jobId];
      setLocationWatching(prev => {
        const updated = { ...prev };
        delete updated[jobId];
        return updated;
      });
    }
  };

  const handleTimerAction = async (jobId, action) => {
    try {
      const token = localStorage.getItem('auth_token');
      let location = null;
      
      // Try to get location, but don't fail if it's not available
      try {
        location = await getCurrentLocation();
      } catch (locError) {
        console.warn('Location not available:', locError);
        // Continue without location - it's optional
      }
      
      const payload = {
        action,
        latitude: location?.latitude || null,
        longitude: location?.longitude || null
      };

      console.log('Sending timer action:', { jobId, action, payload });
      
      const response = await axios.post(
        `${API_URL}/jobs/${jobId}/log-time`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Timer action response:', response.data);

      if (response.data.success) {
        setTimerState(prev => ({
          ...prev,
          [jobId]: action
        }));

        if (action === 'start' || action === 'resume') {
          startLocationTracking(jobId);
          alert(`Timer ${action === 'start' ? 'started' : 'resumed'} successfully!${location ? ' Location tracking enabled.' : ''}`);
        } else if (action === 'stop' || action === 'pause') {
          stopLocationTracking(jobId);
          alert(`Timer ${action === 'stop' ? 'stopped' : 'paused'} successfully!`);
        }
      }
    } catch (error) {
      console.error('Timer action error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to update timer';
      alert(`Error: ${errorMsg}. Please check your connection and try again.`);
    }
  };

  const handleStatusUpdate = async (jobId, newStatus) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${API_URL}/jobs/${jobId}/update-status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert('Job status updated successfully');
        fetchMyJobs();
      }
    } catch (error) {
      console.error('Status update error:', error);
      alert('Failed to update status');
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadData.file) {
      alert('Please select a file');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('file_type', uploadData.file_type);
      formData.append('description', uploadData.description);

      const response = await axios.post(
        `${API_URL}/jobs/${uploadModal.jobId}/upload-file`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        alert('File uploaded successfully!');
        setUploadModal({ show: false, jobId: null });
        setUploadData({ file: null, file_type: 'image', description: '' });
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert(error.response?.data?.message || 'Failed to upload file');
    }
  };

  const handleVoiceUpload = async (jobId, file) => {
    try {
      const token = localStorage.getItem('auth_token');
      const formData = new FormData();
      formData.append('file', file);
      formData.append('file_type', 'audio');
      formData.append('description', 'Voice report recorded via microphone');

      const response = await axios.post(
        `${API_URL}/jobs/${jobId}/upload-file`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        alert('Voice report uploaded successfully! 🎤');
      }
    } catch (error) {
      console.error('Voice upload error:', error);
      alert(error.response?.data?.message || 'Failed to upload voice report');
    }
  };

  const openUploadModal = (jobId) => {
    setUploadModal({ show: true, jobId });
  };

  const getFileTypeFromFile = (file) => {
    if (!file) return 'image';
    
    const type = file.type;
    if (type.startsWith('image/')) return 'image';
    if (type === 'application/pdf') return 'pdf';
    if (type.startsWith('audio/')) return 'audio';
    return 'image';
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fileType = getFileTypeFromFile(file);
      setUploadData({
        ...uploadData,
        file,
        file_type: fileType
      });
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'Pending', class: 'status-pending' },
      in_progress: { label: 'In Progress', class: 'status-in-progress' },
      completed: { label: 'Completed', class: 'status-completed' },
      on_hold: { label: 'On Hold', class: 'status-on-hold' }
    };
    return statusMap[status] || { label: status, class: '' };
  };

  if (loading) {
    return <div className="worker-dashboard"><div className="loading">Loading your jobs...</div></div>;
  }

  return (
    <div className="worker-dashboard">
      <div className="dashboard-header">
        <h1>My Assigned Jobs</h1>
        <div className="job-count">{jobs.length} Job{jobs.length !== 1 ? 's' : ''}</div>
      </div>

      {jobs.length === 0 ? (
        <div className="empty-state">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1">
            <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
          </svg>
          <p>No jobs assigned yet</p>
          <small>You'll see your assigned jobs here once an admin assigns work to you.</small>
        </div>
      ) : (
        <div className="jobs-list">
          {jobs.map((job) => {
            const isTracking = !!locationWatching[job.id];
            
            return (
              <div key={job.id} className="job-item">
                <div className="job-item-header">
                  <div className="job-title-section">
                    <h3>{job.job_name}</h3>
                    <span className="job-id">{job.job_id}</span>
                  </div>
                  <span className={`status-badge ${getStatusBadge(job.status).class}`}>
                    {getStatusBadge(job.status).label}
                  </span>
                </div>

                {job.job_description && (
                  <p className="job-description">{job.job_description}</p>
                )}

                <div className="job-details-grid">
                  {job.client_name && (
                    <div className="detail-item">
                      <strong>Client:</strong> {job.client_name}
                    </div>
                  )}
                  {job.job_address && (
                    <div className="detail-item">
                      <strong>Address:</strong> {job.job_address}
                    </div>
                  )}
                  {job.deadline && (
                    <div className="detail-item">
                      <strong>Deadline:</strong> {new Date(job.deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Circular Timer Component */}
                <CircularTimer
                  jobId={job.id}
                  timerState={timerState[job.id]}
                  onTimerAction={(action) => handleTimerAction(job.id, action)}
                />

                {isTracking && (
                  <div className="tracking-indicator">
                    <span className="tracking-pulse"></span>
                    <span className="tracking-text">
                      📍 Location Tracking Active
                      {locationWatching[job.id] && (
                        <small> - Last update: {locationWatching[job.id].timestamp.toLocaleTimeString()}</small>
                      )}
                    </span>
                  </div>
                )}

                <div className="job-actions-grid">
                  <button
                    className="btn-upload"
                    onClick={() => openUploadModal(job.id)}
                  >
                    📎 Upload Files
                  </button>

                  <button
                    className="btn-voice-record"
                    onClick={() => setVoiceModal({ show: true, jobId: job.id })}
                  >
                    🎤 Record Voice
                  </button>

                  <select
                    className="status-select"
                    value={job.status}
                    onChange={(e) => handleStatusUpdate(job.id, e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="on_hold">On Hold</option>
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* File Upload Modal */}
      {uploadModal.show && (
        <div className="modal-overlay" onClick={() => setUploadModal({ show: false, jobId: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload Job Files</h2>
              <button className="modal-close" onClick={() => setUploadModal({ show: false, jobId: null })}>×</button>
            </div>
            <form onSubmit={handleFileUpload}>
              <div className="upload-instructions">
                <p><strong>Supported file types:</strong></p>
                <ul>
                  <li>📷 <strong>Images:</strong> Progress photos, site images (.jpg, .png, .gif)</li>
                  <li>📄 <strong>PDFs:</strong> Plans, reports, documents (.pdf)</li>
                  <li>🎤 <strong>Audio:</strong> Voice notes (will be converted to text) (.mp3, .wav)</li>
                </ul>
              </div>

              <div className="form-group">
                <label>Select File *</label>
                <input
                  type="file"
                  required
                  accept="image/*,application/pdf,audio/*"
                  onChange={handleFileChange}
                  className="file-input"
                />
                {uploadData.file && (
                  <div className="file-preview">
                    <span className="file-name">📎 {uploadData.file.name}</span>
                    <span className="file-size">
                      ({(uploadData.file.size / 1024).toFixed(2)} KB)
                    </span>
                    <span className="file-type-badge">{uploadData.file_type}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                  placeholder="Add a description or notes about this file..."
                  rows="3"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setUploadModal({ show: false, jobId: null });
                    setUploadData({ file: null, file_type: 'image', description: '' });
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Upload File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Voice Recording Modal */}
      {voiceModal.show && (
        <div className="modal-overlay" onClick={() => setVoiceModal({ show: false, jobId: null })}>
          <div className="modal-content voice-modal" onClick={(e) => e.stopPropagation()}>
            <VoiceRecorder
              onRecordingComplete={(file) => {
                setUploadData({
                  file,
                  file_type: 'audio',
                  description: 'Voice report recorded via microphone'
                });
                setVoiceModal({ show: false, jobId: null });
                // Automatically trigger upload
                handleVoiceUpload(voiceModal.jobId, file);
              }}
              onCancel={() => setVoiceModal({ show: false, jobId: null })}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkerDashboard;

