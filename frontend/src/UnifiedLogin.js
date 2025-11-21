import React, { useState } from 'react';
import axios from 'axios';
import './UnifiedLogin.css';

const UnifiedLogin = ({ onLoginSuccess, onSwitchToSignup }) => {
  const [loginMethod, setLoginMethod] = useState('phone'); // 'phone' or 'email'
  const [step, setStep] = useState('input'); // 'input', 'otp', or 'password'
  const [otpData, setOtpData] = useState({
    phone_number: '',
    otp: '',
    expires_at: null
  });
  const [formData, setFormData] = useState({
    phone_number: '',
    phone_country_code: '+1',
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  const countryCodes = [
    { code: '+1', name: 'US/Canada', flag: '🇺🇸' },
    { code: '+44', name: 'UK', flag: '🇬🇧' },
    { code: '+91', name: 'India', flag: '🇮🇳' },
    { code: '+86', name: 'China', flag: '🇨🇳' },
    { code: '+81', name: 'Japan', flag: '🇯🇵' },
    { code: '+49', name: 'Germany', flag: '🇩🇪' },
    { code: '+33', name: 'France', flag: '🇫🇷' },
    { code: '+61', name: 'Australia', flag: '🇦🇺' },
    { code: '+55', name: 'Brazil', flag: '🇧🇷' },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'phone_number') {
      const cleaned = value.replace(/\D/g, '');
      setFormData(prev => ({ ...prev, [name]: cleaned }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const formatPhoneDisplay = (phone) => {
    if (!phone) return '';
    if (formData.phone_country_code === '+1' && phone.length === 10) {
      return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
    }
    return phone;
  };

  const handleContinue = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    
    if (loginMethod === 'phone') {
      if (!formData.phone_number) {
        setErrors({ phone_number: 'Please enter your phone number' });
        setLoading(false);
        return;
      }

      try {
        // Send OTP to phone number for login
        const fullPhone = formData.phone_country_code + formData.phone_number;
        const response = await axios.post(`${API_URL}/auth/phone/send-login-otp`, {
          phone_number: fullPhone
        }, {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });

        if (response.data.success) {
          setOtpData({
            phone_number: fullPhone,
            otp: response.data.data?.otp || '', // Dev mode OTP
            expires_at: response.data.data?.expires_at
          });
          setStep('otp');
        }
      } catch (error) {
        if (error.response?.data?.errors) {
          setErrors(error.response.data.errors);
        } else {
          setErrors({ 
            general: error.response?.data?.message || 'Failed to send OTP. Please try again.' 
          });
        }
      } finally {
        setLoading(false);
      }
    } else {
      // Email login - go to password
      if (!formData.email) {
        setErrors({ email: 'Please enter your email' });
        setLoading(false);
        return;
      }
      setStep('password');
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const endpoint = loginMethod === 'phone' ? '/auth/phone/login' : '/login';
      const payload = loginMethod === 'phone'
        ? {
            phone_number: formData.phone_country_code + formData.phone_number,
            password: formData.password
          }
        : {
            email: formData.email,
            password: formData.password
          };

      const response = await axios.post(`${API_URL}${endpoint}`, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.data.success) {
        localStorage.setItem('auth_token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        onLoginSuccess(response.data.data);
      }
    } catch (error) {
      if (error.response?.data?.requires_verification) {
        setErrors({ 
          general: 'Please verify your phone number first. Check your SMS for OTP code.'
        });
      } else if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ 
          general: error.response?.data?.message || 'Login failed. Please check your credentials.' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    // Google login implementation
    alert('Google login - implement with your Google OAuth');
  };

  const handleBack = () => {
    setStep('input');
    setErrors({});
    setOtpData({ phone_number: '', otp: '', expires_at: null });
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtpData(prev => ({ ...prev, otp: value }));
    if (errors.otp) {
      setErrors(prev => ({ ...prev, otp: '' }));
    }
  };

  const handleVerifyOtp = async (e) => {
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
        localStorage.setItem('auth_token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.user));
        onLoginSuccess(response.data.data);
      }
    } catch (error) {
      if (error.response?.data?.message) {
        setErrors({ otp: error.response.data.message });
      } else {
        setErrors({ otp: 'Invalid or expired OTP. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    setErrors({});

    try {
      const response = await axios.post(`${API_URL}/auth/phone/resend-otp`, {
        phone_number: otpData.phone_number
      });
      
      if (response.data.success) {
        setOtpData(prev => ({
          ...prev,
          otp: response.data.data?.otp || '',
          expires_at: response.data.data?.expires_at
        }));
        alert('✅ New OTP sent to your phone!');
      }
    } catch (error) {
      setErrors({ otp: 'Failed to resend OTP. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Phone/Email Input
  if (step === 'input') {
    return (
      <div className="unified-login-container">
        <div className="unified-login-box">
          <div className="login-header">
            <div className="logo-section">
              <img src="/Profile.png" alt="Constructify" className="app-logo" />
              <h1 className="app-name">constructefy</h1>
            </div>
          </div>

          <div className="login-content">
            <h2 className="login-title">
              {loginMethod === 'phone' ? 'Enter your phone number' : 'Enter your email'}
            </h2>
            <p className="login-subtitle">
              {loginMethod === 'phone' 
                ? 'Enter your phone number to receive an OTP for verification purposes.'
                : 'Enter your email address to continue.'
              }
            </p>

            <form onSubmit={handleContinue} className="login-form">
              {errors.general && (
                <div className="error-message">{errors.general}</div>
              )}

              {loginMethod === 'phone' ? (
                <div className="form-group">
                  <label>Phone Number</label>
                  <div className="phone-input-wrapper">
                    <select
                      name="phone_country_code"
                      value={formData.phone_country_code}
                      onChange={handleChange}
                      className="country-select"
                    >
                      {countryCodes.map(country => (
                        <option key={country.code} value={country.code}>
                          {country.flag} {country.code}
                        </option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      name="phone_number"
                      value={formatPhoneDisplay(formData.phone_number)}
                      onChange={handleChange}
                      placeholder="123-456-7890"
                      className={`phone-input ${errors.phone_number ? 'error' : ''}`}
                    />
                  </div>
                  {errors.phone_number && (
                    <span className="error-text">{errors.phone_number}</span>
                  )}
                </div>
              ) : (
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className={`email-input ${errors.email ? 'error' : ''}`}
                  />
                  {errors.email && (
                    <span className="error-text">{errors.email}</span>
                  )}
                </div>
              )}

              <button type="submit" className="continue-btn">
                Continue
              </button>
            </form>

            <div className="divider">
              <span>or sign up with</span>
            </div>

            <div className="social-login">
              <button className="social-btn" onClick={handleGoogleLogin}>
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              </button>
              <button className="social-btn">
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              </button>
              <button className="social-btn">
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
              <button className="social-btn">
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <circle fill="#EA4335" cx="12" cy="12" r="10"/>
                  <path fill="#FFF" d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm0 8c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/>
                </svg>
              </button>
              <button className="social-btn">
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path fill="#00B4FF" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </button>
            </div>

            <div className="switch-method">
              <button
                type="button"
                onClick={() => setLoginMethod(loginMethod === 'phone' ? 'email' : 'phone')}
                className="switch-link"
              >
                {loginMethod === 'phone' ? '📧 Use Email Instead' : '📱 Use Phone Instead'}
              </button>
            </div>

            <div className="signup-link">
              Don't have an account? <button onClick={onSwitchToSignup} className="link-btn">Sign Up</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: OTP Verification (for phone login)
  if (step === 'otp') {
    return (
      <div className="unified-login-container">
        <div className="unified-login-box">
          <div className="login-header">
            <button className="back-btn" onClick={handleBack}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="logo-section">
              <img src="/Profile.png" alt="Constructify" className="app-logo" />
              <h1 className="app-name">constructefy</h1>
            </div>
          </div>

          <div className="login-content">
            <h2 className="login-title">Enter verification code</h2>
            <p className="login-subtitle">
              We've sent a 6-digit OTP to {otpData.phone_number}
            </p>

            {otpData.otp && (
              <div className="dev-mode-notice">
                🔧 <strong>Development Mode OTP:</strong> {otpData.otp}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="login-form">
              {errors.general && (
                <div className="error-message">{errors.general}</div>
              )}
              {errors.otp && (
                <div className="error-message">{errors.otp}</div>
              )}

              <div className="form-group">
                <label>Verification Code</label>
                <input
                  type="text"
                  value={otpData.otp}
                  onChange={handleOtpChange}
                  placeholder="000000"
                  className={`otp-input ${errors.otp ? 'error' : ''}`}
                  maxLength="6"
                  autoFocus
                />
                <p className="input-hint">Enter the 6-digit code sent to your phone</p>
              </div>

              <button type="submit" className="continue-btn" disabled={loading || otpData.otp.length !== 6}>
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>
            </form>

            <div className="resend-section">
              <p>Didn't receive the code?</p>
              <button type="button" onClick={handleResendOtp} className="resend-btn" disabled={loading}>
                Resend Code
              </button>
            </div>

            <div className="signup-link">
              Don't have an account? <button onClick={onSwitchToSignup} className="link-btn">Sign Up</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Password Input (for email login)
  if (step === 'password') {
    return (
      <div className="unified-login-container">
        <div className="unified-login-box">
          <div className="login-header">
            <button className="back-btn" onClick={handleBack}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <div className="logo-section">
              <img src="/Profile.png" alt="Constructify" className="app-logo" />
              <h1 className="app-name">constructefy</h1>
            </div>
          </div>

          <div className="login-content">
            <h2 className="login-title">Enter your password</h2>
            <p className="login-subtitle">
              Logging in as {formData.email}
            </p>

          <form onSubmit={handleLogin} className="login-form">
            {errors.general && (
              <div className="error-message">{errors.general}</div>
            )}

            <div className="form-group">
              <label>Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={`password-input ${errors.password ? 'error' : ''}`}
                  required
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {errors.password && (
                <span className="error-text">{errors.password}</span>
              )}
            </div>

            <div className="form-options">
              <label className="remember-checkbox">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <span>Remember me</span>
              </label>
              <button type="button" className="forgot-link">
                Forgot password?
              </button>
            </div>

            <button type="submit" className="continue-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="signup-link">
            Don't have an account? <button onClick={onSwitchToSignup} className="link-btn">Sign Up</button>
          </div>
        </div>
      </div>
    </div>
  );
  }

  return null;
};

export default UnifiedLogin;

