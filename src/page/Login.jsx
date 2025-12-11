// react-router-dom import added to support navigate
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';

// Ensure axios sends cookies for CSRF-protected endpoints
axios.defaults.withCredentials = true;

// Small helper to read a cookie value (used for CSRF token)
function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)'));
  return match ? decodeURIComponent(match.pop()) : '';
}

// Ensure a CSRF cookie is present. Try a set of common endpoints to trigger the server
// to set a `csrftoken` cookie. This is best-effort — if your backend exposes a
// dedicated csrf endpoint (e.g. `/api/get-csrf/`) prefer that and update the list.
async function ensureCsrf(baseUrl) {
  if (getCookie('csrftoken')) return;
  const endpoints = [
    '/api/get-csrf/',
    '/api/get_csrf/',
    '/api/csrf/',
    '/csrf/',
    '/api/auth/csrf/',
    '/'
  ];

  for (const ep of endpoints) {
    try {
      // send a GET to attempt to receive a Set-Cookie: csrftoken
      await axios.get(`${baseUrl}${ep}`, { withCredentials: true });
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

  const navigate = useNavigate();

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
          localStorage.setItem('access_token', response.data.access);
          localStorage.setItem('refresh_token', response.data.refresh);
          localStorage.setItem('user', JSON.stringify(response.data.user));

          const userData = JSON.parse(localStorage.getItem('user'));
          const role = userData?.role || 'manager';
          if (role === 'admin') navigate('/dashboard');
          else navigate('/manager/dashboard');
        }
      } catch (error) {
        if (error.response) setErrorMessage(error.response.data.error || 'Something went wrong.');
        else setErrorMessage('Something went wrong.');
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
          `${apiBaseUrl}/api/verify-login-otp/`,
          { email: signInEmail, code: verificationCode },
          { headers: { 'X-CSRFToken': getCookie('csrftoken') }, withCredentials: true }
        );

        if (response.data?.access && response.data?.refresh) {
          localStorage.setItem('access_token', response.data.access);
          localStorage.setItem('refresh_token', response.data.refresh);
          localStorage.setItem('user', JSON.stringify(response.data.user || {}));
          setShowVerificationModal(false);
          const userData = response.data.user || JSON.parse(localStorage.getItem('user') || '{}');
          const role = userData?.role || 'manager';
          if (role === 'admin') navigate('/dashboard');
          else navigate('/manager/dashboard');
          return;
        }

        // Fallback: try logging in using stored password
        const loginResp = await axios.post(
          `${apiBaseUrl}/api/login/`,
          { email: signInEmail, password },
          { headers: { 'X-CSRFToken': getCookie('csrftoken') }, withCredentials: true }
        );
        localStorage.setItem('access_token', loginResp.data.access);
        localStorage.setItem('refresh_token', loginResp.data.refresh);
        localStorage.setItem('user', JSON.stringify(loginResp.data.user || {}));
        setShowVerificationModal(false);
        const role = loginResp.data.user?.role || 'manager';
        if (role === 'admin') navigate('/dashboard');
        else navigate('/manager/dashboard');
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

    return (
      <StyledWrapper>
        <div className="box">
          <div className="login">
            <form className="loginBx" method="POST" action="" id="signinForm" onSubmit={handleSubmit}>
              <h2>
                <i className="fa-solid fa-right-to-bracket"></i>
                Login
                <i className="fa-solid fa-heart"></i>
              </h2>

              <label htmlFor="username">Email</label>
              <input
                type="email"
                id="username"
                name="email"
                placeholder="Email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <label htmlFor="signinPassword">Password</label>
              <div className="password-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="signinPassword"
                  name="password"
                  placeholder="Password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <i
                  className={showPassword ? 'fa-regular fa-eye-slash' : 'fa-regular fa-eye'}
                  id="togglePassword"
                  onClick={() => setShowPassword((s) => !s)}
                  role="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                />
              </div>

              <button type="submit" disabled={isLoading}>
                {isLoading ? '' : 'Sign in'}
                <span
                  className="spinner"
                  id="loadingSpinner"
                  style={{ display: isLoading ? 'inline-block' : 'none' }}
                />
              </button>

              <div id="error-message" style={{ color: 'red', display: errorMessage ? 'block' : 'none' }}>
                {errorMessage}
              </div>

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
        </div>
      </StyledWrapper>
    );
  };

  const StyledWrapper = styled.div`

  * {
    font-family: "Poppins", sans-serif;
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

    /* Ensure the wrapper fills the viewport and centers the login box */
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #000;
    color: #fff;
    overflow: hidden;

  @property --a {
    syntax: "<angle>";
    inherits: false;
    initial-value: 0deg;
  }

  .box {
    position: relative;
    width: 400px;
    height: 200px;
    background: repeating-conic-gradient(
      from var(--a),
      #D4AF37 0%,
      #D4AF37 5%,
      transparent 5%,
      transparent 40%,
      #FFD36D 50%
    );
    filter: drop-shadow(0 15px 50px rgba(0,0,0,0.9));
    border-radius: 20px;
    animation: rotating 6s linear infinite;
    display: flex;
    justify-content: center;
    align-items: center;
    transition: 0.5s;
  }

  @keyframes rotating {
    0% { --a: 0deg; }
    100% { --a: 360deg; }
  }

  .box::before {
    content: "";
    position: absolute;
    width: 100%;
    height: 100%;
    background: repeating-conic-gradient(
      from var(--a),
      rgba(212,175,55,0.9) 0%,
      rgba(212,175,55,0.85) 6%,
      transparent 6%,
      transparent 42%,
      rgba(255,211,109,0.25) 52%
    );
    filter: drop-shadow(0 15px 50px rgba(0,0,0,0.9));
    border-radius: 20px;
    animation: rotating 6s linear infinite;
    animation-delay: -1s;
  }

  .box::after {
    content: "";
    position: absolute;
    inset: 4px;
    background: #0f0f10;
    filter: drop-shadow(0 8px 30px rgba(0,0,0,0.8));
    border-radius: 15px;
  }

  .box:hover { width: 450px; height: 500px; }
  .box:hover .login { inset: 40px; }
  .box:hover .loginBx { transform: translateY(0px); }

  .login {
    position: absolute;
    inset: 40px;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    border-radius: 10px;
    background: linear-gradient(180deg, rgba(0,0,0,0.55), rgba(10,10,10,0.35));
    color: #fff;
    z-index: 1000;
    box-shadow: inset 0 10px 20px rgba(0,0,0,0.8);
    border-bottom: 2px solid rgba(212,175,55,0.12);
    transition: 0.5s;
    overflow: hidden;
    padding-top: 40px;
  }

  .loginBx {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    padding-top: 60px;
    gap: 20px;
    width: 70%;
    transform: translateY(0px);
    transition: 0.5s;
  }

  h2 { text-transform: uppercase; font-weight: 600; letter-spacing: 0.2em; text-align: center; }

  h2 i {
    color: #D4AF37;
    text-shadow: 0 0 6px rgba(212,175,55,0.9), 0 0 26px rgba(212,175,55,0.25);
  }

  label { align-self: flex-start; color: #FFD36D; font-size: 0.95em; margin-left: 5px; }

  input {
    width: 100%;
    padding: 10px 20px;
    outline: none;
    border: none;
    font-size: 1em;
    color: #fff;
    background: rgba(255,255,255,0.03);
    border-bottom: 2px solid rgba(212,175,55,0.12);
    border-radius: 30px;
  }

  input::placeholder { color: #bfb38a; }

  button {
    width: 60%;
    background: linear-gradient(180deg, #D4AF37, #FFD36D);
    border: 1px solid rgba(0,0,0,0.6);
    font-weight: 600;
    color: #080707;
    cursor: pointer;
    transition: 0.25s;
    border-radius: 30px;
    font-size: 1.1em;
    padding: 10px 14px;
  }

  button:hover { box-shadow: 0 6px 18px rgba(212,175,55,0.25), 0 0 40px rgba(212,175,55,0.06); transform: translateY(-2px); }
  button:focus { outline: 2px solid rgba(212,175,55,0.35); outline-offset: 2px; }
  button:disabled { background: #333; color: #777; cursor: not-allowed; }

  .password-wrapper { position: relative; width: 100%; }
  .password-wrapper input { padding-right: 40px; }
  .password-wrapper i { position: absolute; top: 50%; right: 15px; transform: translateY(-50%); color: #D4AF37; cursor: pointer; font-size: 1em; transition: color 0.3s; }
  .password-wrapper i:hover { color: #FFD36D; }

  .spinner {
    display: none;
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255,255,255,0.08);
    border-top: 2px solid #D4AF37;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }

  #error-message { color: #ffb3a7; margin-top: 10px; text-align: center; font-size: 0.9em; padding: 5px; border-radius: 4px; }

  @media (max-width: 480px) {
    .box { width: 90vw; }
    .box:hover { width: 95vw; height: 500px; }
    .loginBx { width: 90%; }
  }
  `;

  export default Login;
