import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Roles.css';

const Roles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true
  });

  const API_URL = 'http://localhost:8000/api';

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get(`${API_URL}/roles`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setRoles(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching roles:', error);
      alert('Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRole = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(`${API_URL}/roles`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        alert('Role created successfully');
        setShowAddModal(false);
        resetForm();
        fetchRoles();
      }
    } catch (error) {
      console.error('Error adding role:', error);
      alert(error.response?.data?.message || 'Failed to add role');
    }
  };

  const handleEditRole = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.put(`${API_URL}/roles/${editingRole.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        alert('Role updated successfully');
        setShowEditModal(false);
        setEditingRole(null);
        resetForm();
        fetchRoles();
      }
    } catch (error) {
      console.error('Error updating role:', error);
      alert(error.response?.data?.message || 'Failed to update role');
    }
  };

  const handleDeleteRole = async (id) => {
    if (!window.confirm('Are you sure you want to delete this role?')) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.delete(`${API_URL}/roles/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        alert('Role deleted successfully');
        fetchRoles();
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      alert(error.response?.data?.message || 'Failed to delete role');
    }
  };

  const openEditModal = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name,
      description: role.description || '',
      is_active: role.is_active
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      is_active: true
    });
  };

  if (loading) {
    return <div className="roles-container"><div className="loading">Loading roles...</div></div>;
  }

  return (
    <div className="roles-container">
      <div className="roles-header">
        <h1>Role Management</h1>
        <button className="btn-add-new" onClick={() => setShowAddModal(true)}>
          Add New Role
        </button>
      </div>

      <div className="roles-grid">
        {roles.length === 0 ? (
          <div className="empty-state">
            <p>No roles found. Create your first role to get started.</p>
          </div>
        ) : (
          roles.map((role) => (
            <div key={role.id} className="role-card">
              <div className="role-card-header">
                <h3>{role.name}</h3>
                <span className={`role-status ${role.is_active ? 'active' : 'inactive'}`}>
                  {role.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="role-description">
                {role.description || 'No description provided'}
              </p>
              <div className="role-card-footer">
                <span className="employee-count">
                  {role.users_count || 0} employee{role.users_count !== 1 ? 's' : ''}
                </span>
                <div className="role-actions">
                  <button 
                    className="btn-role-action edit" 
                    onClick={() => openEditModal(role)}
                    title="Edit"
                  >
                    ✏️ Edit
                  </button>
                  <button 
                    className="btn-role-action delete" 
                    onClick={() => handleDeleteRole(role.id)}
                    title="Delete"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Role Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Role</h2>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddRole}>
              <div className="form-group">
                <label>Role Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Carpenter, Electrician, Site Manager"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="4"
                  placeholder="Describe the responsibilities and requirements for this role..."
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  />
                  <span>Active (role can be assigned to employees)</span>
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Add Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Role</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>×</button>
            </div>
            <form onSubmit={handleEditRole}>
              <div className="form-group">
                <label>Role Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Carpenter, Electrician, Site Manager"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows="4"
                  placeholder="Describe the responsibilities and requirements for this role..."
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  />
                  <span>Active (role can be assigned to employees)</span>
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Update Role
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roles;

