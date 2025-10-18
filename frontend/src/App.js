import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Login from './Login';
import Signup from './Signup';
import EmailVerification from './EmailVerification';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import Header from './Header';
import Sidebar from './Sidebar';
import Profile from './Profile';
import Employees from './Employees';
import Roles from './Roles';
import Jobs from './Jobs';
import WorkerDashboard from './WorkerDashboard';
import Timesheet from './Timesheet';
import Scheduling from './Scheduling';
import Reports from './Reports';
import './App.css';

const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '641924991963-vbpberb599gec6d2kuath2m3hmdr1792.apps.googleusercontent.com';

function App() {
  const [currentStep, setCurrentStep] = useState('login');
  const [userData, setUserData] = useState(null);
  const [authData, setAuthData] = useState(null);
  const [resetData, setResetData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('employees'); // Dashboard tab state
  const [showProfile, setShowProfile] = useState(false);

  // Check for existing authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      try {
        const parsedUser = JSON.parse(user);
        setAuthData({
          user: parsedUser,
          token: token
        });
        setCurrentStep('dashboard');
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);
  }, []);

  const handleLoginSuccess = (data) => {
    setAuthData(data);
    setCurrentStep('dashboard');
  };

  const handleSignupSuccess = (data) => {
    setUserData(data);
    setCurrentStep('verification');
  };

  const handleVerificationSuccess = (data) => {
    setAuthData(data);
    setCurrentStep('dashboard');
  };

  const handleBackToSignup = () => {
    setCurrentStep('signup');
    setUserData(null);
  };

  const handleResetCodeSent = (data) => {
    setResetData(data);
    setCurrentStep('resetPassword');
  };

  const handleResetSuccess = () => {
    setResetData(null);
    setCurrentStep('login');
  };

  const handleGoogleSuccess = (data) => {
    setAuthData(data);
    setCurrentStep('dashboard');
  };

  const handleShowProfile = () => {
    setShowProfile(true);
  };

  const handleCloseProfile = () => {
    setShowProfile(false);
  };

  const handleUpdateUser = (updatedUser) => {
    setAuthData(prev => ({
      ...prev,
      user: updatedUser
    }));
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'login':
        return (
          <Login 
            onLoginSuccess={handleLoginSuccess}
            onGoogleSuccess={handleGoogleSuccess}
            onSwitchToSignup={() => setCurrentStep('signup')}
            onForgotPassword={() => setCurrentStep('forgotPassword')}
          />
        );
      case 'signup':
        return (
          <Signup 
            onSignupSuccess={handleSignupSuccess}
            onGoogleSuccess={handleGoogleSuccess}
            onSwitchToLogin={() => setCurrentStep('login')}
          />
        );
      case 'verification':
        return (
          <EmailVerification 
            userData={userData}
            onVerificationSuccess={handleVerificationSuccess}
            onBack={handleBackToSignup}
          />
        );
      case 'forgotPassword':
        return (
          <ForgotPassword 
            onBackToLogin={() => setCurrentStep('login')}
            onResetCodeSent={handleResetCodeSent}
          />
        );
      case 'resetPassword':
        return (
          <ResetPassword 
            resetData={resetData}
            onResetSuccess={handleResetSuccess}
            onBackToLogin={() => setCurrentStep('login')}
          />
        );
      case 'dashboard':
        // Employee Dashboard (Worker View)
        if (authData.user.role === 'employee') {
          return (
            <>
              <Header 
                user={authData.user}
                onShowProfile={handleShowProfile}
                onLogout={() => {
                  localStorage.removeItem('auth_token');
                  localStorage.removeItem('user');
                  setCurrentStep('login');
                  setUserData(null);
                  setAuthData(null);
                }}
              />
              <div className="dashboard-layout">
                <div className="dashboard-main full-width">
                  <WorkerDashboard />
                </div>
              </div>
              {showProfile && (
                <Profile 
                  user={authData.user}
                  onClose={handleCloseProfile}
                  onUpdateUser={handleUpdateUser}
                />
              )}
            </>
          );
        }

        // Admin Dashboard
        return (
          <>
            <Header 
              user={authData.user}
              onShowProfile={handleShowProfile}
              onLogout={() => {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
                setCurrentStep('login');
                setUserData(null);
                setAuthData(null);
              }}
            />
            <div className="dashboard-layout">
              <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
              <div className="dashboard-main">
                {activeTab === 'timesheet' && <Timesheet />}
                {activeTab === 'employees' && <Employees />}
                {activeTab === 'roles' && <Roles />}
                {activeTab === 'jobs' && <Jobs />}
                {activeTab === 'scheduling' && <Scheduling />}
                {activeTab === 'reports' && <Reports />}
              </div>
            </div>
            {showProfile && (
              <Profile 
                user={authData.user}
                onClose={handleCloseProfile}
                onUpdateUser={handleUpdateUser}
              />
            )}
          </>
        );
      default:
        return (
          <Login 
            onLoginSuccess={handleLoginSuccess}
            onGoogleSuccess={handleGoogleSuccess}
            onSwitchToSignup={() => setCurrentStep('signup')}
            onForgotPassword={() => setCurrentStep('forgotPassword')}
          />
        );
    }
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="App" style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f5f7fa 0%, #e8eef5 100%)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #FF6B35',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 20px'
          }}></div>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <div className="App">
        {renderCurrentStep()}
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
