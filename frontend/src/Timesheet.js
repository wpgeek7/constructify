import React from 'react';
import './PlaceholderPage.css';

const Timesheet = () => {
  return (
    <div className="placeholder-page">
      <div className="placeholder-content">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
        <h2>Timesheet</h2>
        <p>Track and manage employee work hours</p>
        <button className="btn-coming-soon">Coming Soon</button>
      </div>
    </div>
  );
};

export default Timesheet;

