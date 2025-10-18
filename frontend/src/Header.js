import React, { useState, useRef, useEffect } from 'react';
import './Header.css';

const Header = ({ user, onLogout, onShowProfile }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleProfileClick = () => {
    setShowDropdown(false);
    onShowProfile();
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="logo">
          <img src="/Profile.png" alt="Constructify" className="logo-image" />
          <span className="logo-text">
            <strong>constructefy</strong> | Manpower
          </span>
        </div>

        <div className="header-right">
          {user && (
            <>
              <button className="grid-menu-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                </svg>
              </button>
              <div className="user-info-wrapper" ref={dropdownRef}>
                <div 
                  className="user-info" 
                  onClick={() => setShowDropdown(!showDropdown)}
                  title="Profile"
                >
                  <div className="user-avatar">
                    {user.fullname?.charAt(0).toUpperCase()}
                  </div>
                </div>
                
                {showDropdown && (
                  <div className="profile-dropdown">
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
                    <button className="profile-dropdown-item" onClick={handleProfileClick}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      <span>View Profile</span>
                    </button>
                    <button className="profile-dropdown-item logout-item" onClick={onLogout}>
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
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

