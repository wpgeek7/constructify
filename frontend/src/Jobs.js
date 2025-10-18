import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { GoogleMap, LoadScript, Marker } from '@react-google-maps/api';
import './Jobs.css';

const GOOGLE_MAPS_API_KEY = 'AIzaSyBT_YvAqHvUwSdXnLWLsAMELSxjBvPOdXk'; // Replace with your Google Maps API key

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMapModal, setShowMapModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [formData, setFormData] = useState({
    job_name: '',
    job_description: '',
    client_name: '',
    site_contact: '',
    job_address: '',
    latitude: null,
    longitude: null,
    start_date: '',
    deadline: '',
    status: 'pending',
    employee_ids: []
  });
  const [filter, setFilter] = useState({
    status: '',
    search: ''
  });
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 }); // Default: New York
  const [markerPosition, setMarkerPosition] = useState(null);

  const API_URL = 'http://localhost:8000/api';

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line
  }, [filter]);

  useEffect(() => {
    fetchEmployees(); // Only fetch employees once on mount
    // eslint-disable-next-line
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
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
      alert('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/employees?approval_status=approved`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setEmployees(response.data.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleAddJob = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(`${API_URL}/jobs`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        alert('Job created successfully');
        setShowAddModal(false);
        resetForm();
        fetchJobs();
      }
    } catch (error) {
      console.error('Error adding job:', error);
      alert(error.response?.data?.message || 'Failed to add job');
    }
  };

  const handleEditJob = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.put(`${API_URL}/jobs/${editingJob.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        alert('Job updated successfully');
        setShowEditModal(false);
        setEditingJob(null);
        resetForm();
        fetchJobs();
      }
    } catch (error) {
      console.error('Error updating job:', error);
      alert(error.response?.data?.message || 'Failed to update job');
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job?')) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.delete(`${API_URL}/jobs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        alert('Job deleted successfully');
        fetchJobs();
      }
    } catch (error) {
      console.error('Error deleting job:', error);
      alert('Failed to delete job');
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    
    if (!csvFile) {
      alert('Please select a CSV file');
      return;
    }
    
    try {
      const token = localStorage.getItem('auth_token');
      const formDataObj = new FormData();
      formDataObj.append('file', csvFile);
      
      const response = await axios.post(`${API_URL}/jobs/bulk-upload`, formDataObj, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        let message = `Bulk Upload Complete!\n\n✅ Imported: ${response.data.imported}\n❌ Failed: ${response.data.failed}`;
        
        if (response.data.errors && response.data.errors.length > 0) {
          message += '\n\nErrors:\n' + response.data.errors.slice(0, 5).join('\n');
          if (response.data.errors.length > 5) {
            message += `\n... and ${response.data.errors.length - 5} more errors`;
          }
        }
        
        alert(message);
        setShowBulkUploadModal(false);
        setCsvFile(null);
        fetchJobs();
      }
    } catch (error) {
      console.error('Error uploading CSV:', error);
      alert(error.response?.data?.message || 'Failed to upload CSV file. Please check your file format.');
    }
  };

  const openEditModal = (job) => {
    setEditingJob(job);
    setFormData({
      job_name: job.job_name,
      job_description: job.job_description || '',
      client_name: job.client_name || '',
      site_contact: job.site_contact || '',
      job_address: job.job_address || '',
      latitude: job.latitude,
      longitude: job.longitude,
      start_date: job.start_date || '',
      deadline: job.deadline || '',
      status: job.status,
      employee_ids: job.employees?.map(emp => emp.id) || []
    });
    setShowEditModal(true);
  };

  const openMapModal = () => {
    if (formData.latitude && formData.longitude) {
      setMapCenter({ lat: parseFloat(formData.latitude), lng: parseFloat(formData.longitude) });
      setMarkerPosition({ lat: parseFloat(formData.latitude), lng: parseFloat(formData.longitude) });
    }
    setShowMapModal(true);
  };

  const handleMapClick = (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarkerPosition({ lat, lng });
    setFormData({
      ...formData,
      latitude: lat,
      longitude: lng
    });
  };

  const confirmMapLocation = () => {
    setShowMapModal(false);
  };

  const resetForm = () => {
    setFormData({
      job_name: '',
      job_description: '',
      client_name: '',
      site_contact: '',
      job_address: '',
      latitude: null,
      longitude: null,
      start_date: '',
      deadline: '',
      status: 'pending',
      employee_ids: []
    });
    setMarkerPosition(null);
  };

  const handleEmployeeToggle = (empId) => {
    const currentIds = formData.employee_ids || [];
    if (currentIds.includes(empId)) {
      setFormData({
        ...formData,
        employee_ids: currentIds.filter(id => id !== empId)
      });
    } else {
      setFormData({
        ...formData,
        employee_ids: [...currentIds, empId]
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
    return <div className="jobs-container"><div className="loading">Loading jobs...</div></div>;
  }

  return (
    <div className="jobs-container">
        <div className="jobs-header">
          <h1>Job Management</h1>
          <div className="header-actions">
            <button className="btn-csv-upload" onClick={() => setShowBulkUploadModal(true)}>
              📁 Upload CSV
            </button>
            <button className="btn-add-new" onClick={() => setShowAddModal(true)}>
              Add New
            </button>
          </div>
        </div>

        <div className="jobs-toolbar">
          <div className="search-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="text"
              placeholder="Search Jobs"
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

        <div className="jobs-grid">
          {jobs.length === 0 ? (
            <div className="empty-state">
              <p>No jobs found. Create your first job to get started.</p>
            </div>
          ) : (
            jobs.map((job) => (
              <div key={job.id} className="job-card">
                <div className="job-card-header">
                  <div>
                    <h3>{job.job_name}</h3>
                    <span className="job-id">{job.job_id}</span>
                  </div>
                  <span className={`status-badge ${getStatusBadge(job.status).class}`}>
                    {getStatusBadge(job.status).label}
                  </span>
                </div>
                
                {job.client_name && (
                  <div className="job-info-row">
                    <strong>Client:</strong> {job.client_name}
                  </div>
                )}
                
                {job.job_address && (
                  <div className="job-info-row">
                    <strong>Address:</strong> {job.job_address}
                  </div>
                )}
                
                <div className="job-dates">
                  {job.start_date && (
                    <div className="date-item">
                      <span className="date-label">Start:</span>
                      <span>{new Date(job.start_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {job.deadline && (
                    <div className="date-item">
                      <span className="date-label">Deadline:</span>
                      <span>{new Date(job.deadline).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <div className="job-employees">
                  <strong>Assigned:</strong> {job.employees?.length || 0} employee(s)
                </div>

                <div className="job-actions">
                  <button className="btn-action" onClick={() => openEditModal(job)} title="Edit">
                    ✏️
                  </button>
                  <button className="btn-action" onClick={() => handleDeleteJob(job.id)} title="Delete">
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add/Edit Job Modal */}
        {(showAddModal || showEditModal) && (
          <div className="modal-overlay" onClick={() => {
            setShowAddModal(false);
            setShowEditModal(false);
            resetForm();
          }}>
            <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{showAddModal ? 'Add New Job' : 'Edit Job'}</h2>
                <button className="modal-close" onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}>×</button>
              </div>
              <form onSubmit={showAddModal ? handleAddJob : handleEditJob}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Job Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.job_name}
                      onChange={(e) => setFormData({...formData, job_name: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="on_hold">On Hold</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Job Description</label>
                  <textarea
                    value={formData.job_description}
                    onChange={(e) => setFormData({...formData, job_description: e.target.value})}
                    rows="3"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Client Name</label>
                    <input
                      type="text"
                      value={formData.client_name}
                      onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Site Contact</label>
                    <input
                      type="text"
                      value={formData.site_contact}
                      onChange={(e) => setFormData({...formData, site_contact: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Job Address</label>
                  <div className="address-input-group">
                    <input
                      type="text"
                      value={formData.job_address}
                      onChange={(e) => setFormData({...formData, job_address: e.target.value})}
                      placeholder="Enter job address"
                    />
                    <button type="button" className="btn-map" onClick={openMapModal}>
                      📍 Select on Map
                    </button>
                  </div>
                  {formData.latitude && formData.longitude && (
                    <small className="location-info">
                      Location: {parseFloat(formData.latitude).toFixed(6)}, {parseFloat(formData.longitude).toFixed(6)}
                    </small>
                  )}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label>Deadline</label>
                    <input
                      type="date"
                      value={formData.deadline}
                      onChange={(e) => setFormData({...formData, deadline: e.target.value})}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Assign Employees</label>
                  <div className="employee-selection">
                    {employees.length === 0 ? (
                      <p className="no-employees">No approved employees available</p>
                    ) : (
                      employees.map(emp => (
                        <label key={emp.id} className="employee-checkbox">
                          <input
                            type="checkbox"
                            checked={(formData.employee_ids || []).includes(emp.id)}
                            onChange={() => handleEmployeeToggle(emp.id)}
                          />
                          <span>{emp.fullname} {emp.employee_role?.name && `(${emp.employee_role.name})`}</span>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit">
                    {showAddModal ? 'Create Job' : 'Update Job'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Google Maps Modal */}
        {showMapModal && (
          <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
            <div className="modal-overlay" onClick={() => setShowMapModal(false)}>
              <div className="modal-content map-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h2>Select Job Location</h2>
                  <button className="modal-close" onClick={() => setShowMapModal(false)}>×</button>
                </div>
                <div className="map-container">
                  <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '400px' }}
                    center={mapCenter}
                    zoom={13}
                    onClick={handleMapClick}
                  >
                    {markerPosition && <Marker position={markerPosition} />}
                  </GoogleMap>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => setShowMapModal(false)}>
                    Cancel
                  </button>
                  <button type="button" className="btn-submit" onClick={confirmMapLocation}>
                    Confirm Location
                  </button>
                </div>
              </div>
            </div>
          </LoadScript>
        )}

        {/* Bulk Upload CSV Modal */}
        {showBulkUploadModal && (
          <div className="modal-overlay" onClick={() => setShowBulkUploadModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>📤 Bulk Upload Jobs (CSV)</h2>
                <button className="modal-close" onClick={() => setShowBulkUploadModal(false)}>×</button>
              </div>
              <form onSubmit={handleBulkUpload}>
                <div className="modal-body">
                  <div className="upload-instructions">
                    <h4>CSV Format Instructions:</h4>
                    <p>Your CSV file should include the following columns:</p>
                    <code>job_name, job_description, client_name, site_contact, job_address, latitude, longitude, start_date, deadline, status, employee_ids</code>
                    <ul>
                      <li><strong>job_name</strong>: Required - Name of the job</li>
                      <li><strong>employee_ids</strong>: Optional - Comma-separated employee IDs in quotes (e.g., "1,2,3")</li>
                      <li><strong>status</strong>: Optional - pending, in_progress, completed, on_hold (default: pending)</li>
                      <li><strong>Dates</strong>: Use YYYY-MM-DD format</li>
                    </ul>
                    <p><strong>Example:</strong> Check <code>sample_jobs.csv</code> in project root</p>
                  </div>
                  <div className="form-group">
                    <label htmlFor="csv-file">Select CSV File:</label>
                    <input
                      type="file"
                      id="csv-file"
                      accept=".csv"
                      onChange={(e) => setCsvFile(e.target.files[0])}
                      required
                    />
                    {csvFile && <p className="file-selected">Selected: {csvFile.name}</p>}
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-cancel" onClick={() => {
                    setShowBulkUploadModal(false);
                    setCsvFile(null);
                  }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit">
                    Upload CSV
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
};

export default Jobs;

