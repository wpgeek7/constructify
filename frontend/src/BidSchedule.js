import React, { useState, useEffect, useRef } from 'react';
import { ModuleIcons } from './components/ModuleIcons';
import './BidSchedule.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

function BidSchedule({ user: propsUser, onShowProfile, onTabChange, onLogout }) {
  const [user, setUser] = useState({});
  const [userRole, setUserRole] = useState('');
  const [showModuleMenu, setShowModuleMenu] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBid, setSelectedBid] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'calendar', 'kanban'
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'due-soon', 'awarded', 'in-progress', 'missed'
  
  const moduleMenuRef = useRef(null);
  const userDropdownRef = useRef(null);

  // Fetch user data
  useEffect(() => {
    const userData = propsUser || JSON.parse(localStorage.getItem('user') || '{}');
    const role = userData.role || '';
    setUser(userData);
    setUserRole(role);
  }, [propsUser]);

  // Handle clicks outside dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moduleMenuRef.current && !moduleMenuRef.current.contains(event.target)) {
        setShowModuleMenu(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const modules = [
    { name: 'Insights', iconKey: 'Insights', route: null },
    { name: 'Dashcam', iconKey: 'Dashcam', route: null },
    { name: 'Sales', iconKey: 'Sales', route: null },
    { name: 'Proposal...', iconKey: 'Proposal', route: null },
    { name: 'Finance', iconKey: 'Finance', route: null },
    { name: 'Employees', iconKey: 'Manpower', route: 'employees' },
    { name: 'Jobs', iconKey: 'Project', route: 'jobs' },
    { name: 'Plans', iconKey: 'Plans', route: 'plans' },
    { name: 'Bid Schedule', iconKey: 'Calendar', route: 'bid-schedule' },
    { name: 'Pricing', iconKey: 'Finance', route: 'pricing-sheet' },
    { name: 'Field', iconKey: 'Field', route: null },
    { name: 'Procurement', iconKey: 'Procurement', route: null },
    { name: 'Files', iconKey: 'Files', route: null },
    { name: 'Fabrication', iconKey: 'Fabrication', route: null },
    { name: 'Reports', iconKey: 'Insights', route: 'reports' },
    { name: 'Chat', iconKey: 'Chat', route: null },
    { name: 'AI Test', iconKey: 'Spark', route: 'ai-test' },
  ];

  const handleModuleClick = (module) => {
    if (module.route && onTabChange) {
      onTabChange(module.route);
      setShowModuleMenu(false);
    }
  };

  // Sample bid data
  const bids = [
    {
      id: 1,
      projectName: 'Disney World Epcot',
      estimator: 'David',
      bidDate: '11/08/2025',
      projectId: 'PRJ-2025-001',
      proposalTotal: 261050,
      status: 'sent',
      awarded: 'pending',
      contractor: 'Jones Sign',
      source: 'BuildingConnected',
      state: 'FL',
      city: 'Orlando',
      projectType: 'Theme Park',
      application1: 'Signage',
      application2: 'Facade',
      proposalSentDate: '11/05/2025',
      contact: 'Mike Stewart',
      phone: '(407) 555-0123',
      email: 'mike.stewart@jonessign.com',
      remarks: 'Follow up needed',
      siteVisit: '10/28/2025',
      followUp1: '11/01/2025',
      followUp2: '11/05/2025',
      followUp3: '11/07/2025',
      priority: 'high'
    },
    {
      id: 2,
      projectName: 'Downtown Office Tower',
      estimator: 'Sarah',
      bidDate: '11/15/2025',
      projectId: 'PRJ-2025-002',
      proposalTotal: 485200,
      status: 'in-progress',
      awarded: 'no',
      contractor: 'Turner Construction',
      source: 'PlanHub',
      state: 'CA',
      city: 'San Francisco',
      projectType: 'Commercial',
      application1: 'Curtain Wall',
      application2: 'Metal Panels',
      proposalSentDate: '-',
      contact: 'Jennifer Kim',
      phone: '(415) 555-0456',
      email: 'j.kim@turner.com',
      remarks: 'Awaiting drawings',
      siteVisit: '11/01/2025',
      followUp1: '11/03/2025',
      followUp2: '-',
      followUp3: '-',
      priority: 'medium'
    },
    {
      id: 3,
      projectName: 'Airport Terminal Expansion',
      estimator: 'Michael',
      bidDate: '11/20/2025',
      projectId: 'PRJ-2025-003',
      proposalTotal: 1250000,
      status: 'awarded',
      awarded: 'yes',
      contractor: 'Skanska USA',
      source: 'Procore',
      state: 'TX',
      city: 'Dallas',
      projectType: 'Infrastructure',
      application1: 'ACM Panels',
      application2: 'Storefront',
      proposalSentDate: '10/25/2025',
      contact: 'Robert Chen',
      phone: '(214) 555-0789',
      email: 'r.chen@skanska.com',
      remarks: 'Project awarded!',
      siteVisit: '10/15/2025',
      followUp1: '10/20/2025',
      followUp2: '10/28/2025',
      followUp3: '11/02/2025',
      priority: 'low'
    }
  ];

  // Set first bid as selected by default
  useEffect(() => {
    if (!selectedBid && bids.length > 0) {
      setSelectedBid(bids[0]);
    }
  }, []);

  const stats = {
    active: 12,
    activeChange: '+3 this week',
    winRate: 68,
    winRateChange: '↑ 5% vs avg',
    totalValue: '$2.8M',
    totalValueChange: '+12%',
    thisMonth: '8 Bids',
    avgValue: '$350K'
  };

  const thisWeekEvents = [
    { type: 'sent', title: 'Proposal sent', project: 'Disney World Epcot', date: 'Nov 5', color: '#60a5fa' },
    { type: 'follow-up', title: 'Follow-up call', project: 'Office Tower', date: 'Nov 7', color: '#fdba74' },
    { type: 'submitted', title: 'Bid submitted', project: 'Airport Terminal', date: 'Nov 8', color: '#4ade80' }
  ];

  const filterCounts = {
    all: 15,
    dueSoon: 4,
    awarded: 5,
    inProgress: 4,
    missed: 2
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'sent': { class: 'status-sent', label: 'Sent' },
      'in-progress': { class: 'status-in-progress-bid', label: 'In Progress' },
      'awarded': { class: 'status-awarded', label: 'Awarded' },
      'pending': { class: 'status-pending-bid', label: 'Pending' }
    };
    const config = statusConfig[status] || statusConfig['pending'];
    return <span className={`status-badge-bid ${config.class}`}>{config.label}</span>;
  };

  const getAwardedBadge = (awarded) => {
    if (awarded === 'yes') {
      return <span className="awarded-badge yes">Yes</span>;
    } else if (awarded === 'no') {
      return <span className="awarded-badge no">No</span>;
    } else {
      return <span className="awarded-badge pending">Pending</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    const config = {
      'high': { class: 'priority-high', label: 'High', color: '#f87171' },
      'medium': { class: 'priority-medium', label: 'Medium', color: '#fb923c' },
      'low': { class: 'priority-low', label: 'Low', color: '#22c55e' }
    };
    const p = config[priority] || config['medium'];
    return (
      <div className={`priority-badge ${p.class}`}>
        <span className="priority-dot" style={{ backgroundColor: p.color }}></span>
        {p.label}
      </div>
    );
  };

  return (
    <div className="bid-schedule-layout-new">
      {/* Top Navigation Bar */}
      <div className="bid-schedule-topnav">
        {/* Logo */}
        <div className="bid-schedule-logo">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2.81" y="3.20" width="14" height="2.70" fill="#f97316"/>
            <rect x="2.81" y="9.55" width="14" height="2.73" fill="#22c55e"/>
            <rect x="0" y="6.35" width="8" height="2.74" fill="#fb923c"/>
            <rect x="5.59" y="0" width="8" height="2.73" fill="#ef4444"/>
            <rect x="5.60" y="12.73" width="8" height="2.73" fill="rgba(0,0,0,0.2)"/>
          </svg>
        </div>

        {/* Tabs */}
        <div className="bid-schedule-topnav-tabs">
          <button className="bid-tab-new active">
            <div className="tab-indicator"></div>
            Bids
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
            </svg>
          </button>
          <button className="bid-tab-new">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
            </svg>
            Takeoff
          </button>
          <button className="bid-tab-new">
            Proposal
          </button>
          <button className="bid-tab-add" title="Add tab">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
            </svg>
          </button>
        </div>

        {/* Right Controls */}
        <div className="bid-schedule-topnav-controls">
          {/* 9-dot Menu */}
          <div className="grid-menu-wrapper" ref={moduleMenuRef}>
            <button
              className="topnav-icon-btn-bid"
              onClick={() => setShowModuleMenu(!showModuleMenu)}
              title="Apps Menu"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
              </svg>
            </button>

            {showModuleMenu && (
              <div className="module-menu">
                <div className="module-grid">
                  {modules.map((module, index) => {
                    const IconComponent = ModuleIcons[module.iconKey];
                    return (
                      <div
                        key={index}
                        className={`module-item ${module.route ? 'clickable' : ''}`}
                        onClick={() => handleModuleClick(module)}
                        style={{ cursor: module.route ? 'pointer' : 'default' }}
                      >
                        <div className="module-icon">
                          {IconComponent && <IconComponent />}
                        </div>
                        <div className="module-name">{module.name}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="user-info-wrapper" ref={userDropdownRef}>
            <div
              className="user-info-topnav"
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              title="Profile"
            >
              <div className="user-avatar-topnav">
                {user.fullname?.charAt(0).toUpperCase()}
              </div>
            </div>

            {showUserDropdown && (
              <div className="profile-dropdown-bid">
                <div className="profile-dropdown-header">
                  <div className="profile-dropdown-avatar">
                    {user.fullname?.charAt(0).toUpperCase()}
                  </div>
                  <div className="profile-dropdown-info">
                    <div className="profile-dropdown-name">{user.fullname}</div>
                    <div className="profile-dropdown-email">{user.email}</div>
                    <div className="profile-dropdown-role">
                      {user.role === 'admin' ? 'Administrator' : 'Employee'}
                    </div>
                  </div>
                </div>
                <div className="profile-dropdown-divider"></div>
                <button className="profile-dropdown-item" onClick={() => {
                  setShowUserDropdown(false);
                  onShowProfile && onShowProfile();
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <span>View Profile</span>
                </button>
                <button className="profile-dropdown-item logout-item" onClick={() => {
                  setShowUserDropdown(false);
                  onLogout && onLogout();
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Container with 3 columns */}
      <div className="bid-schedule-container-new">
        {/* Left Sidebar */}
        <div className="bid-schedule-sidebar-left-new">
          {/* Header */}
          <div className="bid-sidebar-header">
            <div className="bid-sidebar-title">
              <h2>Bid Schedule</h2>
              <span className="month-label">November 2025</span>
            </div>
            <button className="btn-close-bid">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
              </svg>
            </button>
          </div>

          {/* Search */}
          <div className="bid-sidebar-search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input 
              type="text"
              placeholder="Search bids..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Overview Section */}
          <div className="bid-sidebar-section">
            <div className="section-label-bid">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
              </svg>
              OVERVIEW
            </div>
            <div className="stats-cards-bid">
              <div className="stat-card-bid orange">
                <span className="stat-label-small">Active</span>
                <span className="stat-value-large">{stats.active}</span>
                <span className="stat-change">{stats.activeChange}</span>
              </div>
              <div className="stat-card-bid green">
                <span className="stat-label-small">Win Rate</span>
                <span className="stat-value-large">{stats.winRate}%</span>
                <span className="stat-change">{stats.winRateChange}</span>
              </div>
            </div>

            {/* Stats Summary Box */}
            <div className="stats-summary-box">
              <div className="stats-summary-item">
                <div className="summary-icon green">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </div>
                <div className="summary-content">
                  <span className="summary-label">Total Value</span>
                  <span className="summary-value">{stats.totalValue}</span>
                </div>
                <span className="summary-change positive">{stats.totalValueChange}</span>
              </div>
              <div className="stats-divider-thin"></div>
              <div className="stats-summary-item">
                <div className="summary-icon blue">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div className="summary-content">
                  <span className="summary-label">This Month</span>
                  <span className="summary-value">{stats.thisMonth}</span>
                </div>
              </div>
              <div className="stats-divider-thin"></div>
              <div className="stats-summary-item">
                <div className="summary-icon purple">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M12 1v6m0 6v6"/>
                  </svg>
                </div>
                <div className="summary-content">
                  <span className="summary-label">Avg. Value</span>
                  <span className="summary-value">{stats.avgValue}</span>
                </div>
              </div>
            </div>
          </div>

          {/* This Week Section */}
          <div className="bid-sidebar-section">
            <div className="section-header-with-date">
              <div className="section-label-bid small">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                THIS WEEK
              </div>
              <span className="date-range">Nov 4-10</span>
            </div>
            <div className="events-list">
              {thisWeekEvents.map((event, index) => (
                <div key={index} className="event-item" style={{ backgroundColor: event.color }}>
                  <div className="event-dot"></div>
                  <div className="event-content">
                    <span className="event-title">{event.title}</span>
                    <span className="event-details">{event.project} • {event.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Filters Section */}
          <div className="bid-sidebar-section filters">
            <div className="section-label-bid small">FILTERS</div>
            <div className="filter-list">
              <button className={`filter-item ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                </svg>
                <span>All Bids</span>
                <span className="filter-count">{filterCounts.all}</span>
              </button>
              <button className={`filter-item ${filterStatus === 'due-soon' ? 'active' : ''}`} onClick={() => setFilterStatus('due-soon')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span>Due Soon</span>
                <span className="filter-count orange">{filterCounts.dueSoon}</span>
              </button>
              <button className={`filter-item ${filterStatus === 'awarded' ? 'active' : ''}`} onClick={() => setFilterStatus('awarded')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <span>Awarded</span>
                <span className="filter-count green">{filterCounts.awarded}</span>
              </button>
              <button className={`filter-item ${filterStatus === 'in-progress' ? 'active' : ''}`} onClick={() => setFilterStatus('in-progress')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                </svg>
                <span>In Progress</span>
                <span className="filter-count blue">{filterCounts.inProgress}</span>
              </button>
              <button className={`filter-item ${filterStatus === 'missed' ? 'active' : ''}`} onClick={() => setFilterStatus('missed')}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="15" y1="9" x2="9" y2="15"/>
                  <line x1="9" y1="9" x2="15" y2="15"/>
                </svg>
                <span>Missed</span>
                <span className="filter-count red">{filterCounts.missed}</span>
              </button>
            </div>
          </div>

          {/* View Mode Section */}
          <div className="bid-sidebar-section">
            <div className="section-label-bid small">VIEW MODE</div>
            <div className="view-mode-list">
              <button className={`view-mode-item ${viewMode === 'list' ? 'active' : ''}`} onClick={() => setViewMode('list')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="8" y1="6" x2="21" y2="6"/>
                  <line x1="8" y1="12" x2="21" y2="12"/>
                  <line x1="8" y1="18" x2="21" y2="18"/>
                  <line x1="3" y1="6" x2="3.01" y2="6"/>
                  <line x1="3" y1="12" x2="3.01" y2="12"/>
                  <line x1="3" y1="18" x2="3.01" y2="18"/>
                </svg>
                <span>List View</span>
              </button>
              <button className={`view-mode-item ${viewMode === 'calendar' ? 'active' : ''}`} onClick={() => setViewMode('calendar')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>Calendar</span>
              </button>
              <button className={`view-mode-item ${viewMode === 'kanban' ? 'active' : ''}`} onClick={() => setViewMode('kanban')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="4" y1="5" x2="4" y2="19"/>
                  <line x1="12" y1="5" x2="12" y2="15"/>
                  <line x1="20" y1="5" x2="20" y2="19"/>
                </svg>
                <span>Kanban</span>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bid-schedule-main-content-new">
          {/* Header */}
          <div className="bid-content-header">
            <div className="header-actions">
              <button className="btn-filter-bid">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
                Filter
              </button>
              <button className="btn-new-bid">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                New Bid
              </button>
            </div>
          </div>

          {/* Bid Table */}
          <div className="bid-table-wrapper">
            <table className="bid-table">
              <thead>
                <tr>
                  <th className="col-checkbox-bid"><input type="checkbox" /></th>
                  <th className="col-project-name">Project Name</th>
                  <th>Estimator</th>
                  <th>Bid Date</th>
                  <th>Project ID</th>
                  <th>Proposal Total</th>
                  <th>Status</th>
                  <th>Awarded</th>
                  <th>Contractor</th>
                  <th>Source</th>
                  <th>State</th>
                  <th>City</th>
                  <th>Project Type</th>
                  <th>Application 1</th>
                  <th>Application 2</th>
                  <th>Proposal Sent Date</th>
                  <th>Contact</th>
                  <th>Phone</th>
                  <th>Email</th>
                  <th>Remarks</th>
                  <th>Site Visit</th>
                  <th>Follow-up 1</th>
                  <th>Follow-up 2</th>
                  <th>Follow-up 3</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {bids.map(bid => (
                  <tr 
                    key={bid.id} 
                    className={`bid-row ${selectedBid?.id === bid.id ? 'selected' : ''}`}
                    onClick={() => setSelectedBid(bid)}
                  >
                    <td className="col-checkbox-bid"><input type="checkbox" onClick={(e) => e.stopPropagation()} /></td>
                    <td className="col-project-name">{bid.projectName}</td>
                    <td>{bid.estimator}</td>
                    <td>{bid.bidDate}</td>
                    <td className="col-project-id">{bid.projectId}</td>
                    <td className="col-amount">${bid.proposalTotal.toLocaleString()}</td>
                    <td>{getStatusBadge(bid.status)}</td>
                    <td>{getAwardedBadge(bid.awarded)}</td>
                    <td>{bid.contractor}</td>
                    <td>{bid.source}</td>
                    <td>{bid.state}</td>
                    <td>{bid.city}</td>
                    <td>{bid.projectType}</td>
                    <td>{bid.application1}</td>
                    <td>{bid.application2}</td>
                    <td>{bid.proposalSentDate}</td>
                    <td>{bid.contact}</td>
                    <td>{bid.phone}</td>
                    <td className="col-email">{bid.email}</td>
                    <td>{bid.remarks}</td>
                    <td>{bid.siteVisit}</td>
                    <td>{bid.followUp1}</td>
                    <td>{bid.followUp2}</td>
                    <td>{bid.followUp3}</td>
                    <td>{getPriorityBadge(bid.priority)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar - Bid Details */}
        <div className="bid-schedule-sidebar-right-new">
          {selectedBid ? (
            <>
              {/* Header */}
              <div className="bid-details-header">
                <h2>Bid Details</h2>
              </div>

              {/* Bid Details */}
              <div className="bid-details-content">
                <div className="detail-group-bid">
                  <label>Project:</label>
                  <p className="detail-value">{selectedBid.projectName}</p>
                </div>

                <div className="detail-group-bid">
                  <label>Contractor:</label>
                  <p className="detail-value">{selectedBid.contractor}</p>
                </div>

                <div className="detail-group-bid">
                  <label>Status:</label>
                  {getStatusBadge(selectedBid.status)}
                </div>

                <div className="detail-group-bid">
                  <label>Due Date:</label>
                  <p className="detail-value">Nov 8, 2025</p>
                </div>

                <div className="detail-group-bid">
                  <label>Estimator:</label>
                  <p className="detail-value">{selectedBid.estimator}</p>
                </div>
              </div>

              {/* Activity Timeline */}
              <div className="timeline-section">
                <h3>Activity Timeline</h3>
                <div className="timeline-list">
                  <div className="timeline-item">
                    <span className="timeline-dot"></span>
                    <span className="timeline-text">Proposal Sent - Nov 5, 2025</span>
                  </div>
                  <div className="timeline-item">
                    <span className="timeline-dot"></span>
                    <span className="timeline-text">Follow-Up 1 - Nov 1</span>
                  </div>
                  <div className="timeline-item">
                    <span className="timeline-dot"></span>
                    <span className="timeline-text">Proposal Sent - Nov 5</span>
                  </div>
                </div>
              </div>

              {/* Follow-Up Actions */}
              <div className="followup-section">
                <h3>Follow-Up Actions</h3>
                <textarea 
                  className="followup-input"
                  placeholder="Add a follow-up note..."
                  rows="3"
                ></textarea>
                <div className="followup-notes">
                  <div className="note-item">
                    <span className="note-date">Nov 7:</span>
                    <span className="note-text">Sent reminder email to GC.</span>
                  </div>
                  <div className="note-item">
                    <span className="note-date">Nov 8:</span>
                    <span className="note-text">Scheduled follow-up call with Mike Steward.</span>
                  </div>
                </div>
              </div>

              {/* AI Insights */}
              <div className="ai-insights-section">
                <h3>AI Insights</h3>
                <div className="ai-insights-box">
                  <p>High win probability (85%). Follow up with Mike Steward for addenda updates.</p>
                </div>
              </div>

              {/* Open Full Project Button */}
              <div className="bid-details-footer">
                <button className="btn-open-project">
                  Open Full Project
                </button>
              </div>
            </>
          ) : (
            <div className="no-selection-bid">
              <p>Select a bid to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BidSchedule;
