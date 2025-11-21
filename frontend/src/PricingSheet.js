import React, { useState, useEffect, useRef } from 'react';
import { ModuleIcons } from './components/ModuleIcons';
import './PricingSheet.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

function PricingSheet({ user: propsUser, onShowProfile, onTabChange, onLogout }) {
  const [user, setUser] = useState({});
  const [userRole, setUserRole] = useState('');
  const [showModuleMenu, setShowModuleMenu] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState('pricing'); // 'pricing' or 'quotes'
  const [expandedCategories, setExpandedCategories] = useState({ 'design': true }); // Track which categories are expanded
  const [selectedLineItem, setSelectedLineItem] = useState(null);
  
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

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Sample pricing data with categories
  const categories = [
    {
      id: 'design',
      name: 'Design',
      color: '#3b82f6', // blue
      items: [
        { id: 1, description: 'Engineering Design', quantity: 1, unit: 'Sum', unitPrice: 8000.00, status: 'completed', timeline: 'Week 1-2', total: 8000.00 },
        { id: 2, description: 'Sign and Sealed Shop Drawings', quantity: 1, unit: 'Sum', unitPrice: 1500.00, status: 'completed', timeline: 'Week 2', total: 1500.00 },
        { id: 3, description: 'Fabrication Drawings', quantity: 1, unit: 'Sum', unitPrice: 2500.00, status: 'in-progress', timeline: 'Week 2-3', total: 2500.00 },
        { id: 4, description: 'Installation Drawings', quantity: 1, unit: 'Sum', unitPrice: 2500.00, status: 'pending', timeline: 'Week 3', total: 2500.00 },
        { id: 5, description: 'Renderings & 3D Visualizer', quantity: 1, unit: 'Sum', unitPrice: 500.00, status: 'completed', timeline: 'Week 1', total: 500.00 },
        { id: 6, description: '3D Scanning', quantity: 1, unit: 'Sum', unitPrice: 3000.00, status: 'in-progress', timeline: 'Week 1', total: 3000.00 },
      ],
      total: 18000.00
    },
    {
      id: 'administrative',
      name: 'Administrative',
      color: '#6b7280', // gray
      items: [
        { id: 7, description: 'Permit & Fees', quantity: 1, unit: 'Sum', unitPrice: 2500.00, status: 'in-progress', timeline: 'Week 3', total: 2500.00 },
      ],
      total: 2500.00
    },
    {
      id: 'site-preparation',
      name: 'Site Preparation',
      color: '#f97316', // orange
      items: [],
      total: 40080.00
    },
    {
      id: 'equipment',
      name: 'Equipment',
      color: '#a855f7', // purple
      items: [],
      total: 56700.00
    },
    {
      id: 'labor',
      name: 'Labor',
      color: '#10b981', // green
      items: [],
      total: 37500.00
    },
    {
      id: 'fabrication',
      name: 'Fabrication',
      color: '#14b8a6', // teal
      items: [],
      total: 18000.00
    },
    {
      id: 'materials',
      name: 'Materials',
      color: '#eab308', // yellow
      items: [],
      total: 760240.00
    },
  ];

  const projectDetails = {
    name: 'Vero Beach Museum',
    code: 'PRJ-2025-VBM',
    location: 'Vero Beach, FL',
    bidDate: '28/Feb/2025',
    contact: 'Amit Sharma - BIS Coordinator',
    phone: '(305) 482-7310',
    email: 'michael.roberts@bis.gov',
  };

  const totals = {
    generalConditions: 154780.00,
    lineItemsSubtotal: 933020.00,
    overhead: 46651.00,
    profit: 279906.00,
    grandTotal: 1259577.00
  };

  const totalLineItems = categories.reduce((sum, cat) => sum + cat.items.length, 0);
  
  // Set first item as selected by default
  useEffect(() => {
    if (!selectedLineItem && categories[0]?.items[0]) {
      setSelectedLineItem(categories[0].items[0]);
    }
  }, []);

  const getStatusBadge = (status) => {
    const statusConfig = {
      'completed': { class: 'status-completed', label: 'Completed' },
      'in-progress': { class: 'status-in-progress', label: 'In Progress' },
      'pending': { class: 'status-pending', label: 'Pending' },
    };
    const config = statusConfig[status] || statusConfig['pending'];
    return <span className={`status-badge ${config.class}`}>{config.label}</span>;
  };

  return (
    <div className="pricing-layout-new">
      {/* Top Navigation Bar */}
      <div className="pricing-topnav-new">
        {/* Logo */}
        <div className="pricing-logo-new">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2.81" y="3.20" width="14" height="2.70" fill="#f97316"/>
            <rect x="2.81" y="9.55" width="14" height="2.73" fill="#16a34a"/>
            <rect x="0" y="6.35" width="8" height="2.74" fill="#eab308"/>
            <rect x="5.59" y="0" width="8" height="2.73" fill="#dc2626"/>
            <rect x="5.60" y="12.73" width="8" height="2.73" fill="#2563eb"/>
          </svg>
        </div>

        {/* Tabs */}
        <div className="pricing-topnav-tabs-new">
          <button className="pricing-tab-new">Takeoff</button>
          <button className="pricing-tab-new active">
            Pricing Sheet
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
            </svg>
          </button>
          <button className="pricing-tab-new">Proposal</button>
          <button className="pricing-tab-new">Presentation</button>
          <button className="pricing-tab-add-new" title="Add tab">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
            </svg>
          </button>
        </div>

        {/* Right Controls */}
        <div className="pricing-topnav-controls-new">
          {/* 9-dot Menu */}
          <div className="grid-menu-wrapper" ref={moduleMenuRef}>
            <button
              className="topnav-icon-btn-new"
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
              <div className="profile-dropdown-pricing">
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
      <div className="pricing-container-new">
        {/* Left Sidebar */}
        <div className="pricing-sidebar-left-new">
          {/* Header */}
          <div className="sidebar-header-new">
            <div className="sidebar-title-new">
              <h2>Pricing</h2>
              <span className="project-code">{projectDetails.code}</span>
            </div>
            <button className="btn-close-new">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
              </svg>
            </button>
          </div>

          {/* View Toggle */}
          <div className="view-toggle-new">
            <button 
              className={`toggle-btn ${activeView === 'pricing' ? 'active' : ''}`}
              onClick={() => setActiveView('pricing')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              Pricing
            </button>
            <button 
              className={`toggle-btn ${activeView === 'quotes' ? 'active' : ''}`}
              onClick={() => setActiveView('quotes')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              Quotes
              <span className="badge-count">3</span>
            </button>
          </div>

          {/* Search */}
          <div className="sidebar-search-new">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input 
              type="text"
              placeholder="Search line items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Project Details Section */}
          <div className="sidebar-section-new">
            <div className="section-label-new">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="9" y1="9" x2="15" y2="9"/>
                <line x1="9" y1="15" x2="15" y2="15"/>
              </svg>
              PROJECT DETAILS
            </div>
            <div className="project-card-new">
              <h3>{projectDetails.name}</h3>
              <div className="project-detail-row">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span>{projectDetails.location}</span>
              </div>
              <div className="project-detail-row">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
                <span>{projectDetails.bidDate}</span>
              </div>
              <div className="project-detail-row">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <span className="contact-small">{projectDetails.contact}</span>
              </div>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="cost-summary-new">
            <div className="summary-row-new">
              <span className="label-small">General Conditions</span>
              <span className="value-large">${totals.generalConditions.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="divider-thin"></div>
            <div className="summary-row-new">
              <span className="label-small">Line Items Subtotal</span>
              <span className="value-medium">${totals.lineItemsSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="divider-thin"></div>
            <div className="summary-row-new">
              <span className="label-small">Overhead (5%)</span>
              <span className="value-small">${totals.overhead.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="summary-row-new">
              <span className="label-small">Profit (30%)</span>
              <span className="value-small profit">${totals.profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="divider-thin"></div>
            <div className="summary-row-new">
              <span className="label-small">Grand Total</span>
              <span className="value-grand">${totals.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="sidebar-section-new">
            <div className="section-label-new small">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6"/>
              </svg>
              CATEGORY BREAKDOWN
            </div>
            <div className="category-breakdown-new">
              {categories.map(category => {
                const percentage = ((category.total / totals.lineItemsSubtotal) * 100).toFixed(1);
                return (
                  <div key={category.id} className="category-breakdown-card">
                    <div className="category-header-small">
                      <span className="category-name-small">{category.name}</span>
                      <span className="category-count">{category.items.length} items</span>
                    </div>
                    <div className="category-amount-row">
                      <span className="amount">${category.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      <span className="percentage">{percentage}%</span>
                    </div>
                    <div className="progress-bar-container">
                      <div className="progress-bar" style={{ width: `${percentage}%`, backgroundColor: category.color }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="quick-actions-new">
            <div className="section-label-new small">QUICK ACTIONS</div>
            <button className="action-btn-new">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Export to PDF
            </button>
            <button className="action-btn-new outline">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              Generate Proposal
            </button>
            <button className="action-btn-new outline">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              Send to Client
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="pricing-main-content-new">
          {/* Header */}
          <div className="content-header-new">
            <div className="header-left">
              <h2>Line Items</h2>
              <span className="item-count">{totalLineItems} items • Total: ${totals.lineItemsSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <button className="btn-filter-new">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
              </svg>
              Filter
            </button>
          </div>

          {/* Categories List */}
          <div className="categories-list-new">
            {categories.map(category => (
              <div key={category.id} className="category-card-new">
                {/* Category Header */}
                <div 
                  className="category-card-header"
                  onClick={() => category.items.length > 0 && toggleCategory(category.id)}
                  style={{ cursor: category.items.length > 0 ? 'pointer' : 'default' }}
                >
                  <div className="category-info">
                    <button className="expand-icon">
                      <svg 
                        width="20" height="20" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2.5"
                        style={{ 
                          transform: expandedCategories[category.id] ? 'rotate(90deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s'
                        }}
                      >
                        <polyline points="9 18 15 12 9 6"/>
                      </svg>
                    </button>
                    <div className="category-dot" style={{ backgroundColor: category.color }}></div>
                    <div className="category-text">
                      <h3 style={{ color: category.color }}>{category.name}</h3>
                      <span className="category-meta">{category.items.length} items • ${category.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                  {category.items.length > 0 && (
                    <div className="column-headers">
                      <span className="col-qty">QUANTITY</span>
                      <span className="col-unit">UNIT</span>
                      <span className="col-price">UNIT PRICE</span>
                      <span className="col-status">STATUS</span>
                      <span className="col-timeline">TIMELINE</span>
                      <span className="col-total">TOTAL</span>
                    </div>
                  )}
                </div>

                {/* Category Items */}
                {expandedCategories[category.id] && category.items.length > 0 && (
                  <div className="category-items">
                    {category.items.map(item => (
                      <div 
                        key={item.id} 
                        className={`line-item-row ${selectedLineItem?.id === item.id ? 'selected' : ''}`}
                        onClick={() => setSelectedLineItem(item)}
                      >
                        <div className="item-description">{item.description}</div>
                        <div className="item-quantity">{item.quantity}</div>
                        <div className="item-unit">{item.unit}</div>
                        <div className="item-price">${item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                        <div className="item-status">{getStatusBadge(item.status)}</div>
                        <div className="item-timeline">{item.timeline}</div>
                        <div className="item-total">${item.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                      </div>
                    ))}
                    <button className="add-item-btn">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                      Add Item
                    </button>
                  </div>
                )}
              </div>
            ))}

            {/* Summary Cards */}
            <div className="summary-cards-new">
              <div className="summary-card overhead">
                <div className="card-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                    <line x1="9" y1="9" x2="9.01" y2="9"/>
                    <line x1="15" y1="9" x2="15.01" y2="9"/>
                  </svg>
                  Overhead (5%)
                </div>
                <div className="card-amount">${totals.overhead.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              </div>

              <div className="summary-card profit">
                <div className="card-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                  Profit (30%)
                </div>
                <div className="card-amount">${totals.profit.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              </div>

              <div className="summary-card grand-total">
                <div className="card-header">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="1" x2="12" y2="23"/>
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                  Grand Total
                </div>
                <div className="card-amount">${totals.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar - Line Item Details */}
        <div className="pricing-sidebar-right-new">
          {selectedLineItem ? (
            <>
              {/* Header */}
              <div className="details-header-new">
                <h2>Line Item Details</h2>
                <span className="item-number">Item #{selectedLineItem.id}</span>
              </div>

              {/* Item Details */}
              <div className="item-details-new">
                <div className="detail-group">
                  <label>Description</label>
                  <p>{selectedLineItem.description}</p>
                </div>

                <div className="detail-row">
                  <div className="detail-group half">
                    <label>Category</label>
                    <span className="category-badge">
                      {categories.find(c => c.items.some(i => i.id === selectedLineItem.id))?.name || 'Design'}
                    </span>
                  </div>
                  <div className="detail-group half">
                    <label>Unit</label>
                    <p>{selectedLineItem.unit}</p>
                  </div>
                </div>

                <div className="detail-row">
                  <div className="detail-group half">
                    <label>Quantity</label>
                    <p className="value-large">{selectedLineItem.quantity}</p>
                  </div>
                  <div className="detail-group half">
                    <label>Unit Price</label>
                    <p className="value-large">${selectedLineItem.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                <div className="detail-group total-section">
                  <label>Line Total</label>
                  <p className="total-value">${selectedLineItem.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
              </div>

              {/* Calculation */}
              <div className="calculation-box">
                <h3>Calculation</h3>
                <div className="calc-formula">
                  {selectedLineItem.quantity} {selectedLineItem.unit} × ${selectedLineItem.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div className="calc-divider"></div>
                <div className="calc-result">
                  <span>Total</span>
                  <span>${selectedLineItem.total.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Project Contribution */}
              <div className="contribution-box">
                <h3>Project Contribution</h3>
                <div className="contribution-item">
                  <div className="contribution-row">
                    <span>% of Line Items</span>
                    <span className="percentage-value">{((selectedLineItem.total / totals.lineItemsSubtotal) * 100).toFixed(2)}%</span>
                  </div>
                  <div className="progress-bar-small">
                    <div className="progress-fill" style={{ width: `${(selectedLineItem.total / totals.lineItemsSubtotal) * 100}%`, backgroundColor: '#6b7280' }}></div>
                  </div>
                </div>
                <div className="contribution-item">
                  <div className="contribution-row">
                    <span>% of Grand Total</span>
                    <span className="percentage-value">{((selectedLineItem.total / totals.grandTotal) * 100).toFixed(2)}%</span>
                  </div>
                  <div className="progress-bar-small">
                    <div className="progress-fill" style={{ width: `${(selectedLineItem.total / totals.grandTotal) * 100}%`, backgroundColor: '#a855f7' }}></div>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div className="notes-box">
                <h3>Notes</h3>
                <textarea placeholder="Add notes for this line item..."></textarea>
              </div>

              {/* Edit Button */}
              <div className="details-footer">
                <button className="btn-edit-item">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit Line Item
                </button>
              </div>
            </>
          ) : (
            <div className="no-selection">
              <p>Select a line item to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PricingSheet;
