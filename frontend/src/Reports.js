import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Reports.css';

const Reports = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [jobDetails, setJobDetails] = useState(null);
  const [filter, setFilter] = useState({
    status: '',
    search: ''
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line
  }, [filter]);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      
      if (filter.status) params.append('status', filter.status);
      if (filter.search) params.append('search', filter.search);

      const response = await axios.get(`${API_URL}/jobs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setJobs(response.data.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobDetails = async (jobId) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/jobs/${jobId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setJobDetails(response.data.data);
        setSelectedJob(jobId);
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      alert('Failed to fetch job details');
    }
  };

  const handleDownload = async (uploadId, fileName) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/uploads/${uploadId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob' // Important for file downloads
      });
      
      // Create a blob URL and trigger download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Please try again or contact support.');
    }
  };

  const calculateDuration = (startDate, deadline) => {
    if (!startDate || !deadline) return 'N/A';
    const start = new Date(startDate);
    const end = new Date(deadline);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return `${days} days`;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      in_progress: '#3b82f6',
      completed: '#10b981',
      on_hold: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(2)} MB`;
    const kb = bytes / 1024;
    return `${kb.toFixed(2)} KB`;
  };

  if (loading) {
    return <div className="reports-container"><div className="loading">Loading reports...</div></div>;
  }

  return (
    <div className="reports-container">
      <div className="reports-header">
        <h1>📊 Job Reports & History</h1>
        <p>Complete overview of all jobs with time tracking and documents</p>
      </div>

      <div className="reports-toolbar">
        <div className="search-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search by job name, ID, or client..."
            value={filter.search}
            onChange={(e) => setFilter({...filter, search: e.target.value})}
          />
        </div>
        <select
          value={filter.status}
          onChange={(e) => setFilter({...filter, status: e.target.value})}
          className="filter-select"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="on_hold">On Hold</option>
        </select>
      </div>

      <div className="reports-table-container">
        <table className="reports-table">
          <thead>
            <tr>
              <th>Job ID</th>
              <th>Job Name</th>
              <th>Status</th>
              <th>Start Date</th>
              <th>Deadline</th>
              <th>Duration</th>
              <th>Employees</th>
              <th>Time Spent</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 ? (
              <tr>
                <td colSpan="9" className="no-data">
                  No jobs found. Create jobs to see reports here.
                </td>
              </tr>
            ) : (
              jobs.map(job => (
                <tr key={job.id}>
                  <td className="job-id-cell">{job.job_id}</td>
                  <td className="job-name-cell">
                    <strong>{job.job_name}</strong>
                    {job.client_name && (
                      <small>Client: {job.client_name}</small>
                    )}
                  </td>
                  <td>
                    <span 
                      className="status-dot" 
                      style={{backgroundColor: getStatusColor(job.status)}}
                    ></span>
                    {job.status.replace('_', ' ')}
                  </td>
                  <td>{job.start_date ? new Date(job.start_date).toLocaleDateString() : 'Not set'}</td>
                  <td>{job.deadline ? new Date(job.deadline).toLocaleDateString() : 'Not set'}</td>
                  <td>{calculateDuration(job.start_date, job.deadline)}</td>
                  <td>
                    <span className="employee-count">
                      👥 {job.employees?.length || 0}
                    </span>
                  </td>
                  <td className="time-spent-cell">
                    {job.total_time ? `${job.total_time} hrs` : '0 hrs'}
                  </td>
                  <td>
                    <button 
                      className="btn-details"
                      onClick={() => fetchJobDetails(job.id)}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Job Details Modal */}
      {selectedJob && jobDetails && (
        <div className="modal-overlay" onClick={() => {
          setSelectedJob(null);
          setJobDetails(null);
        }}>
          <div className="modal-content large-modal details-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>{jobDetails.job_name}</h2>
                <span className="job-id-badge">{jobDetails.job_id}</span>
              </div>
              <button className="modal-close" onClick={() => {
                setSelectedJob(null);
                setJobDetails(null);
              }}>×</button>
            </div>

            <div className="details-content">
              {/* Job Info Section */}
              <div className="details-section">
                <h3>📋 Job Information</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Status</label>
                    <span 
                      className="status-badge-large"
                      style={{backgroundColor: getStatusColor(jobDetails.status)}}
                    >
                      {jobDetails.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Client</label>
                    <span>{jobDetails.client_name || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <label>Start Date</label>
                    <span>{jobDetails.start_date ? new Date(jobDetails.start_date).toLocaleDateString() : 'Not set'}</span>
                  </div>
                  <div className="info-item">
                    <label>Deadline</label>
                    <span>{jobDetails.deadline ? new Date(jobDetails.deadline).toLocaleDateString() : 'Not set'}</span>
                  </div>
                  <div className="info-item">
                    <label>Total Time Spent</label>
                    <span className="time-highlight">{jobDetails.total_time ? `${jobDetails.total_time} hours` : '0 hours'}</span>
                  </div>
                  <div className="info-item">
                    <label>Address</label>
                    <span>{jobDetails.job_address || 'No address provided'}</span>
                  </div>
                </div>
                {jobDetails.job_description && (
                  <div className="description-box">
                    <strong>Description:</strong>
                    <p>{jobDetails.job_description}</p>
                  </div>
                )}
              </div>

              {/* Assigned Employees Section */}
              <div className="details-section">
                <h3>👷 Assigned Employees ({jobDetails.employees?.length || 0})</h3>
                {jobDetails.employees && jobDetails.employees.length > 0 ? (
                  <div className="employees-grid">
                    {jobDetails.employees.map(emp => (
                      <div key={emp.id} className="employee-card">
                        <div className="emp-avatar">{emp.fullname?.charAt(0).toUpperCase()}</div>
                        <div className="emp-info">
                          <strong>{emp.fullname}</strong>
                          <small>{emp.employee_role?.name || 'Employee'}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">No employees assigned yet</p>
                )}
              </div>

              {/* Time Tracking by Employee Section */}
              <div className="details-section">
                <h3>⏱️ Time Tracking by Employee</h3>
                {jobDetails.time_per_employee && jobDetails.time_per_employee.length > 0 ? (
                  <div className="time-per-employee">
                    <div className="time-summary-grid">
                      {jobDetails.time_per_employee.map(emp => (
                        <div key={emp.employee_id} className="employee-time-card">
                          <div className="emp-time-avatar">
                            {emp.employee_name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="emp-time-info">
                            <strong>{emp.employee_name}</strong>
                            <small>{emp.employee_role}</small>
                          </div>
                          <div className="emp-time-spent">
                            <div className="time-value">{emp.formatted_time}</div>
                            <small className="time-label">Time Spent</small>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="time-total-summary">
                      <div className="total-time-box">
                        <span className="total-label">Total Time Spent:</span>
                        <span className="total-value">{jobDetails.total_time ? `${jobDetails.total_time} hours` : '0 hours'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="no-data">No time tracked yet</p>
                )}
              </div>

              {/* Uploaded Documents Section */}
              <div className="details-section">
                <h3>📎 Documents & Reports ({jobDetails.uploads?.length || 0})</h3>
                {jobDetails.uploads && jobDetails.uploads.length > 0 ? (
                  <div className="uploads-list">
                    {jobDetails.uploads.map(upload => (
                      <div key={upload.id} className="upload-item">
                        <div className="upload-icon">
                          {upload.file_type === 'image' && '🖼️'}
                          {upload.file_type === 'pdf' && '📄'}
                          {upload.file_type === 'audio' && '🎤'}
                        </div>
                        <div className="upload-info">
                          <strong>{upload.file_name}</strong>
                          <div className="upload-meta">
                            <span>Uploaded by: {upload.user?.fullname}</span>
                            <span>•</span>
                            <span>{new Date(upload.created_at).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{formatFileSize(upload.file_size)}</span>
                          </div>
                          {upload.description && (
                            <p className="upload-description">{upload.description}</p>
                          )}
                          {upload.transcription && (
                            <div className="transcription-box">
                              <strong>🎤 Transcription:</strong>
                              <p>{upload.transcription}</p>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => handleDownload(upload.id, upload.file_name)}
                          className="btn-download"
                        >
                          ⬇️ Download
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">No documents uploaded yet</p>
                )}
              </div>

              {/* Time Logs Section */}
              <div className="details-section">
                <h3>⏱️ Time Tracking History ({jobDetails.time_logs?.length || 0})</h3>
                {jobDetails.time_logs && jobDetails.time_logs.length > 0 ? (
                  <div className="timeline">
                    {jobDetails.time_logs.map((log, index) => (
                      <div key={index} className="timeline-item">
                        <div className="timeline-marker"></div>
                        <div className="timeline-content">
                          <strong>{log.user?.fullname}</strong> 
                          <span className={`action-badge ${log.action}`}>{log.action.toUpperCase()}</span>
                          <span className="timeline-time">
                            {new Date(log.action_time).toLocaleString()}
                          </span>
                          {log.latitude && log.longitude && (
                            <div className="location-info">
                              <span className="location-icon">📍</span>
                              <span className="location-text">
                                Location: {parseFloat(log.latitude).toFixed(6)}, {parseFloat(log.longitude).toFixed(6)}
                              </span>
                              <a 
                                href={`https://www.google.com/maps?q=${log.latitude},${log.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="view-map-link"
                              >
                                View on Map
                              </a>
                            </div>
                          )}
                          {log.notes && <p className="timeline-notes">{log.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-data">No time logs recorded yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
