import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Employees.css';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCsvModal, setShowCsvModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [csvFile, setCsvFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    phone: '',
    address: '',
    role_id: '',
    availability_status: 'available',
    password: ''
  });
  const [filter, setFilter] = useState({
    approval_status: '',
    availability_status: '',
    role_id: ''
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    fetchEmployees();
    fetchRoles();
  }, [filter]);

  const fetchEmployees = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const params = new URLSearchParams();
      
      if (filter.approval_status) params.append('approval_status', filter.approval_status);
      if (filter.availability_status) params.append('availability_status', filter.availability_status);
      if (filter.role_id) params.append('role_id', filter.role_id);
      if (searchTerm) params.append('search', searchTerm);

      const response = await axios.get(`${API_URL}/employees?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setEmployees(response.data.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      alert('Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/roles?is_active=1`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setRoles(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
    }
  };

  const handleSearch = () => {
    fetchEmployees();
  };

  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(`${API_URL}/employees`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        alert('Employee added successfully');
        setShowAddModal(false);
        resetForm();
        fetchEmployees();
      }
    } catch (error) {
      console.error('Error adding employee:', error);
      alert(error.response?.data?.message || 'Failed to add employee');
    }
  };

  const handleEditEmployee = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const updateData = { ...formData };
      if (!updateData.password) delete updateData.password;

      const response = await axios.put(`${API_URL}/employees/${editingEmployee.id}`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        alert('Employee updated successfully');
        setShowEditModal(false);
        setEditingEmployee(null);
        resetForm();
        fetchEmployees();
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      alert(error.response?.data?.message || 'Failed to update employee');
    }
  };

  const handleDeleteEmployee = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.delete(`${API_URL}/employees/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        alert('Employee deleted successfully');
        fetchEmployees();
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Failed to delete employee');
    }
  };

  const handleApproveEmployee = async (id, status) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(`${API_URL}/employees/${id}/approve`, 
        { approval_status: status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        alert(`Employee ${status} successfully`);
        fetchEmployees();
      }
    } catch (error) {
      console.error('Error updating approval status:', error);
      alert('Failed to update approval status');
    }
  };

  const openEditModal = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      fullname: employee.fullname,
      email: employee.email,
      phone: employee.phone || '',
      address: employee.address || '',
      role_id: employee.role_id || '',
      availability_status: employee.availability_status,
      password: ''
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      fullname: '',
      email: '',
      phone: '',
      address: '',
      role_id: '',
      availability_status: 'available',
      password: ''
    });
  };

  const handleCsvUpload = async (e) => {
    e.preventDefault();
    
    if (!csvFile) {
      alert('Please select a CSV file');
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const formData = new FormData();
      formData.append('file', csvFile);

      const response = await axios.post(`${API_URL}/employees/bulk-upload`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setUploadResult(response.data.data);
        alert(response.data.message);
        fetchEmployees();
        setCsvFile(null);
      }
    } catch (error) {
      console.error('Error uploading CSV:', error);
      alert(error.response?.data?.message || 'Failed to upload CSV');
    }
  };

  const downloadSampleCsv = () => {
    const headers = ['fullname', 'email', 'phone', 'address', 'role_name'];
    const sampleData = [
      ['John Doe', 'john.doe@example.com', '+1234567890', '123 Main St, City', 'Carpenter'],
      ['Jane Smith', 'jane.smith@example.com', '+0987654321', '456 Oak Ave, Town', 'Electrician'],
    ];
    
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employees_sample.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedEmployees(employees.map(emp => emp.id));
    } else {
      setSelectedEmployees([]);
    }
  };

  const handleSelectEmployee = (id) => {
    if (selectedEmployees.includes(id)) {
      setSelectedEmployees(selectedEmployees.filter(empId => empId !== id));
    } else {
      setSelectedEmployees([...selectedEmployees, id]);
    }
  };

  const filteredEmployees = employees;

  const getStatusBadge = (approval_status) => {
    const statusMap = {
      approved: { label: 'Approved', class: 'active' },
      pending: { label: 'Pending', class: 'inactive' },
      rejected: { label: 'Rejected', class: 'inactive' }
    };
    return statusMap[approval_status] || { label: approval_status, class: '' };
  };

  const getAvailabilityBadge = (availability_status) => {
    const statusMap = {
      available: { label: 'Available', class: 'active' },
      on_job: { label: 'On Job', class: 'inactive' },
      on_leave: { label: 'On Leave', class: 'inactive' },
      unavailable: { label: 'Unavailable', class: 'inactive' }
    };
    return statusMap[availability_status] || { label: availability_status, class: '' };
  };

  if (loading) {
    return <div className="employees-container"><div className="loading">Loading employees...</div></div>;
  }

  return (
    <div className="employees-container">
      <div className="employees-header">
        <h1>Employees</h1>
        <div className="employees-actions">
          <button className="btn-csv-upload" onClick={() => setShowCsvModal(true)}>
            📁 Upload CSV
          </button>
          <button className="btn-add-new" onClick={() => setShowAddModal(true)}>
            Add New
          </button>
        </div>
      </div>

      <div className="employees-toolbar">
        <div className="search-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Search Employees"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <div className="filter-group">
          <select
            value={filter.approval_status}
            onChange={(e) => setFilter({...filter, approval_status: e.target.value})}
            className="filter-select"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={filter.role_id}
            onChange={(e) => setFilter({...filter, role_id: e.target.value})}
            className="filter-select"
          >
            <option value="">All Roles</option>
            {roles.map(role => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="employees-table-wrapper">
        <table className="employees-table">
          <thead>
            <tr>
              <th className="col-checkbox">
                <input
                  type="checkbox"
                  checked={selectedEmployees.length === employees.length && employees.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th className="col-employee">Employee</th>
              <th className="col-job-title">Job Title</th>
              <th className="col-phone">Phone</th>
              <th className="col-status">Approval</th>
              <th className="col-status">Availability</th>
              <th className="col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.length === 0 ? (
              <tr>
                <td colSpan="7" style={{textAlign: 'center', padding: '40px'}}>
                  No employees found
                </td>
              </tr>
            ) : (
              filteredEmployees.map((employee) => (
                <tr key={employee.id}>
                  <td className="col-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedEmployees.includes(employee.id)}
                      onChange={() => handleSelectEmployee(employee.id)}
                    />
                  </td>
                  <td className="col-employee">
                    <div className="employee-info">
                      <div className="employee-avatar">
                        {employee.fullname?.charAt(0).toUpperCase()}
                      </div>
                      <div className="employee-details">
                        <div className="employee-name">{employee.fullname}</div>
                        <div className="employee-username">{employee.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="col-job-title">
                    {employee.employee_role?.name || 'Not Assigned'}
                  </td>
                  <td className="col-phone">{employee.phone || 'N/A'}</td>
                  <td className="col-status">
                    <span className={`status-badge ${getStatusBadge(employee.approval_status).class}`}>
                      <span className="status-dot"></span>
                      {getStatusBadge(employee.approval_status).label}
                    </span>
                  </td>
                  <td className="col-status">
                    <span className={`status-badge ${getAvailabilityBadge(employee.availability_status).class}`}>
                      {getAvailabilityBadge(employee.availability_status).label}
                    </span>
                  </td>
                  <td className="col-actions">
                    <div className="action-buttons">
                      <button className="btn-action" onClick={() => openEditModal(employee)} title="Edit">
                        ✏️
                      </button>
                      <button className="btn-action" onClick={() => handleDeleteEmployee(employee.id)} title="Delete">
                        🗑️
                      </button>
                      {employee.approval_status === 'pending' && (
                        <>
                          <button className="btn-action approve" onClick={() => handleApproveEmployee(employee.id, 'approved')} title="Approve">
                            ✓
                          </button>
                          <button className="btn-action reject" onClick={() => handleApproveEmployee(employee.id, 'rejected')} title="Reject">
                            ✗
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Employee</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddEmployee}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullname}
                  onChange={(e) => setFormData({...formData, fullname: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Password *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  minLength="8"
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={formData.role_id}
                  onChange={(e) => setFormData({...formData, role_id: e.target.value})}
                >
                  <option value="">Select Role</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Availability Status</label>
                <select
                  value={formData.availability_status}
                  onChange={(e) => setFormData({...formData, availability_status: e.target.value})}
                >
                  <option value="available">Available</option>
                  <option value="on_job">On Job</option>
                  <option value="on_leave">On Leave</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Employee Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Employee</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleEditEmployee}>
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullname}
                  onChange={(e) => setFormData({...formData, fullname: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Password (leave blank to keep current)</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  minLength="8"
                />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={formData.role_id}
                  onChange={(e) => setFormData({...formData, role_id: e.target.value})}
                >
                  <option value="">Select Role</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Availability Status</label>
                <select
                  value={formData.availability_status}
                  onChange={(e) => setFormData({...formData, availability_status: e.target.value})}
                >
                  <option value="available">Available</option>
                  <option value="on_job">On Job</option>
                  <option value="on_leave">On Leave</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Update Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Upload Modal */}
      {showCsvModal && (
        <div className="modal-overlay" onClick={() => setShowCsvModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Bulk Upload Employees</h2>
              <button className="modal-close" onClick={() => setShowCsvModal(false)}>×</button>
            </div>
            <form onSubmit={handleCsvUpload}>
              <div className="csv-upload-info">
                <h3>📋 CSV Format Instructions</h3>
                <p>Your CSV file must include the following columns in this order:</p>
                <ul>
                  <li><strong>fullname</strong> - Employee's full name (required)</li>
                  <li><strong>email</strong> - Employee's email address (required)</li>
                  <li><strong>phone</strong> - Phone number (optional)</li>
                  <li><strong>address</strong> - Full address (optional)</li>
                  <li><strong>role_name</strong> - Job role/position (optional, must match existing role)</li>
                </ul>
                <button 
                  type="button" 
                  className="btn-download-sample" 
                  onClick={downloadSampleCsv}
                >
                  📥 Download Sample CSV
                </button>
              </div>

              <div className="form-group">
                <label>Select CSV File *</label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={(e) => setCsvFile(e.target.files[0])}
                  className="file-input"
                />
                {csvFile && (
                  <p className="file-selected">
                    Selected: {csvFile.name} ({(csvFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>

              {uploadResult && (
                <div className="upload-result">
                  <h4>Upload Results:</h4>
                  <p className="result-success">✅ Imported: {uploadResult.imported} employees</p>
                  {uploadResult.failed > 0 && (
                    <>
                      <p className="result-error">❌ Failed: {uploadResult.failed} employees</p>
                      {uploadResult.errors && uploadResult.errors.length > 0 && (
                        <div className="error-list">
                          <strong>Errors:</strong>
                          <ul>
                            {uploadResult.errors.slice(0, 5).map((err, idx) => (
                              <li key={idx}>{err}</li>
                            ))}
                            {uploadResult.errors.length > 5 && (
                              <li>... and {uploadResult.errors.length - 5} more errors</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => {
                  setShowCsvModal(false);
                  setCsvFile(null);
                  setUploadResult(null);
                }}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit" disabled={!csvFile}>
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

export default Employees;
