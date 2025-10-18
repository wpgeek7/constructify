import React from 'react';
import './PlaceholderPage.css';

const Scheduling = () => {
  return (
    <div className="placeholder-page">
      <div className="placeholder-content">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <h2>Scheduling</h2>
        <p>Manage work schedules and assignments</p>
        <button className="btn-coming-soon">Coming Soon</button>
      </div>
    </div>
  );
};

export default Scheduling;

