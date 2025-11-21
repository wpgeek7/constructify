import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PlanCollaborators.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

function PlanCollaborators({ plan, onClose }) {
  const [activeTab, setActiveTab] = useState('editors');
  const [editors, setEditors] = useState([]);
  const [teams, setTeams] = useState([]);
  const [allTeams, setAllTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddPeople, setShowAddPeople] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedRole, setSelectedRole] = useState('viewer');

  // Fetch collaborators and teams
  useEffect(() => {
    fetchCollaborators();
    fetchTeams();
    fetchAllTeams();
    fetchAvailableUsers();
  }, [plan.id]);

  const fetchCollaborators = async () => {
    try {
      const response = await axios.get(`${API_URL}/plans/${plan.id}/collaborators`);
      if (response.data.success) {
        const { owner, collaborators } = response.data.data;
        
        // Format data for display
        const formattedEditors = [
          {
            id: 'owner',
            user_id: owner.user_id,
            name: owner.name,
            email: owner.email,
            role: 'Owner',
            avatar: owner.name.charAt(0).toUpperCase(),
            color: '#FF8C42',
            lastEdit: getTimeAgo(owner.last_edited)
          },
          ...collaborators.map(collab => ({
            id: collab.id,
            user_id: collab.user_id,
            name: collab.name,
            email: collab.email,
            role: collab.role.charAt(0).toUpperCase() + collab.role.slice(1),
            avatar: collab.name.charAt(0).toUpperCase(),
            color: getRandomColor(),
            lastEdit: collab.last_edited ? getTimeAgo(collab.last_edited) : 'Never'
          }))
        ];
        
        setEditors(formattedEditors);
      }
    } catch (error) {
      console.error('Error fetching collaborators:', error);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await axios.get(`${API_URL}/plans/${plan.id}/teams`);
      if (response.data.success) {
        setTeams(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching plan teams:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllTeams = async () => {
    try {
      const response = await axios.get(`${API_URL}/teams`);
      if (response.data.success) {
        setAllTeams(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching all teams:', error);
    }
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMs = now - past;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    return past.toLocaleDateString();
  };

  const getRandomColor = () => {
    const colors = ['#2196F3', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const fetchAvailableUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/admin/users`);
      if (response.data.success) {
        // Filter out users who are already collaborators
        const existingUserIds = editors.map(e => e.user_id);
        const filtered = response.data.data.filter(user => !existingUserIds.includes(user.id));
        setAvailableUsers(filtered);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleAddCollaborator = async () => {
    if (!selectedUserId) {
      alert('Please select a user');
      return;
    }

    try {
      const response = await axios.post(`${API_URL}/plans/${plan.id}/collaborators`, {
        user_id: selectedUserId,
        role: selectedRole
      });

      if (response.data.success) {
        setShowAddPeople(false);
        setSelectedUserId('');
        setSelectedRole('viewer');
        setSearchQuery('');
        fetchCollaborators(); // Refresh the list
        fetchAvailableUsers(); // Refresh available users
      }
    } catch (error) {
      console.error('Error adding collaborator:', error);
      alert(error.response?.data?.message || 'Failed to add collaborator');
    }
  };

  const handleRoleChange = async (editorId, newRole) => {
    try {
      if (editorId === 'owner') return; // Can't change owner role
      
      await axios.put(`${API_URL}/plans/${plan.id}/collaborators/${editorId}`, {
        role: newRole.toLowerCase()
      });
      
      fetchCollaborators(); // Refresh the list
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const handleAssignTeam = async (teamId) => {
    try {
      await axios.post(`${API_URL}/plans/${plan.id}/teams`, {
        team_id: teamId,
        permission: 'view'
      });
      
      fetchTeams(); // Refresh the teams list
    } catch (error) {
      console.error('Error assigning team:', error);
    }
  };

  return (
    <div className="collaborators-overlay" onClick={onClose}>
      <div className="collaborators-panel" onClick={(e) => e.stopPropagation()}>
        <div className="collaborators-header">
          <h3>Plan Access & Teams</h3>
          <button className="close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <div className="collaborators-tabs">
          <button 
            className={`collab-tab ${activeTab === 'editors' ? 'active' : ''}`}
            onClick={() => setActiveTab('editors')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            People
          </button>
          <button 
            className={`collab-tab ${activeTab === 'teams' ? 'active' : ''}`}
            onClick={() => setActiveTab('teams')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
            </svg>
            Teams
          </button>
        </div>

        <div className="collaborators-content">
          {activeTab === 'editors' && (
            <div className="editors-section">
              <div className="section-header">
                <span className="section-title">People with access</span>
                <button className="add-people-btn" onClick={() => setShowAddPeople(!showAddPeople)}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  Add people
                </button>
              </div>

              {showAddPeople && (
                <div className="add-people-form">
                  <div className="form-row">
                    <input
                      type="text"
                      placeholder="Search by name or email..."
                      className="search-input"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <div className="user-select-list">
                    {availableUsers
                      .filter(user => 
                        searchQuery === '' || 
                        user.fullname?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .slice(0, 5)
                      .map(user => (
                        <div 
                          key={user.id} 
                          className={`user-select-item ${selectedUserId === user.id ? 'selected' : ''}`}
                          onClick={() => setSelectedUserId(user.id)}
                        >
                          <div className="user-select-avatar" style={{ background: getRandomColor() }}>
                            {user.fullname?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div className="user-select-info">
                            <div className="user-select-name">{user.fullname || 'Unknown'}</div>
                            <div className="user-select-email">{user.email}</div>
                          </div>
                          {selectedUserId === user.id && (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </div>
                      ))}
                  </div>

                  <div className="form-row">
                    <label className="form-label">Role</label>
                    <select 
                      className="role-select-form"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                    >
                      <option value="editor">Can edit</option>
                      <option value="viewer">Can view</option>
                    </select>
                  </div>

                  <div className="form-actions">
                    <button 
                      className="btn-cancel" 
                      onClick={() => {
                        setShowAddPeople(false);
                        setSelectedUserId('');
                        setSearchQuery('');
                      }}
                    >
                      Cancel
                    </button>
                    <button 
                      className="btn-add" 
                      onClick={handleAddCollaborator}
                      disabled={!selectedUserId}
                    >
                      Add person
                    </button>
                  </div>
                </div>
              )}

              <div className="editors-list">
                {editors.map(editor => (
                  <div key={editor.id} className="editor-item">
                    <div className="editor-avatar" style={{ background: editor.color }}>
                      {editor.avatar}
                    </div>
                    <div className="editor-info">
                      <div className="editor-name">{editor.name}</div>
                      <div className="editor-email">{editor.email}</div>
                      <div className="editor-activity">{editor.lastEdit}</div>
                    </div>
                    <div className="editor-role">
                      <select 
                        className="role-select" 
                        value={editor.role}
                        onChange={(e) => handleRoleChange(editor.id, e.target.value)}
                        disabled={editor.id === 'owner'}
                      >
                        <option value="Owner">Owner</option>
                        <option value="Editor">Can edit</option>
                        <option value="Viewer">Can view</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'teams' && (
            <div className="teams-section">
              <div className="section-header">
                <span className="section-title">Teams</span>
              </div>

              <div className="teams-list">
                {loading ? (
                  <div className="loading-text">Loading teams...</div>
                ) : allTeams.length === 0 ? (
                  <div className="empty-text">No teams available</div>
                ) : (
                  allTeams.map(team => {
                    const isAssigned = teams.some(t => t.id === team.id);
                    return (
                      <div 
                        key={team.id} 
                        className={`team-item ${isAssigned ? 'active' : ''}`}
                        onClick={() => !isAssigned && handleAssignTeam(team.id)}
                      >
                        {isAssigned && (
                          <svg className="check-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )}
                        <div className="team-avatar">
                          {team.icon || team.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="team-info">
                          <div className="team-name">{team.name}</div>
                          <div className="team-members">{team.members_count} members</div>
                        </div>
                        {team.is_pro && (
                          <span className="team-badge">Pro</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              <button className="create-team-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Create new team
              </button>
            </div>
          )}
        </div>

        <div className="collaborators-footer">
          <div className="file-info">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span>{plan.file_name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlanCollaborators;

