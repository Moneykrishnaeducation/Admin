// react-router-dom import added to support navigate
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

// Ensure axios sends cookies for CSRF-protected endpoints
axios.defaults.withCredentials = true;
// Let axios automatically read csrftoken cookie into header for same-origin requests
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';

// Small helper to read a cookie value (used for CSRF token)
function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)'));
  return match ? decodeURIComponent(match.pop()) : '';
}

// Helper to set a cookie value
function setCookie(name, value, days = 7) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

// Helper to get user data from cookies
function getUserFromCookies() {
  const userCookie = getCookie('user');
  return userCookie ? JSON.parse(userCookie) : {};
}

// Ensure a CSRF cookie is present. Try a set of common endpoints to trigger the server
// to set a `csrftoken` cookie. This is best-effort — if your backend exposes a
// dedicated csrf endpoint (e.g. `/api/get-csrf/`) prefer that and update the list.
async function ensureCsrf(baseUrl) {
  if (getCookie('csrftoken')) return;
  const endpoints = [
    '/api/csrf/'
  ];

  for (const ep of endpoints) {
    try {
      // send a GET to attempt to receive a Set-Cookie: csrftoken
      const res = await axios.get(`${baseUrl}${ep}`, { withCredentials: true });
    } catch (e) {
      // ignore errors — some endpoints may 404
    }
    if (getCookie('csrftoken')) return;
  }
}

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [verificationRequired, setVerificationRequired] = useState(false);

  // verification modal state
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpExpiry, setOtpExpiry] = useState(60);
  const [verificationError, setVerificationError] = useState('');
  const [loading, setLoading] = useState(false);
  const [signInEmail, setSignInEmail] = useState('');

  // Forgot password state
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] = useState(0); // 0: send OTP, 1: verify OTP, 2: reset password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotNewPasswordConfirm, setForgotNewPasswordConfirm] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotOtpExpiry, setForgotOtpExpiry] = useState(60);

  const navigate = useNavigate();

  // Toast notifications state
  const [toasts, setToasts] = useState([]);

  const showToast = (type, message, timeout = 4000) => {
    if (!message) return;
    const id = Date.now() + Math.random();
    setToasts((t) => [{ id, type, message }, ...t]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, timeout);
  };

  // Navigate after a short delay so toasts can be seen before route change
  const navigateAfterDelay = (path, delay = 700) => {
    setTimeout(() => {
      navigate(path);
    }, delay);
  };


    // Helper to handle login response
    // Note: Tokens are now stored in HttpOnly cookies by the backend
    // Frontend should NOT try to read or store JWT tokens
    function saveAuthData(data) {
      if (!data || typeof window === 'undefined') return;

      // NOTE: Access and refresh tokens are now in HttpOnly cookies set by backend
      // Do NOT store them in localStorage anymore

      // Store user info for display purposes (these came from non-HttpOnly cookies or response)
      // This is for UI purposes only, not for authentication
      const respUser = { ...(data.user || {}) };

      // Merge role if provided
      respUser.role = respUser.role || data.role || data.userRole || data.user_role;
      if (data.name && !respUser.name) respUser.name = data.name;
      if (data.email && !respUser.email) respUser.email = data.email;

      // Save to cookies only
      setCookie('user', JSON.stringify(respUser));

      // Store some alternate flat keys for older code paths (UI display only)
      if (respUser.email) {
        setCookie('userEmail', respUser.email);
      }
      if (respUser.name) {
        setCookie('userName', respUser.name);
      }
      if (respUser.role) {
        setCookie('userRole', respUser.role);
        setCookie('user_role', respUser.role);
      }

      // Store optional theme preference if provided
      if (data.themeMode) setCookie('themeMode', data.themeMode);
    }

    useEffect(() => {
      if (!showVerificationModal) return;
      setOtpExpiry(60);
      const t = setInterval(() => {
        setOtpExpiry((v) => {
          if (v <= 1) {
            clearInterval(t);
            return 0;
          }
          return v - 1;
        });
      }, 1000);
      return () => clearInterval(t);
    }, [showVerificationModal]);

    // Ensure CSRF cookie is present on mount and attach a request interceptor
    useEffect(() => {
      const apiBaseUrl = `${window.location.protocol}//${window.location.host}`;
      // set base URL and ensure cookies are sent
      axios.defaults.withCredentials = true;
      axios.defaults.baseURL = apiBaseUrl;

      // Interceptor adds X-CSRFToken header for state-changing requests
      const interceptor = axios.interceptors.request.use(
        (config) => {
          const method = (config.method || '').toLowerCase();
          if (['post', 'put', 'patch', 'delete'].includes(method)) {
            const token = getCookie(axios.defaults.xsrfCookieName || 'csrftoken');
            if (token) {
              config.headers = { ...(config.headers || {}), [axios.defaults.xsrfHeaderName || 'X-CSRFToken']: token };
            } else {
              // Try to obtain a csrf cookie if missing
              ensureCsrf(apiBaseUrl).catch(() => {});
            }
          }
          return config;
        },
        (err) => Promise.reject(err)
      );

      // Prime CSRF cookie once on mount
      ensureCsrf(apiBaseUrl).catch(() => {});

      return () => axios.interceptors.request.eject(interceptor);
    }, []);


    const handleSubmit = async (e) => {
      e.preventDefault();
      setIsLoading(true);
      setErrorMessage('');
      setVerificationRequired(false);

      try {
        const apiBaseUrl = `${window.location.protocol}//${window.location.host}`;
        await ensureCsrf(apiBaseUrl);
        const response = await axios.post(
          `${apiBaseUrl}/api/login/`,
          { email, password },
          { headers: { 'X-CSRFToken': getCookie('csrftoken') }, withCredentials: true }
        );

        if (response.data.verification_required) {
          setVerificationRequired(true);
          setErrorMessage(response.data.message || 'Verification required');
          setSignInEmail(email);
          setShowVerificationModal(true);
        } else {
          saveAuthData(response.data);
          showToast('success', response.data.message || 'Signed in successfully');
          const userData = getUserFromCookies();
          const role = userData?.role || 'manager';
          navigateAfterDelay(role === 'admin' ? '/dashboard' : '/manager/dashboard');
        }
      } catch (error) {
        const msg = error.response?.data?.error || 'Something went wrong.';
        setErrorMessage(msg);
        showToast('error', msg);
      } finally {
        setIsLoading(false);
      }
    };

    const handleVerifyLoginOtp = async () => {
      try {
        setLoading(true);
        setVerificationError('');
        const apiBaseUrl = `${window.location.protocol}//${window.location.host}`;
        await ensureCsrf(apiBaseUrl);
        const response = await axios.post(
          `${apiBaseUrl}/api/verify-otp/`,
          { email: signInEmail, otp: verificationCode },
          { headers: { 'X-CSRFToken': getCookie('csrftoken') }, withCredentials: true }
        );

        if (response.data?.access && response.data?.refresh) {
          saveAuthData(response.data);
          setShowVerificationModal(false);
          showToast('success', response.data.message || 'Verified — signing in');
          const userData = getUserFromCookies();
          const role = userData?.role || 'manager';
          navigateAfterDelay(role === 'admin' ? '/dashboard' : '/manager/dashboard');
          return;
        }

        // Fallback: try logging in using stored password
        const loginResp = await axios.post(
          `${apiBaseUrl}/api/login/`,
          { email: signInEmail, password },
          { headers: { 'X-CSRFToken': getCookie('csrftoken') }, withCredentials: true }
        );
        saveAuthData(loginResp.data);
        setShowVerificationModal(false);
        showToast('success', loginResp.data.message || 'Signed in successfully');
        const role = getUserFromCookies()?.role || 'manager';
        navigateAfterDelay(role === 'admin' ? '/dashboard' : '/manager/dashboard');
      } catch (err) {
        setVerificationError(err.response?.data?.error || 'OTP verification failed');
      } finally {
        setLoading(false);
      }
    };

    const handleResendLoginOtp = async () => {
      try {
        setLoading(true);
        const apiBaseUrl = `${window.location.protocol}//${window.location.host}`;
        await ensureCsrf(apiBaseUrl);
        await axios.post(
          `${apiBaseUrl}/api/resend-login-otp/`,
          { email: signInEmail },
          { headers: { 'X-CSRFToken': getCookie('csrftoken') }, withCredentials: true }
        );
        setResendCooldown(60);
        showToast('success', 'OTP resent');
        const interval = setInterval(() => {
          setResendCooldown((c) => {
            if (c <= 1) {
              clearInterval(interval);
              return 0;
            }
            return c - 1;
          });
        }, 1000);
      } catch (err) {
        setVerificationError(err.response?.data?.error || 'Failed to resend OTP');
      } finally {
        setLoading(false);
      }
    };

    // Forgot password handlers
    const handleSendForgotOtp = async () => {
      try {
        setLoading(true);
        setForgotError('');
        const apiBaseUrl = `${window.location.protocol}//${window.location.host}`;
        await ensureCsrf(apiBaseUrl);
        const response = await axios.post(
          `${apiBaseUrl}/api/send-reset-otp/`,
          { email: forgotEmail },
          { headers: { 'X-CSRFToken': getCookie('csrftoken') }, withCredentials: true }
        );
        showToast('success', response.data?.message || 'OTP sent to your email');
        setForgotPasswordStep(1);
        setForgotOtpExpiry(60);
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to send OTP';
        setForgotError(errorMsg);
        showToast('error', errorMsg);
      } finally {
        setLoading(false);
      }
    };

    const handleVerifyForgotOtp = async () => {
      try {
        setLoading(true);
        setForgotError('');
        const apiBaseUrl = `${window.location.protocol}//${window.location.host}`;
        await ensureCsrf(apiBaseUrl);
        const response = await axios.post(
          `${apiBaseUrl}/client/api/verify-otp/`,
          { email: forgotEmail, otp: forgotOtp },
          { headers: { 'X-CSRFToken': getCookie('csrftoken') }, withCredentials: true }
        );
        showToast('success', response.data?.message || 'OTP verified');
        setForgotPasswordStep(2);
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Invalid OTP';
        setForgotError(errorMsg);
        showToast('error', errorMsg);
      } finally {
        setLoading(false);
      }
    };

    const handleResetForgotPassword = async () => {
      if (forgotNewPassword !== forgotNewPasswordConfirm) {
        setForgotError('Passwords do not match');
        return;
      }
      try {
        setLoading(true);
        setForgotError('');
        const apiBaseUrl = `${window.location.protocol}//${window.location.host}`;
        await ensureCsrf(apiBaseUrl);
        const response = await axios.post(
          `${apiBaseUrl}/client/api/reset-password/`,
          { email: forgotEmail, new_password: forgotNewPassword },
          { headers: { 'X-CSRFToken': getCookie('csrftoken') }, withCredentials: true }
        );
        showToast('success', response.data?.message || 'Password reset successfully');
        setShowForgotPasswordModal(false);
        setForgotPasswordStep(0);
        setForgotEmail('');
        setForgotOtp('');
        setForgotNewPassword('');
        setForgotNewPasswordConfirm('');
      } catch (err) {
        const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to reset password';
        setForgotError(errorMsg);
        showToast('error', errorMsg);
      } finally {
        setLoading(false);
      }
    };

    const closeForgotPasswordModal = () => {
      setShowForgotPasswordModal(false);
      setForgotPasswordStep(0);
      setForgotEmail('');
      setForgotOtp('');
      setForgotNewPassword('');
      setForgotNewPasswordConfirm('');
      setForgotError('');
    };

    // Setup OTP expiry timer for forgot password
    useEffect(() => {
      if (!showForgotPasswordModal || forgotPasswordStep !== 1) return;
      setForgotOtpExpiry(60);
      const t = setInterval(() => {
        setForgotOtpExpiry((v) => {
          if (v <= 1) {
            clearInterval(t);
            return 0;
          }
          return v - 1;
        });
      }, 1000);
      return () => clearInterval(t);
    }, [showForgotPasswordModal, forgotPasswordStep]);

    return (
      <StyledWrapper>
    {/* Toast container */}
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map((t) => (
        <div key={t.id} className={"toast " + t.type} role="status">
          <div className="toast-message">{t.message}</div>
          <button className="toast-close" onClick={() => setToasts((s) => s.filter(x => x.id !== t.id))} aria-label="Dismiss">×</button>
        </div>
      ))}
    </div>
    <div className="login-container">
        <div className="login-card">
            <div className="login-header">
                <div className="neu-icon">
                    <div className="icon-inner">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                            <circle cx="12" cy="7" r="4"/>
                        </svg>
                    </div>
                </div>
                <h2>Welcome back</h2>
                <p>Please sign in to continue</p>
            </div>
            
            <form className="login-form" id="loginForm" noValidate onSubmit={handleSubmit}>
                <div className="form-group">
                    <div className="input-group neu-input">
                        <input
                          type="email"
                          id="email"
                          name="email"
                          required
                          autoComplete="email"
                          placeholder=" "
                          value={email}
                          onChange={(e) => setEmail(e.target.value.toLowerCase())}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isLoading) {
                              e.preventDefault();
                              handleSubmit(e);
                            }
                          }}
                        />
                        <label htmlFor="email">Email address</label>
                        <div className="input-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                                <polyline points="22,6 12,13 2,6"/>
                            </svg>
                        </div>
                    </div>
                    <span className="error-message" id="emailError"></span>
                </div>

                {/* Notifications are now shown via toasts */}

                <div className="form-group">
                    <div className="input-group neu-input password-group">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          name="password"
                          required
                          autoComplete="current-password"
                          placeholder=" "
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isLoading) {
                              e.preventDefault();
                              handleSubmit(e);
                            }
                          }}
                        />
                        <label htmlFor="password">Password</label>
                        <div className="input-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                <path d="M7 11V7a5 5 0 0110 0v4"/>
                            </svg>
                        </div>
                        <button
                          type="button"
                          className={"password-toggle neu-toggle" + (showPassword ? ' show-password' : '')}
                          id="passwordToggle"
                          aria-label="Toggle password visibility"
                          aria-pressed={showPassword}
                          onClick={() => setShowPassword((s) => !s)}
                        >
                            <svg className="eye-open" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                <circle cx="12" cy="12" r="3"/>
                            </svg>
                            <svg className="eye-closed" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                <line x1="1" y1="1" x2="23" y2="23"/>
                            </svg>
                        </button>
                    </div>
                    <span className="error-message" id="passwordError"></span>
                </div>

                <div className="form-options">
                    <a 
                      className="forgot-link"
                      onClick={() => setShowForgotPasswordModal(true)}
                      style={{ cursor: 'pointer', marginLeft: 'auto' }}
                    >
                      Forgot your password?
                    </a>
                </div>

                <button
                  type="submit"
                  className={"neu-button login-btn " + (isLoading ? 'loading' : 'pulse')}
                  disabled={isLoading}
                  aria-busy={isLoading}
                >
                  <span className="btn-text">Sign In</span>
                  <div className="btn-loader">
                    <div className="neu-spinner"></div>
                  </div>
                </button>
                             {verificationRequired && (
                <div id="verification-message" style={{ color: '#FFD36D', marginTop: '10px' }}>
                  Please check your email for the OTP to verify your login.
                </div>
              )}
            </form>
          </div>

          {showVerificationModal && (
            <div
              role="dialog"
              aria-modal="true"
              style={{
                position: 'fixed',
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.65)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: 16,
              }}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: 520,
                  background: '#0b0b0c',
                  borderRadius: 14,
                  padding: 20,
                  border: '1px solid rgba(212,175,55,0.5)',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <h2 style={{ color: '#D4AF37', margin: '0 0 8px', letterSpacing: '0.12em' }}>Verify Your Email</h2>
                  <p style={{ color: '#bfb38a', margin: '0 0 14px' }}>Enter the OTP sent to {signInEmail}</p>

                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    style={{
                      width: '100%',
                      borderRadius: 20,
                      background: 'rgba(255,255,255,0.04)',
                      color: '#fff',
                      padding: '12px 16px',
                      textAlign: 'center',
                      marginBottom: 12,
                      border: '1px solid rgba(255,255,255,0.04)'
                    }}
                    maxLength={6}
                  />

                  {verificationError && (
                    <p style={{ color: '#ff8a8a', fontSize: 13, margin: '6px 0 10px' }}>{verificationError}</p>
                  )}

                  <div style={{ color: '#bfb38a', fontSize: 13, marginBottom: 12 }}>
                    OTP expires in: {Math.floor(otpExpiry / 60)}:{(otpExpiry % 60).toString().padStart(2, '0')}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 8 }}>
                    <button
                      onClick={handleVerifyLoginOtp}
                      disabled={loading || verificationCode.length < 6}
                      type="button"
                      style={{
                        borderRadius: 28,
                        background: 'linear-gradient(180deg,#ffd66b,#d4af37)',
                        color: '#000',
                        fontWeight: 700,
                        padding: '10px 28px',
                        border: 'none',
                        cursor: loading || verificationCode.length < 6 ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {loading ? 'Verifying...' : 'Verify'}
                    </button>
                  </div>

                  <button
                    onClick={handleResendLoginOtp}
                    disabled={resendCooldown > 0 || loading}
                    type="button"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#D4AF37',
                      textDecoration: 'underline',
                      cursor: resendCooldown > 0 || loading ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Forgot Password Modal */}
          {showForgotPasswordModal && (
            <div
              role="dialog"
              aria-modal="true"
              style={{
                position: 'fixed',
                left: 0,
                top: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.65)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9998,
                padding: 16,
              }}
              onClick={closeForgotPasswordModal}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: 520,
                  background: '#0b0b0c',
                  borderRadius: 14,
                  padding: 30,
                  border: '1px solid rgba(212,175,55,0.5)',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.6)',
                }}
                onClick={(e) => e.stopPropagation()}
              >

                {/* Step 0: Enter Email */}
                {forgotPasswordStep === 0 && (
                  <div>
                    <h2 style={{ color: '#D4AF37', margin: '0 0 20px', textAlign: 'center', fontSize: '1.5rem', fontWeight: 'bold', letterSpacing: '0.12em' }}>
                      Reset Password
                    </h2>
                    <p style={{ color: '#bfb38a', margin: '0 0 20px', textAlign: 'center', fontSize: '14px' }}>
                      Enter your email address and we'll send you an OTP to reset your password.
                    </p>
                    <input
                      type="email"
                      placeholder="Email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value.toLowerCase())}
                      style={{
                        width: '100%',
                        borderRadius: '1rem',
                        background: 'rgba(255,255,255,0.05)',
                        color: '#f6f4f0',
                        padding: '8px 16px',
                        marginBottom: 16,
                        border: '1px solid rgba(255,255,255,0.1)',
                        fontFamily: 'inherit',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                    {forgotError && (
                      <p style={{ color: '#ff8a8a', fontSize: 13, margin: '10px 0' }}>{forgotError}</p>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20 }}>
                      <button
                        onClick={handleSendForgotOtp}
                        disabled={loading || !forgotEmail}
                        type="button"
                        style={{
                          borderRadius: '9999px',
                          background: loading || !forgotEmail ? '#999' : 'linear-gradient(to bottom, #ffd66b, #d4af37)',
                          color: '#000',
                          fontWeight: 700,
                          padding: '8px 24px',
                          border: 'none',
                          cursor: loading || !forgotEmail ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          opacity: loading || !forgotEmail ? 0.5 : 1
                        }}
                      >
                        {loading ? 'Sending...' : 'Send OTP'}
                      </button>
                      <button
                        onClick={closeForgotPasswordModal}
                        type="button"
                        style={{
                          borderRadius: '9999px',
                          background: 'transparent',
                          color: '#D4AF37',
                          fontWeight: 700,
                          padding: '8px 24px',
                          border: '1px solid #D4AF37',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Back to Sign In
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 1: Verify OTP */}
                {forgotPasswordStep === 1 && (
                  <div>
                    <h2 style={{ color: '#D4AF37', margin: '0 0 20px', textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold' }}>
                      Reset Password
                    </h2>
                    <p style={{ color: '#bfb38a', margin: '0 0 20px', textAlign: 'center', fontSize: '14px' }}>
                      Enter the OTP sent to your email.
                    </p>
                    <input
                      type="text"
                      placeholder="Enter OTP"
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value)}
                      maxLength={6}
                      style={{
                        width: '100%',
                        borderRadius: '1rem',
                        background: 'rgba(255,255,255,0.05)',
                        color: '#f6f4f0',
                        padding: '8px 16px',
                        textAlign: 'center',
                        marginBottom: 16,
                        border: '1px solid rgba(255,255,255,0.1)',
                        fontFamily: 'inherit',
                        fontSize: '14px',
                        outline: 'none',
                        letterSpacing: '0.1em'
                      }}
                    />
                    {forgotError && (
                      <p style={{ color: '#ff8a8a', fontSize: 13, margin: '10px 0' }}>{forgotError}</p>
                    )}
                    <div style={{ color: '#bfb38a', fontSize: 13, marginBottom: 16, textAlign: 'center' }}>
                      OTP expires in: {Math.floor(forgotOtpExpiry / 60)}:{(forgotOtpExpiry % 60).toString().padStart(2, '0')}
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20 }}>
                      <button
                        onClick={handleVerifyForgotOtp}
                        disabled={loading || forgotOtp.length < 6}
                        type="button"
                        style={{
                          borderRadius: '9999px',
                          background: loading || forgotOtp.length < 6 ? '#999' : 'linear-gradient(to bottom, #ffd66b, #d4af37)',
                          color: '#000',
                          fontWeight: 700,
                          padding: '8px 24px',
                          border: 'none',
                          cursor: loading || forgotOtp.length < 6 ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          opacity: loading || forgotOtp.length < 6 ? 0.5 : 1
                        }}
                      >
                        {loading ? 'Verifying...' : 'Verify OTP'}
                      </button>

                      <button
                        onClick={handleSendForgotOtp}
                        disabled={loading || forgotOtpExpiry > 0}
                        type="button"
                        style={{
                          borderRadius: '9999px',
                          background: loading || forgotOtpExpiry > 0 ? '#999' : 'linear-gradient(to bottom, #ffd66b, #d4af37)',
                          color: '#000',
                          fontWeight: 700,
                          padding: '8px 24px',
                          border: 'none',
                          cursor: loading || forgotOtpExpiry > 0 ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          opacity: loading || forgotOtpExpiry > 0 ? 0.5 : 1
                        }}
                      >
                        {forgotOtpExpiry > 0 ? `Resend OTP in ${forgotOtpExpiry}s` : (loading ? 'Sending...' : 'Resend OTP')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Reset Password */}
                {forgotPasswordStep === 2 && (
                  <div>
                    <h2 style={{ color: '#D4AF37', margin: '0 0 20px', textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold' }}>
                      Reset Password
                    </h2>
                    <p style={{ color: '#bfb38a', margin: '0 0 20px', textAlign: 'center', fontSize: '14px' }}>
                      Set your new password.
                    </p>
                    <div style={{ position: 'relative', width: '100%', marginBottom: 16 }}>
                      <input
                        type={showForgotPassword ? 'text' : 'password'}
                        placeholder="New Password"
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        style={{
                          width: '100%',
                          borderRadius: '1rem',
                          background: 'rgba(255,255,255,0.05)',
                          color: '#f6f4f0',
                          padding: '8px 16px',
                          border: '1px solid rgba(255,255,255,0.1)',
                          fontFamily: 'inherit',
                          fontSize: '14px',
                          outline: 'none'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotPassword(!showForgotPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#bfb38a',
                          cursor: 'pointer',
                          padding: '4px',
                          fontSize: '14px'
                        }}
                      >
                        {showForgotPassword ? '👁️' : '🔒'}
                      </button>
                    </div>
                    <input
                      type={showForgotPassword ? 'text' : 'password'}
                      placeholder="Confirm New Password"
                      value={forgotNewPasswordConfirm}
                      onChange={(e) => setForgotNewPasswordConfirm(e.target.value)}
                      style={{
                        width: '100%',
                        borderRadius: '1rem',
                        background: 'rgba(255,255,255,0.05)',
                        color: '#f6f4f0',
                        padding: '8px 16px',
                        marginBottom: 16,
                        border: '1px solid rgba(255,255,255,0.1)',
                        fontFamily: 'inherit',
                        fontSize: '14px',
                        outline: 'none'
                      }}
                    />
                    {forgotError && (
                      <p style={{ color: '#ff8a8a', fontSize: 13, margin: '10px 0' }}>{forgotError}</p>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 20 }}>
                      <button
                        onClick={handleResetForgotPassword}
                        disabled={loading || !forgotNewPassword || !forgotNewPasswordConfirm}
                        type="button"
                        style={{
                          borderRadius: '9999px',
                          background: loading || !forgotNewPassword || !forgotNewPasswordConfirm ? '#999' : 'linear-gradient(to bottom, #ffd66b, #d4af37)',
                          color: '#000',
                          fontWeight: 700,
                          padding: '8px 24px',
                          border: 'none',
                          cursor: loading || !forgotNewPassword || !forgotNewPasswordConfirm ? 'not-allowed' : 'pointer',
                          fontSize: '14px',
                          opacity: loading || !forgotNewPassword || !forgotNewPasswordConfirm ? 0.5 : 1
                        }}
                      >
                        {loading ? 'Resetting...' : 'Reset Password'}
                      </button>
                      <button
                        onClick={() => setShowForgotPasswordModal(false)}
                        type="button"
                        style={{
                          borderRadius: '9999px',
                          background: 'transparent',
                          color: '#D4AF37',
                          fontWeight: 700,
                          padding: '8px 24px',
                          border: '1px solid #D4AF37',
                          cursor: 'pointer',
                          fontSize: '14px'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </StyledWrapper>
    );
  };

  const StyledWrapper = styled.div`

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

/* Dark black & gold theme */
    --bg: #08070a;
    --card: #0f0f12;
    --muted: #bfb38a;
    --text: #e6e6e9;
    --gold: #D4AF37;

    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    width: 100%;
    padding: 20px;
    background: radial-gradient(circle at 10% 10%, rgba(212,175,55,0.03), transparent 20%), var(--bg);
    color: var(--text);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    line-height: 1.6;

.login-container {
    width: 100%;
    max-width: 420px;
}

.login-card {
    background: linear-gradient(180deg, #0b0b0d 0%, #121216 100%);
    border-radius: 30px;
    padding: 50px 40px;
    box-shadow: 0 10px 30px rgba(212, 175, 55, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.02);
    border: 1px solid rgb(212, 175, 55);
    position: relative;
    transition: all 0.3s ease;
}

.login-card:hover {
    transform: translateY(-5px);
}

.login-header {
    text-align: center;
    margin-bottom: 40px;
}

.neu-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 24px;
    background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.25));
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 8px 20px rgba(0,0,0,0.7), inset 0 4px 8px rgba(255,255,255,0.02);
    transition: all 0.3s ease;
}

.neu-icon:hover {
    box-shadow: inset 0 10px 20px rgba(212, 175, 55, 0.6),  0 1px 0 rgba(255, 255, 255, 0.02);
}

.icon-inner {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--muted);
}

.icon-inner svg {
    width: 100%;
    height: 100%;
    stroke: var(--muted);
}

.login-header h2 {
    color: var(--text);
    font-size: 2rem;
    font-weight: 700;
    margin-bottom: 8px;
}

.login-header p {
    color: var(--muted);
    font-size: 15px;
    font-weight: 400;
}

/* Neumorphic Input Styles */
.form-group {
    margin-bottom: 28px;
    position: relative;
}

.neu-input {
    position: relative;
    background: linear-gradient(180deg, rgba(255,255,255,0.01), rgba(0,0,0,0.18));
    border-radius: 12px;
    box-shadow: inset 6px 6px 12px rgba(0,0,0,0.6), inset -6px -6px 12px rgba(255,255,255,0.02);
    transition: all 0.3s ease;
    border: 1px solid rgba(212,175,55,0.04);
}

.neu-input:focus-within {
  box-shadow:
    inset 0 0 0 3px rgba(212,175,55,0.12),
    inset 4px 4px 12px rgba(0,0,0,0.6);
}

.neu-input input {
  width: 100%;
  background: transparent;
  border: none;
  padding: 18px 20px;
  padding-left: 72px; /* room for icon + floating label */
  color: var(--text);
  font-size: 15px;
  font-weight: 500;
  outline: none;
  transition: all 0.18s cubic-bezier(.2,.8,.2,1);
  caret-color: var(--gold);
}

.neu-input input::placeholder {
  color: var(--gold);
  opacity: 0.75;
}

.neu-input label {
  position: absolute;
  left: 72px; /* align with input text */
  top: 50%;
  transform: translateY(-50%);
  color: var(--muted);
  font-size: 15px;
  font-weight: 500;
  pointer-events: none;
  transition: all 0.16s cubic-bezier(.2,.8,.2,1);
  background: transparent;
  padding: 0 8px;
  line-height: 1;
}

/* Float label to top on focus or when input has content */
.neu-input input:focus + label,
.neu-input input:not(:placeholder-shown) + label {
  top: -6px;
  font-size: 12px;
  color: var(--gold);
  transform: translateY(0);
  left: 56px;
  background: var(--card);
  border-radius: 6px;
  padding: 0 8px;
}

/* Hide placeholder while focused so floating label is clear */
.neu-input input:focus::placeholder {
  color: transparent;
}

.input-icon {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: var(--muted);
  transition: all 0.18s cubic-bezier(.2,.8,.2,1);
}

.input-icon svg {
    width: 100%;
    height: 100%;
}

.neu-input:focus-within .input-icon {
  color: var(--gold);
}

/* Password Toggle */
.password-group {
    padding-right: 50px;
}

.neu-toggle {
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
  background: transparent;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  box-shadow: none;
    transition: all 0.3s ease;
}

.neu-toggle:hover {
  color: var(--text);
}

.neu-toggle:active { box-shadow: none; }

.neu-toggle svg {
    width: 18px;
    height: 18px;
}

.eye-closed {
    display: none;
}

.neu-toggle.show-password .eye-open {
    display: none;
}

.neu-toggle.show-password .eye-closed {
    display: block;
}

/* Form Options */
.form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 35px;
    flex-wrap: wrap;
    gap: 16px;
}

.remember-wrapper {
    display: flex;
    align-items: center;
    cursor: pointer;
}

.remember-wrapper input[type="checkbox"] {
    display: none;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    user-select: none;
    color: var(--muted);
    font-size: 14px;
    font-weight: 500;
}

.neu-checkbox {
    width: 22px;
    height: 22px;
    background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.22));
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 3px 8px rgba(0,0,0,0.6), inset -2px -2px 6px rgba(255,255,255,0.02);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
    border: 1px solid rgba(212,175,55,0.06);
}

.remember-wrapper input[type="checkbox"]:checked + .checkbox-label .neu-checkbox {
    box-shadow: 
        inset 2px 2px 5px #bec3cf,
        inset -2px -2px 5px #ffffff;
}

.neu-checkbox svg {
    width: 14px;
    height: 14px;
    color: #00c896;
    opacity: 0;
    transform: scale(0);
    transition: all 0.3s ease;
}

.remember-wrapper input[type="checkbox"]:checked + .checkbox-label .neu-checkbox svg {
    opacity: 1;
    transform: scale(1);
}

.forgot-link {
    color: var(--muted);
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    transition: color 0.3s ease;
}

.forgot-link:hover {
    color: var(--text);
}

/* Black & Gold Neumorphic Button */
.neu-button {
    width: 60%;
    margin: 0 auto 30px auto; /* center horizontally */
    display: block;

    background: linear-gradient(180deg, #d4af37, #9f7c1f);
    border: none;
    border-radius: 14px;
    padding: 14px 28px;
    color: #0a0a0a;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    position: relative;
    overflow: hidden;

    box-shadow:
        0 10px 30px rgba(0, 0, 0, 0.85),
        0 2px 6px rgba(212, 175, 55, 0.25);

    border: 1px solid rgba(0, 0, 0, 0.6);
    transition: all 0.3s ease;
}


/* Gold shine sweep */
.neu-button::before {
    content: '';
    position: absolute;
    top: 0;
    left: -120%;
    width: 120%;
    height: 100%;
    background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 215, 100, 0.35),
        transparent
    );
    transition: left 0.6s ease;
}

/* Hover state */
.neu-button:hover {
    transform: translateY(-2px);
    box-shadow:
        0 16px 40px rgba(0, 0, 0, 0.9),
        0 6px 14px rgba(212, 175, 55, 0.35);
}

.neu-button:hover::before {
    left: 120%;
}

/* Pressed state (neumorphic inset) */
.neu-button:active {
    transform: translateY(0);
    box-shadow:
        inset 4px 4px 12px rgba(0, 0, 0, 0.8),
        inset -4px -4px 12px rgba(255, 215, 100, 0.25);
}

/* Button text */
.btn-text {
    position: relative;
    z-index: 1;
    transition: opacity 0.3s ease;
}

/* Loader */
.btn-loader {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    opacity: 0;
    z-index: 1;
    transition: opacity 0.3s ease;
}

/* Gold spinner */
.neu-spinner {
    width: 20px;
    height: 20px;
    border: 3px solid rgba(0, 0, 0, 0.35);
    border-top: 3px solid #d4af37;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

/* Spinner animation */
@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}


@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.neu-button.loading .btn-text {
  opacity: 0.32;
}

.neu-button.loading .btn-loader {
    opacity: 1;
}

/* Divider */
.divider { display: none; }
.divider-line { display: none; }
.divider span { display: none; }

/* Social Login */
.social-login { display: none; }
.neu-social { display: none; }

/* Signup Link */
.signup-link {
    text-align: center;
}

.signup-link p {
    color: var(--muted);
    font-size: 14px;
}

.signup-link a {
    color: #6c7293;
    text-decoration: none;
    font-weight: 600;
    transition: color 0.3s ease;
}

.signup-link a:hover {
    color: #3d4468;
}

/* Error States */
.error-message {
    color: #ff3b5c;
    font-size: 12px;
    font-weight: 500;
    margin-top: 8px;
    margin-left: 20px;
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.3s ease;
}

.error-message.show {
    opacity: 1;
    transform: translateY(0);
}

.form-group.error .neu-input {
    box-shadow: 
        inset 8px 8px 16px #ffb8c4,
        inset -8px -8px 16px #ffffff,
        0 0 0 2px #ff3b5c;
}

/* Success Message */
.success-message {
    display: none;
    text-align: center;
    padding: 40px 20px;
    opacity: 0;
    transform: translateY(20px);
    transition: all 0.5s ease;
}

.success-message.show {
    display: block;
    opacity: 1;
    transform: translateY(0);
}

.success-message .neu-icon {
    background: #e0e5ec;
    color: #00c896;
    margin-bottom: 20px;
}

.success-message h3 {
    color: #3d4468;
    font-size: 1.5rem;
    margin-bottom: 8px;
}

.success-message p {
    color: #9499b7;
    font-size: 14px;
}

/* Toast notifications */
.toast-container {
  position: fixed;
  top: 24px;
  right: 24px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.toast {
  min-width: 260px;
  max-width: 380px;
  padding: 12px 14px;
  border-radius: 10px;
  color: var(--text);
  background: rgba(16,16,18,0.92);
  border: 1px solid rgba(255,255,255,0.03);
  box-shadow: 0 8px 24px rgba(0,0,0,0.6), 0 2px 8px rgba(212,175,55,0.04);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 8px;
}
.toast.success {
  border-left: 4px solid var(--gold);
}
.toast.error {
  border-left: 4px solid #ff3b5c;
}
.toast-message {
  padding-right: 12px;
  font-size: 14px;
}
.toast-close {
  background: transparent;
  border: none;
  color: var(--muted);
  font-size: 18px;
  cursor: pointer;
}

/* Button pulse and disabled states */
@keyframes goldPulse {
  0% {
    box-shadow: 0 8px 24px rgba(0,0,0,0.6), 0 2px 6px rgba(212,175,55,0.06);
  }
  50% {
    box-shadow: 0 18px 36px rgba(0,0,0,0.7), 0 8px 30px rgba(212,175,55,0.12);
  }
  100% {
    box-shadow: 0 8px 24px rgba(0,0,0,0.6), 0 2px 6px rgba(212,175,55,0.06);
  }
}

.neu-button.pulse {
  animation: goldPulse 4.5s ease-in-out infinite;
}

.neu-button[disabled],
.neu-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  filter: grayscale(0.02) contrast(0.95);
  transform: translateY(0);
  box-shadow: 0 6px 20px rgba(0,0,0,0.55), 0 1px 6px rgba(212,175,55,0.02) !important;
  transition: box-shadow 220ms ease, opacity 220ms ease, transform 180ms ease;
  animation-play-state: paused;
}

.neu-button.loading {
  pointer-events: none;
  opacity: 0.95;
  box-shadow: 0 20px 48px rgba(0,0,0,0.7), 0 6px 28px rgba(212,175,55,0.14);
  transition: box-shadow 180ms ease, opacity 180ms ease;
}

/* Mobile Responsive */
@media (max-width: 480px) {
    body {
        padding: 16px;
    }
    
    .login-card {
        padding: 35px 25px;
        border-radius: 20px;
    }
    
    .login-header h2 {
        font-size: 1.75rem;
    }
    
    .neu-input input {
        padding: 18px 20px;
        padding-left: 50px;
    }
    
    .neu-input label {
        left: 50px;
    }
    
    .form-options {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
    }
}
  `;

  export default Login;