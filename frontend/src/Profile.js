import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Profile.css';

const Profile = ({ user, onClose, onUpdateUser }) => {
  const [formData, setFormData] = useState({
    fullname: user.fullname || '',
    email: user.email || '',
    phone: '',
    address: '',
    current_password: '',
    new_password: '',
    new_password_confirmation: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.get('http://localhost:8000/api/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      });

      if (response.data.success) {
        const userData = response.data.data.user;
        setProfileData(userData);
        setFormData(prev => ({
          ...prev,
          fullname: userData.fullname || '',
          email: userData.email || '',
          phone: userData.phone || '',
          address: userData.address || ''
        }));
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setSuccess('');

    try {
      const token = localStorage.getItem('auth_token');
      const updateData = {
        fullname: formData.fullname,
        phone: formData.phone,
        address: formData.address
      };

      // Only include password fields if user is changing password
      if (showPasswordSection && formData.new_password) {
        updateData.current_password = formData.current_password;
        updateData.new_password = formData.new_password;
        updateData.new_password_confirmation = formData.new_password_confirmation;
      }

      const response = await axios.put('http://localhost:8000/api/profile/update', updateData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.data.success) {
        setSuccess('Profile updated successfully!');
        
        // Update user data in localStorage
        const updatedUser = response.data.data.user;
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Call the update callback
        if (onUpdateUser) {
          onUpdateUser(updatedUser);
        }

        // Clear password fields
        if (showPasswordSection) {
          setFormData(prev => ({
            ...prev,
            current_password: '',
            new_password: '',
            new_password_confirmation: ''
          }));
          setShowPasswordSection(false);
        }

        // Auto close success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: error.response?.data?.message || 'Failed to update profile' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={(e) => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h2>My Profile</h2>
          <button className="profile-modal-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <div className="profile-modal-body">
          <div className="profile-avatar-section">
            <div className="profile-avatar-large">
              {user.fullname?.charAt(0).toUpperCase()}
            </div>
            <div className="profile-role-badge">
              {user.role === 'admin' ? 'Administrator' : 'Employee'}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="profile-form">
            {success && (
              <div className="profile-success-message">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                {success}
              </div>
            )}

            {errors.general && (
              <div className="profile-error-message">
                {errors.general}
              </div>
            )}

            <div className="profile-form-section">
              <h3>Personal Information</h3>
              
              <div className="profile-form-group">
                <label htmlFor="fullname">Full Name *</label>
                <input
                  type="text"
                  id="fullname"
                  name="fullname"
                  value={formData.fullname}
                  onChange={handleChange}
                  className={errors.fullname ? 'error' : ''}
                  required
                />
                {errors.fullname && (
                  <span className="profile-error-text">{errors.fullname}</span>
                )}
              </div>

              <div className="profile-form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="disabled"
                />
                <small className="profile-help-text">Email cannot be changed</small>
              </div>

              <div className="profile-form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(555) 123-4567"
                  className={errors.phone ? 'error' : ''}
                />
                {errors.phone && (
                  <span className="profile-error-text">{errors.phone}</span>
                )}
              </div>

              <div className="profile-form-group">
                <label htmlFor="address">Address</label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your address"
                  rows="3"
                  className={errors.address ? 'error' : ''}
                />
                {errors.address && (
                  <span className="profile-error-text">{errors.address}</span>
                )}
              </div>
            </div>

            <div className="profile-form-section">
              <div className="profile-section-header">
                <h3>Change Password</h3>
                <button
                  type="button"
                  className="profile-toggle-btn"
                  onClick={() => setShowPasswordSection(!showPasswordSection)}
                >
                  {showPasswordSection ? 'Cancel' : 'Change Password'}
                </button>
              </div>

              {showPasswordSection && (
                <div className="profile-password-section">
                  <div className="profile-form-group">
                    <label htmlFor="current_password">Current Password *</label>
                    <input
                      type="password"
                      id="current_password"
                      name="current_password"
                      value={formData.current_password}
                      onChange={handleChange}
                      className={errors.current_password ? 'error' : ''}
                      placeholder="Enter current password"
                    />
                    {errors.current_password && (
                      <span className="profile-error-text">{errors.current_password}</span>
                    )}
                  </div>

                  <div className="profile-form-group">
                    <label htmlFor="new_password">New Password *</label>
                    <input
                      type="password"
                      id="new_password"
                      name="new_password"
                      value={formData.new_password}
                      onChange={handleChange}
                      className={errors.new_password ? 'error' : ''}
                      placeholder="Enter new password"
                    />
                    {errors.new_password && (
                      <span className="profile-error-text">{errors.new_password}</span>
                    )}
                  </div>

                  <div className="profile-form-group">
                    <label htmlFor="new_password_confirmation">Confirm New Password *</label>
                    <input
                      type="password"
                      id="new_password_confirmation"
                      name="new_password_confirmation"
                      value={formData.new_password_confirmation}
                      onChange={handleChange}
                      className={errors.new_password_confirmation ? 'error' : ''}
                      placeholder="Confirm new password"
                    />
                    {errors.new_password_confirmation && (
                      <span className="profile-error-text">{errors.new_password_confirmation}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="profile-form-actions">
              <button type="button" className="profile-cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="profile-save-btn" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;

