import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import * as pdfjsLib from 'pdfjs-dist';
import { ModuleIcons } from './components/ModuleIcons';
import './Plans.css';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// PDF Thumbnail Component
function PDFThumbnail({ plan, onLoad }) {
  const canvasRef = useRef(null);
  const renderTaskRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const generateThumbnail = async () => {
      try {
        setIsLoading(true);
        setError(false);

        console.log('Starting PDF thumbnail generation for:', plan.file_name);

        // Use the API endpoint that serves files with CORS headers
        const fileUrl = `${API_URL}/plans/${plan.id}/file`;
        
        console.log('PDF URL:', fileUrl);

        // Load the PDF with CORS settings
        const loadingTask = pdfjsLib.getDocument({
          url: fileUrl,
          cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/cmaps/`,
          cMapPacked: true,
        });
        
        const pdf = await loadingTask.promise;
        
        if (!isMounted) return;
        
        console.log('PDF loaded, pages:', pdf.numPages);

        // Get the first page
        const page = await pdf.getPage(1);

        if (!isMounted) return;

        // Set up canvas
        const canvas = canvasRef.current;
        if (!canvas) {
          console.error('Canvas ref not available');
          return;
        }

        const context = canvas.getContext('2d');
        
        // Calculate scale to fit thumbnail area (200px height)
        const viewport = page.getViewport({ scale: 1 });
        const scale = 200 / viewport.height;
        const scaledViewport = page.getViewport({ scale });

        // Set canvas dimensions
        canvas.width = scaledViewport.width;
        canvas.height = scaledViewport.height;

        console.log('Rendering PDF page...');

        // Cancel any previous render task
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        // Render the page
        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport,
        };

        renderTaskRef.current = page.render(renderContext);
        await renderTaskRef.current.promise;
        
        if (!isMounted) return;
        
        console.log('PDF thumbnail rendered successfully!');
        
        setIsLoading(false);
        
        if (onLoad) onLoad();

      } catch (err) {
        if (err.name === 'RenderingCancelledException') {
          console.log('Rendering cancelled for:', plan.file_name);
          return;
        }
        
        if (!isMounted) return;
        
        console.error('Error generating PDF thumbnail:', err);
        console.error('Error details:', {
          message: err.message,
          name: err.name,
          stack: err.stack
        });
        setError(true);
        setIsLoading(false);
      }
    };

    if (plan.file_type === 'application/pdf') {
      generateThumbnail();
    } else {
      setError(true); // Not a PDF, show fallback
    }

    // Cleanup function
    return () => {
      isMounted = false;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [plan.id, plan.file_type, plan.file_name, onLoad]);

  if (error || plan.file_type !== 'application/pdf') {
    return (
      <div className="pdf-preview-fallback">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        <span className="pdf-label">PDF</span>
      </div>
    );
  }

  return (
    <>
      {isLoading && (
        <div className="pdf-preview-fallback">
          <div className="thumbnail-loading">
            <div className="spinner-small"></div>
            <span style={{ fontSize: '12px', color: '#808080', marginTop: '8px' }}>Loading...</span>
          </div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        style={{
          display: isLoading ? 'none' : 'block',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </>
  );
}

function Plans({ user: propsUser, onShowProfile, onTabChange, onLogout }) {
  const [plans, setPlans] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUpload, setShowUpload] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [user, setUser] = useState({});
  const [viewMode, setViewMode] = useState('grid'); // Default to grid view as per Figma
  const [activeTab, setActiveTab] = useState('recent'); // 'recent', 'shared', 'projects'
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showCollaborators, setShowCollaborators] = useState(false);
  const [selectedPlanForCollab, setSelectedPlanForCollab] = useState(null);
  const [showModuleMenu, setShowModuleMenu] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
  const moduleMenuRef = useRef(null);
  const userDropdownRef = useRef(null);

  // Fetch user role and jobs
  useEffect(() => {
    const userData = propsUser || JSON.parse(localStorage.getItem('user') || '{}');
    const role = userData.role || '';
    setUser(userData);
    setUserRole(role);
    
    // Fetch jobs after role is set
    if (role) {
      fetchJobs(role);
    }
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

  // Fetch plans when job changes
  useEffect(() => {
    fetchPlans();
  }, [selectedJob]);

  const fetchJobs = async (role) => {
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const endpoint = role === 'admin' ? '/jobs' : '/my-jobs';
      const response = await axios.get(`${API_URL}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        // Handle both paginated and non-paginated responses
        const jobsData = response.data.data;
        if (Array.isArray(jobsData)) {
          setJobs(jobsData);
        } else if (jobsData && Array.isArray(jobsData.data)) {
          // Paginated response
          setJobs(jobsData.data);
        } else {
          setJobs([]);
        }
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load projects');
      setJobs([]); // Set empty array on error
    }
  };

  const fetchPlans = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const params = selectedJob ? `?job_id=${selectedJob}` : '';
      
      const response = await axios.get(`${API_URL}/plans${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPlans(response.data.data || []);
      }
    } catch (err) {
      setError('Failed to load plans');
      console.error('Error fetching plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm('Are you sure you want to delete this plan? All measurements will also be deleted.')) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      await axios.delete(`${API_URL}/plans/${planId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Plan deleted successfully');
      fetchPlans();
    } catch (err) {
      alert('Failed to delete plan: ' + (err.response?.data?.message || err.message));
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getTimeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInMs = now - past;
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    return past.toLocaleDateString();
  };

  const openMeasurementTool = (plan) => {
    setSelectedPlan(plan);
  };

  const closeMeasurementTool = () => {
    setSelectedPlan(null);
    fetchPlans(); // Refresh to update measurement counts
  };

  const openCollaborators = (plan, event) => {
    event.stopPropagation();
    setSelectedPlanForCollab(plan);
    setShowCollaborators(true);
  };

  const closeCollaborators = () => {
    setShowCollaborators(false);
    setSelectedPlanForCollab(null);
  };

  if (selectedPlan) {
    // Lazy load MeasurementTool component
    const MeasurementTool = require('./MeasurementTool').default;
    return <MeasurementTool plan={selectedPlan} onClose={closeMeasurementTool} />;
  }

  const filteredPlans = plans.filter(plan => 
    plan.file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (plan.job_title && plan.job_title.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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

  return (
    <div className="plans-layout">
      {/* Top Navigation Bar - Figma Style */}
      <div className="plans-topnav">
        {/* Logo */}
        <div className="plans-logo">
          <img src="/Profile.png" alt="Constructify" className="plans-logo-image" />
        </div>

        {/* Tabs */}
        <div className="plans-topnav-tabs">
          <button className="nav-tab active">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
            </svg>
            Takeoff
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
          <button className="nav-tab">Pricing Sheet</button>
          <button className="nav-tab">Proposal</button>
          <button className="nav-tab">Presentation</button>
          <button className="nav-add-btn" title="Add tab">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>

        {/* Right Controls */}
        <div className="plans-topnav-controls">
          {/* 9-dot Menu */}
          <div className="grid-menu-wrapper" ref={moduleMenuRef}>
            <button
              className="topnav-icon-btn"
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
              <div className="profile-dropdown-plans">
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

      {/* Content Container */}
      <div className="plans-container">
        {/* Left Sidebar */}
        <div className="plans-sidebar-left">
          {/* User Profile Section */}
          <div className="sidebar-user-profile">
            <div className="user-avatar-circle-sidebar">
              {user.fullname?.charAt(0).toUpperCase()}
            </div>
            <div className="user-name-text">
              {user.fullname}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
            <button className="sidebar-icon-btn" title="More options">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
              </svg>
            </button>
            <button className="sidebar-icon-btn" title="Settings">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6"/>
              </svg>
            </button>
          </div>

          {/* Search Bar in Sidebar */}
          <div className="sidebar-search-wrapper">
            <svg className="sidebar-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input 
              type="text"
              className="sidebar-search-input"
              placeholder="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Navigation Items */}
          <div className="sidebar-nav-section">
            <button className="sidebar-nav-item active">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              Recents
            </button>
            <button className="sidebar-nav-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
              </svg>
              Community
            </button>
          </div>

          <div className="sidebar-divider"></div>

          {/* Secondary Navigation */}
          <div className="sidebar-nav-section">
            <button className="sidebar-nav-item-small">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              Drafts
            </button>
            <button className="sidebar-nav-item-small">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              All projects
            </button>
            <button className="sidebar-nav-item-small">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              </svg>
              Resources
            </button>
            <button className="sidebar-nav-item-small">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              Trash
            </button>
          </div>

          {/* Starred Section */}
          <div className="sidebar-section-starred">
            <div className="sidebar-section-label">Starred</div>
            {Array.isArray(jobs) && jobs.slice(0, 3).map(job => (
              <button 
                key={job.id}
                className={`sidebar-nav-item-small ${selectedJob === job.id.toString() ? 'selected' : ''}`}
                onClick={() => setSelectedJob(selectedJob === job.id.toString() ? '' : job.id.toString())}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                {job.job_name || job.title}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="plans-main-content">
          {/* Toolbar with filters and view options */}
          <div className="plans-toolbar-bar">
            <button className="toolbar-back-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>

            <select className="toolbar-select" value={selectedJob} onChange={(e) => setSelectedJob(e.target.value)}>
              <option value="">All Projects</option>
              {Array.isArray(jobs) && jobs.map(job => (
                <option key={job.id} value={job.id.toString()}>
                  {job.job_name || job.title}
                </option>
              ))}
            </select>

            <select className="toolbar-select">
              <option>Last viewed</option>
              <option>Last modified</option>
              <option>Name</option>
            </select>

            <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
              {userRole === 'admin' && (
                <button 
                  className="btn-icon"
                  onClick={() => setShowUpload(!showUpload)}
                  title="Upload Plan"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </button>
              )}

              <div className="view-mode-toggle">
                <button 
                  className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                  title="Grid View"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                  </svg>
                </button>
                <button 
                  className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
                  onClick={() => setViewMode('list')}
                  title="List View"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="8" y1="6" x2="21" y2="6"/>
                    <line x1="8" y1="12" x2="21" y2="12"/>
                    <line x1="8" y1="18" x2="21" y2="18"/>
                    <line x1="3" y1="6" x2="3.01" y2="6"/>
                    <line x1="3" y1="12" x2="3.01" y2="12"/>
                    <line x1="3" y1="18" x2="3.01" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Content Wrapper */}
          <div className="plans-content-wrapper">

        {showUpload && userRole === 'admin' && (
          <div className="upload-overlay">
            <PlanUpload 
              jobs={jobs} 
              onUploadSuccess={() => {
                setShowUpload(false);
                fetchPlans();
              }}
              onCancel={() => setShowUpload(false)}
            />
          </div>
        )}

        {error && <div className="error-message">{error}</div>}

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading plans...</p>
          </div>
        ) : filteredPlans.length === 0 ? (
          <div className="empty-state">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <h3>No plans found</h3>
            <p>
              {plans.length === 0 
                ? userRole === 'admin' 
                  ? 'Upload your first plan to get started' 
                  : 'No plans have been uploaded yet'
                : 'No plans match your search criteria'}
            </p>
            {userRole === 'admin' && plans.length === 0 && (
              <button className="btn-primary" onClick={() => setShowUpload(true)}>
                Upload Plan
              </button>
            )}
          </div>
        ) : viewMode === 'list' ? (
          <div className="plans-table-container">
            <table className="plans-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>BID Date</th>
                  <th>Last modified</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredPlans.map(plan => (
                  <tr key={plan.id} className="plan-row">
                    <td className="plan-name-cell">
                      <div className="plan-icon-wrapper">
                        <img 
                          src={`/icons/${plan.file_type === 'application/pdf' ? 'files' : 'field'}.svg`}
                          alt="file" 
                          width="24" 
                          height="24"
                        />
                      </div>
                      <div className="plan-name-info">
                        <div className="plan-filename">{plan.file_name}</div>
                        <div className="plan-project">{plan.job_title}</div>
                      </div>
                    </td>
                    <td className="date-cell">
                      {new Date(plan.uploaded_at).toLocaleDateString('en-US', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="date-cell">
                      {new Date(plan.uploaded_at).toLocaleDateString('en-US', { 
                        day: 'numeric', 
                        month: 'short', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="date-cell">
                      <div className="user-avatar-small">
                        {plan.uploaded_by?.charAt(0).toUpperCase()}
                      </div>
                    </td>
                    <td className="actions-cell">
                      <button 
                        className="btn-table-action"
                        onClick={() => openMeasurementTool(plan)}
                        title="Open Plan"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                      </button>
                      {userRole === 'admin' && (
                        <button 
                          className="btn-table-action delete"
                          onClick={() => handleDeletePlan(plan.id)}
                          title="Delete Plan"
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="plans-grid">
            {filteredPlans.map(plan => (
              <div 
                key={plan.id} 
                className="plan-card-figma"
                onClick={() => openMeasurementTool(plan)}
              >
                {/* Thumbnail Preview */}
                <div className="plan-thumbnail">
                  {plan.file_type === 'application/pdf' ? (
                    <PDFThumbnail plan={plan} />
                  ) : (
                    <div className="image-preview">
                      <img 
                        src={`/icons/field.svg`}
                        alt={plan.file_name}
                        style={{ width: '64px', height: '64px', opacity: 0.6 }}
                      />
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="plan-card-footer">
                  <div className="plan-card-info">
                    <div className="plan-checkbox" onClick={(e) => e.stopPropagation()}>
                      {/* Empty checkbox by default */}
                    </div>
                    <div className="plan-title">
                      <h4>{plan.file_name}</h4>
                    </div>
                  </div>

                  <div className="plan-meta">
                    <div className="plan-meta-left">
                      <span className="plan-edited">Edited {getTimeAgo(plan.uploaded_at)}</span>
                      <span className="plan-due">Due: {new Date(plan.uploaded_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                    
                    <div 
                      className="plan-users" 
                      onClick={(e) => openCollaborators(plan, e)}
                      title="View collaborators"
                      style={{ cursor: 'pointer' }}
                    >
                      {plan.uploaded_by && (
                        <div className="user-avatar-circle" title={plan.uploaded_by}>
                          {plan.uploaded_by.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {/* Additional collaborator avatars can be added here */}
                      <div className="user-avatar-circle secondary" title="Additional collaborator">
                        {plan.uploaded_by && plan.uploaded_by.length > 1 
                          ? plan.uploaded_by.charAt(1).toUpperCase() 
                          : 'A'}
                      </div>
                      <div className="user-avatar-circle add-more" title="View all & add people">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <line x1="12" y1="5" x2="12" y2="19"/>
                          <line x1="5" y1="12" x2="19" y2="12"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
          </div>
        </div>
      </div>

      {showCollaborators && selectedPlanForCollab && (
        (() => {
          const PlanCollaborators = require('./components/PlanCollaborators').default;
          return <PlanCollaborators plan={selectedPlanForCollab} onClose={closeCollaborators} />;
        })()
      )}
    </div>
  );
}

// Plan Upload Component (embedded)
function PlanUpload({ jobs, onUploadSuccess, onCancel }) {
  const [selectedJob, setSelectedJob] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Please select a PDF or image file (JPG, PNG)');
        return;
      }

      // Validate file size (50MB max)
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB');
        return;
      }

      setFile(selectedFile);
      setError('');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!selectedJob) {
      setError('Please select a project');
      return;
    }

    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      const token = localStorage.getItem('auth_token') || localStorage.getItem('token');
      const formData = new FormData();
      formData.append('job_id', parseInt(selectedJob, 10)); // Ensure it's an integer
      formData.append('file', file);
      
      console.log('Uploading plan:', {
        job_id: selectedJob,
        file_name: file.name,
        file_type: file.type,
        file_size: file.size
      });

      const response = await axios.post(`${API_URL}/plans`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });

      if (response.data.success) {
        setUploadProgress(100);
        setTimeout(() => {
          alert('Plan uploaded successfully!');
          setSelectedJob('');
          setFile(null);
          setUploadProgress(0);
          onUploadSuccess();
        }, 500);
      }
    } catch (err) {
      console.error('Upload error:', err.response?.data);
      const errorMsg = err.response?.data?.message || 'Failed to upload plan';
      const errors = err.response?.data?.errors;
      
      if (errors) {
        const errorDetails = Object.values(errors).flat().join(', ');
        setError(`${errorMsg}: ${errorDetails}`);
      } else {
        setError(errorMsg);
      }
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(droppedFile.type)) {
        setError('Please select a PDF or image file (JPG, PNG)');
        return;
      }
      if (droppedFile.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB');
        return;
      }
      setFile(droppedFile);
      setError('');
    }
  };

  return (
    <div className="upload-modal">
      {onCancel && (
        <button type="button" className="modal-close" onClick={onCancel}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      )}

      <div className="upload-modal-header">
        <h2>Import</h2>
      </div>

      {!file ? (
        <div 
          className="drag-drop-area"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <div className="drag-drop-content">
            <h3>Bring your plans into Constructify</h3>
            <p>Import construction plans, blueprints, and PDFs.</p>
            
            <label htmlFor="file-input" className="btn-import">
              Import from computer
            </label>
            <input 
              id="file-input"
              type="file" 
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>
        </div>
      ) : (
        <div className="upload-form-container">
          {error && <div className="error-message">{error}</div>}
          
          <div className="file-selected">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <div className="file-info">
              <h4>{file.name}</h4>
              <p>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <button 
              type="button" 
              className="btn-remove-file"
              onClick={() => setFile(null)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>

          <form onSubmit={handleUpload} className="upload-form">
            <div className="form-group-modal">
              <label>Select Project *</label>
              <select 
                value={selectedJob}
                onChange={(e) => setSelectedJob(e.target.value)}
                required
                className="modal-select"
              >
                <option value="">-- Choose Project --</option>
                {Array.isArray(jobs) && jobs.map(job => (
                  <option key={job.id} value={job.id}>{job.job_name || job.title}</option>
                ))}
              </select>
            </div>

            {uploading && (
              <div className="upload-progress">
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${uploadProgress}%` }}
                  >
                    <span className="progress-text">{uploadProgress}%</span>
                  </div>
                </div>
                <p className="progress-label">Uploading plan...</p>
              </div>
            )}

            <button 
              type="submit" 
              className="btn-upload-submit"
              disabled={uploading || !selectedJob}
            >
              {uploading ? `Uploading... ${uploadProgress}%` : 'Upload Plan'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Plans;

