import React, { useState } from 'react';
import axios from 'axios';
import './ForgotPassword.css';

const ForgotPassword = ({ onBackToLogin, onResetCodeSent }) => {
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) {
      setErrors({});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const response = await axios.post('http://localhost:8000/api/forgot-password', {
        email: email
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.data.success) {
        // Pass email and expiration to reset password step
        onResetCodeSent({
          email: email,
          expires_at: response.data.data.expires_at
        });
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: error.response?.data?.message || 'Failed to send reset code. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-container">
      <div className="forgot-password-left">
        <div className="logo">
          <img src="/Profile.png" alt="Constructify" className="logo-image" />
        </div>
        <div className="hero-image">
          <img src="/construction-worker.jpg" alt="Construction Worker" className="construction-image" />
        </div>
      </div>

      <div className="forgot-password-right">
        <div className="forgot-password-form-container">
          <h1 className="form-title">Forgot Password?</h1>
          <p className="form-subtitle">Enter your email address and we'll send you a code to reset your password.</p>
          
          <form onSubmit={handleSubmit} className="forgot-password-form">
            {errors.general && (
              <div className="error-message general-error">
                {errors.general}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
                placeholder="your@email.com"
                required
              />
              {errors.email && (
                <span className="error-message">{errors.email[0]}</span>
              )}
            </div>

            <button 
              type="submit" 
              className="submit-btn"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>

          <div className="back-to-login">
            <a href="#login" onClick={(e) => { e.preventDefault(); onBackToLogin && onBackToLogin(); }}>
              ← Back to Login
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

