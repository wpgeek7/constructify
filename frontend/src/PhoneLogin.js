import React, { useState } from 'react';
import axios from 'axios';
import './PhoneLogin.css';

const PhoneLogin = ({ onLoginSuccess, onSwitchToSignup, onSwitchToEmail }) => {
  const [formData, setFormData] = useState({
    phone_number: '',
    phone_country_code: '+1',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);
  
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  // Country codes for popular countries
  const countryCodes = [
    { code: '+1', name: 'US/Canada', flag: '🇺🇸' },
    { code: '+44', name: 'UK', flag: '🇬🇧' },
    { code: '+91', name: 'India', flag: '🇮🇳' },
    { code: '+86', name: 'China', flag: '🇨🇳' },
    { code: '+81', name: 'Japan', flag: '🇯🇵' },
    { code: '+49', name: 'Germany', flag: '🇩🇪' },
    { code: '+33', name: 'France', flag: '🇫🇷' },
    { code: '+39', name: 'Italy', flag: '🇮🇹' },
    { code: '+61', name: 'Australia', flag: '🇦🇺' },
    { code: '+55', name: 'Brazil', flag: '🇧🇷' },
    { code: '+52', name: 'Mexico', flag: '🇲🇽' },
    { code: '+234', name: 'Nigeria', flag: '🇳🇬' },
    { code: '+254', name: 'Kenya', flag: '🇰🇪' },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // For phone number, only allow digits
    if (name === 'phone_number') {
      const cleaned = value.replace(/\D/g, '');
      setFormData(prev => ({
        ...prev,
        [name]: cleaned
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const formatPhoneNumber = (phone) => {
    // Format for display (US format)
    if (formData.phone_country_code === '+1' && phone.length === 10) {
      return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6)}`;
    }
    return phone;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setRequiresVerification(false);

    try {
      // Format phone number for API
      const fullPhoneNumber = formData.phone_country_code + formData.phone_number;
      
      const response = await axios.post(`${API_URL}/auth/phone/login`, {
        phone_number: fullPhoneNumber,
        password: formData.password
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.data.success) {
        // Store token in localStorage
        localStorage.setItem('auth_token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        
        // Call success handler
        onLoginSuccess(response.data.data);
      }
    } catch (error) {
      if (error.response?.data?.requires_verification) {
        // Phone not verified - show message
        setRequiresVerification(true);
        setErrors({ 
          general: error.response.data.message,
          verification_phone: error.response.data.phone_number
        });
      } else if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: error.response?.data?.message || 'Login failed. Please check your credentials.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!errors.verification_phone) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/auth/phone/resend-otp`, {
        phone_number: errors.verification_phone
      });
      
      if (response.data.success) {
        alert('OTP sent! Please check your phone and verify your number.');
      }
    } catch (error) {
      alert('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="phone-login-container">
      <div className="phone-login-box">
        <div className="phone-login-header">
          <h1>📱 Sign In with Phone</h1>
          <p>Enter your phone number and password to continue</p>
        </div>

        {errors.general && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <div>
              <p>{errors.general}</p>
              {requiresVerification && (
                <button 
                  onClick={handleResendOTP} 
                  className="resend-link"
                  disabled={loading}
                >
                  Resend OTP to verify now
                </button>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="phone-login-form">
          {/* Phone Number Field */}
          <div className="form-group">
            <label htmlFor="phone_number">
              📞 Phone Number *
            </label>
            <div className="phone-input-group">
              <select
                name="phone_country_code"
                value={formData.phone_country_code}
                onChange={handleChange}
                className="country-code-select"
                disabled={loading}
              >
                {countryCodes.map(country => (
                  <option key={country.code} value={country.code}>
                    {country.flag} {country.code}
                  </option>
                ))}
              </select>
              <input
                type="tel"
                id="phone_number"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                placeholder="1234567890"
                required
                disabled={loading}
                className={errors.phone_number ? 'error' : ''}
                maxLength="15"
              />
            </div>
            {formData.phone_number && (
              <div className="phone-preview">
                Preview: {formData.phone_country_code}{formData.phone_number}
              </div>
            )}
            {errors.phone_number && (
              <span className="error-text">{errors.phone_number}</span>
            )}
          </div>

          {/* Password Field */}
          <div className="form-group">
            <label htmlFor="password">
              🔒 Password *
            </label>
            <div className="password-input-group">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                disabled={loading}
                className={errors.password ? 'error' : ''}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="password-toggle"
                disabled={loading}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.password && (
              <span className="error-text">{errors.password}</span>
            )}
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="form-options">
            <label className="remember-me">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                disabled={loading}
              />
              <span>Remember me</span>
            </label>
            <a href="/forgot-password" className="forgot-password-link">
              Forgot password?
            </a>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="phone-login-button"
            disabled={loading || !formData.phone_number || !formData.password}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Signing in...
              </>
            ) : (
              <>
                <span>🚀</span>
                Sign In
              </>
            )}
          </button>

          {/* Alternative Login Options */}
          <div className="divider">
            <span>OR</span>
          </div>

          <button
            type="button"
            onClick={onSwitchToEmail}
            className="email-login-button"
            disabled={loading}
          >
            📧 Sign in with Email
          </button>

          {/* Sign Up Link */}
          <div className="signup-prompt">
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={onSwitchToSignup}
                className="signup-link"
                disabled={loading}
              >
                Sign Up
              </button>
            </p>
          </div>
        </form>

        {/* Help Text */}
        <div className="help-text">
          <p>
            💡 <strong>Tip:</strong> Make sure to enter your phone number without spaces or dashes.
          </p>
          <p>
            🔒 Your information is secure and encrypted.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PhoneLogin;

