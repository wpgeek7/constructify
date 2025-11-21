import React, { useState } from 'react';
import axios from 'axios';
import './PhoneSignup.css';

const PhoneSignup = ({ onSignupSuccess, onSwitchToLogin, onSwitchToEmail }) => {
  const [step, setStep] = useState(1); // 1: Registration, 2: OTP Verification
  const [formData, setFormData] = useState({
    fullname: '',
    phone_number: '',
    phone_country_code: '+1',
    password: '',
    password_confirmation: ''
  });
  const [otpData, setOtpData] = useState({
    phone_number: '',
    otp: '',
    expires_at: null
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  // Country codes
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
    const { name, value } = e.target;
    
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
        [name]: value
      }));
    }
    
    // Check password strength
    if (name === 'password') {
      calculatePasswordStrength(value);
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 25;
    if (/\d/.test(password)) strength += 12.5;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength += 12.5;
    setPasswordStrength(Math.min(100, strength));
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return '#f44336';
    if (passwordStrength < 50) return '#ff9800';
    if (passwordStrength < 75) return '#ffc107';
    return '#4caf50';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return 'Weak';
    if (passwordStrength < 50) return 'Fair';
    if (passwordStrength < 75) return 'Good';
    return 'Strong';
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtpData(prev => ({
      ...prev,
      otp: value
    }));
    if (errors.otp) {
      setErrors(prev => ({ ...prev, otp: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Format phone number for API
      const fullPhoneNumber = formData.phone_country_code + formData.phone_number;
      
      const response = await axios.post(`${API_URL}/auth/phone/register`, {
        fullname: formData.fullname,
        phone_number: formData.phone_number,
        phone_country_code: formData.phone_country_code,
        password: formData.password,
        password_confirmation: formData.password_confirmation
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.data.success) {
        // Move to OTP verification step
        setOtpData({
          phone_number: response.data.data.phone_number,
          otp: response.data.data.otp || '', // For dev mode
          expires_at: response.data.data.expires_at
        });
        setStep(2);
      }
    } catch (error) {
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: error.response?.data?.message || 'Registration failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const response = await axios.post(`${API_URL}/auth/phone/verify`, {
        phone_number: otpData.phone_number,
        otp: otpData.otp
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
        onSignupSuccess(response.data.data);
      }
    } catch (error) {
      if (error.response?.data?.message) {
        setErrors({ otp: error.response.data.message });
      } else {
        setErrors({ otp: 'Verification failed. Please check your OTP.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setErrors({});

    try {
      const response = await axios.post(`${API_URL}/auth/phone/resend-otp`, {
        phone_number: otpData.phone_number
      });
      
      if (response.data.success) {
        setOtpData(prev => ({
          ...prev,
          otp: response.data.data.otp || '', // For dev mode
          expires_at: response.data.data.expires_at
        }));
        alert('✅ OTP resent successfully! Check your phone.');
      }
    } catch (error) {
      setErrors({ otp: 'Failed to resend OTP. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const togglePasswordConfirmVisibility = () => {
    setShowPasswordConfirm(!showPasswordConfirm);
  };

  // Registration Form (Step 1)
  if (step === 1) {
    return (
      <div className="phone-signup-container">
        <div className="phone-signup-box">
          <div className="phone-signup-header">
            <h1>📱 Create Account</h1>
            <p>Sign up with your phone number</p>
          </div>

          {errors.general && (
            <div className="error-banner">
              <span className="error-icon">⚠️</span>
              <p>{errors.general}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="phone-signup-form">
            {/* Full Name */}
            <div className="form-group">
              <label htmlFor="fullname">
                👤 Full Name *
              </label>
              <input
                type="text"
                id="fullname"
                name="fullname"
                value={formData.fullname}
                onChange={handleChange}
                placeholder="John Doe"
                required
                disabled={loading}
                className={errors.fullname ? 'error' : ''}
              />
              {errors.fullname && (
                <span className="error-text">{errors.fullname}</span>
              )}
            </div>

            {/* Phone Number */}
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

            {/* Password */}
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
                  placeholder="Minimum 8 characters"
                  required
                  disabled={loading}
                  className={errors.password ? 'error' : ''}
                  minLength="8"
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
              {formData.password && (
                <div className="password-strength">
                  <div className="password-strength-bar">
                    <div 
                      className="password-strength-fill"
                      style={{ 
                        width: `${passwordStrength}%`,
                        backgroundColor: getPasswordStrengthColor()
                      }}
                    ></div>
                  </div>
                  <span style={{ color: getPasswordStrengthColor() }}>
                    {getPasswordStrengthText()}
                  </span>
                </div>
              )}
              {errors.password && (
                <span className="error-text">{errors.password}</span>
              )}
            </div>

            {/* Confirm Password */}
            <div className="form-group">
              <label htmlFor="password_confirmation">
                🔒 Confirm Password *
              </label>
              <div className="password-input-group">
                <input
                  type={showPasswordConfirm ? 'text' : 'password'}
                  id="password_confirmation"
                  name="password_confirmation"
                  value={formData.password_confirmation}
                  onChange={handleChange}
                  placeholder="Re-enter your password"
                  required
                  disabled={loading}
                  className={errors.password_confirmation ? 'error' : ''}
                />
                <button
                  type="button"
                  onClick={togglePasswordConfirmVisibility}
                  className="password-toggle"
                  disabled={loading}
                >
                  {showPasswordConfirm ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {formData.password && formData.password_confirmation && (
                <div className="password-match">
                  {formData.password === formData.password_confirmation ? (
                    <span className="match-success">✅ Passwords match</span>
                  ) : (
                    <span className="match-error">❌ Passwords don't match</span>
                  )}
                </div>
              )}
              {errors.password_confirmation && (
                <span className="error-text">{errors.password_confirmation}</span>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="phone-signup-button"
              disabled={loading || !formData.fullname || !formData.phone_number || !formData.password || formData.password !== formData.password_confirmation}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Creating Account...
                </>
              ) : (
                <>
                  <span>🚀</span>
                  Create Account
                </>
              )}
            </button>

            {/* Alternative Options */}
            <div className="divider">
              <span>OR</span>
            </div>

            <button
              type="button"
              onClick={onSwitchToEmail}
              className="email-signup-button"
              disabled={loading}
            >
              📧 Sign up with Email
            </button>

            {/* Login Link */}
            <div className="login-prompt">
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="login-link"
                  disabled={loading}
                >
                  Sign In
                </button>
              </p>
            </div>
          </form>

          {/* Help Text */}
          <div className="help-text">
            <p>
              📱 You'll receive a verification code via SMS
            </p>
            <p>
              🔒 Your information is secure and encrypted
            </p>
          </div>
        </div>
      </div>
    );
  }

  // OTP Verification Form (Step 2)
  return (
    <div className="phone-signup-container">
      <div className="phone-signup-box otp-verification-box">
        <div className="phone-signup-header">
          <h1>✉️ Verify Your Phone</h1>
          <p>Enter the 6-digit code sent to</p>
          <p className="phone-display">{otpData.phone_number}</p>
        </div>

        {errors.otp && (
          <div className="error-banner">
            <span className="error-icon">⚠️</span>
            <p>{errors.otp}</p>
          </div>
        )}

        {otpData.otp && (
          <div className="dev-mode-otp">
            <p>🔧 <strong>Development Mode OTP:</strong> {otpData.otp}</p>
          </div>
        )}

        <form onSubmit={handleVerifyOTP} className="otp-form">
          <div className="form-group">
            <label htmlFor="otp">
              🔢 Verification Code
            </label>
            <input
              type="text"
              id="otp"
              name="otp"
              value={otpData.otp}
              onChange={handleOtpChange}
              placeholder="000000"
              required
              disabled={loading}
              className={`otp-input ${errors.otp ? 'error' : ''}`}
              maxLength="6"
              pattern="\d{6}"
              autoFocus
            />
            <p className="otp-hint">Enter the 6-digit code from your SMS</p>
          </div>

          <button
            type="submit"
            className="verify-button"
            disabled={loading || otpData.otp.length !== 6}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Verifying...
              </>
            ) : (
              <>
                <span>✅</span>
                Verify & Continue
              </>
            )}
          </button>

          <div className="resend-section">
            <p>Didn't receive the code?</p>
            <button
              type="button"
              onClick={handleResendOTP}
              className="resend-button"
              disabled={loading}
            >
              📤 Resend OTP
            </button>
          </div>

          <button
            type="button"
            onClick={() => setStep(1)}
            className="back-button"
            disabled={loading}
          >
            ← Back to Registration
          </button>
        </form>

        <div className="help-text">
          <p>💡 <strong>Tip:</strong> Check your spam folder if you don't see the message</p>
          <p>⏰ OTP expires in 10 minutes</p>
        </div>
      </div>
    </div>
  );
};

export default PhoneSignup;

