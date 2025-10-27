import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EmailVerification.css';

const EmailVerification = ({ userData, onVerificationSuccess, onBack }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const [resendLoading, setResendLoading] = useState(false);
  
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleChange = (e) => {
    const value = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase(); // Only alphanumeric, max 6 characters
    setVerificationCode(value);
    if (errors.verification_code) {
      setErrors(prev => ({
        ...prev,
        verification_code: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const response = await axios.post(`${API_URL}/verify-email`, {
        email: userData.email,
        verification_code: verificationCode
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.data.success) {
        onVerificationSuccess(response.data.data);
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: error.response?.data?.message || 'Verification failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setErrors({});

    try {
      const response = await axios.post(`${API_URL}/register`, {
        fullname: userData.fullname,
        email: userData.email,
        password: userData.password,
        password_confirmation: userData.password_confirmation
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.data.success) {
        setTimeLeft(15 * 60); // Reset timer
        alert('New verification code sent to your email!');
      }
    } catch (error) {
      setErrors({ general: 'Failed to resend code. Please try again.' });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="verification-container">
      <div className="verification-left">
        <div className="logo">
          <div className="logo-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect x="4" y="8" width="8" height="8" fill="#FF6B35"/>
              <rect x="16" y="8" width="8" height="8" fill="#4ECDC4"/>
              <rect x="4" y="20" width="8" height="8" fill="#45B7D1"/>
              <rect x="16" y="20" width="8" height="8" fill="#96CEB4"/>
            </svg>
          </div>
          <span className="logo-text">constructify</span>
        </div>
        <div className="hero-image">
          <div className="construction-worker">
            <div className="hard-hat"></div>
            <div className="torch">
              <div className="flame"></div>
            </div>
          </div>
          <div className="crane-silhouette"></div>
        </div>
      </div>

      <div className="verification-right">
        <div className="verification-form-container">
          <h1 className="form-title">Verify your email</h1>
          <p className="form-subtitle">
            We've sent a 6-digit verification code to <strong>{userData.email}</strong>
          </p>

          <form onSubmit={handleSubmit} className="verification-form">
            {errors.general && (
              <div className="error-message general-error">
                {errors.general}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="verification_code">Verification Code</label>
              <input
                type="text"
                id="verification_code"
                name="verification_code"
                value={verificationCode}
                onChange={handleChange}
                className={errors.verification_code ? 'error' : ''}
                placeholder="Enter 6-character code"
                maxLength="6"
                required
                autoComplete="off"
                style={{ textTransform: 'uppercase' }}
              />
              {errors.verification_code && (
                <span className="error-message">{errors.verification_code[0]}</span>
              )}
            </div>

            <button 
              type="submit" 
              className="verify-btn"
              disabled={loading || verificationCode.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>

          <div className="timer-section">
            <p className="timer-text">
              Code expires in: <span className="timer">{formatTime(timeLeft)}</span>
            </p>
            {timeLeft === 0 && (
              <p className="expired-text">Code has expired</p>
            )}
          </div>

          <div className="resend-section">
            <p className="resend-text">Didn't receive the code?</p>
            <button 
              className="resend-btn"
              onClick={handleResendCode}
              disabled={resendLoading || timeLeft > 0}
            >
              {resendLoading ? 'Sending...' : 'Resend Code'}
            </button>
          </div>

          <div className="back-link">
            <button className="back-btn" onClick={onBack}>
              ← Back to Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
