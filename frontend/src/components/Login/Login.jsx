import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext';
import GoogleLogin from '../GoogleLogin/GoogleLogin';
import {
  Mail, User as UserIcon, Eye, EyeOff, ShieldCheck,
  Phone, Loader2, ArrowLeft, CheckCircle2, Circle, Coffee, UtensilsCrossed, Timer, RefreshCw, Lock,
} from 'lucide-react';
import './Login.css';

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export default function Login({ initialMode = 'login' }) {
  const {
    login, signup, sendOTP, verifyOTP,
    isAuthenticated, isAdmin, loading: authLoading,
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = (searchParams.get('redirect') || '').replace(/^\//, '');

  const [mode, setMode] = useState(initialMode === 'signup' ? 'signup' : 'login');

  // ---- Login fields ----
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginErrors, setLoginErrors] = useState({});
  const [loginError, setLoginError] = useState('');

  // ---- Signup fields ----
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupErrors, setSignupErrors] = useState({});

  // ---- OTP step ----
  const [otpEmail, setOtpEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const [otpSent, setOtpSent] = useState(false);

  // ---- Rate-limit / CAPTCHA (front-end guard after 3 failed attempts) ----
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [captcha, setCaptcha] = useState(null); // { a, b, answer }
  const [captchaInput, setCaptchaInput] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const generateCaptcha = useCallback(() => {
    const a = Math.floor(Math.random() * 9) + 1;
    const b = Math.floor(Math.random() * 9) + 1;
    setCaptcha({ a, b, answer: a + b });
    setCaptchaInput('');
  }, []);

  // Resend OTP countdown
  useEffect(() => {
    if (mode !== 'otp' || resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [mode, resendIn]);

  // Already authenticated? Send the user on their way.
  useEffect(() => {
    if (!isAuthenticated) return;
    const dest = isAdmin
      ? '/admin-dashboard'
      : redirectTo
        ? `/${redirectTo}`
        : '/';
    navigate(dest, { replace: true });
  }, [isAuthenticated, isAdmin, redirectTo, navigate]);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setLoginErrors({});
    setLoginError('');
    setSignupErrors({});
    setFailedAttempts(0);
    setCaptcha(null);
    setCaptchaInput('');
  };

  // ================= LOGIN =================
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    // Inline validation (TC_004, TC_005, TC_006)
    const errors = {};
    if (!identifier.trim()) errors.identifier = 'Username is required';
    if (!password) errors.password = 'Password is required';
    setLoginErrors(errors);
    if (Object.keys(errors).length) return;

    // CAPTCHA gate after repeated failures (TC_014, TC_023)
    if (captcha && Number(captchaInput) !== captcha.answer) {
      setLoginError('Incorrect CAPTCHA answer. Please try again.');
      generateCaptcha();
      return;
    }

    setSubmitting(true);
    const result = await login(identifier.trim(), password, { rememberMe });

    if (result.success) {
      setFailedAttempts(0);
      setCaptcha(null);
      // navigation handled by the isAuthenticated effect
    } else {
      const next = failedAttempts + 1;
      setFailedAttempts(next);
      if (next >= 3) generateCaptcha();
      setLoginError(result.error || 'Invalid username or password.');
      setPassword('');
    }
    setSubmitting(false);
  };

  // ================= SIGNUP =================
  const passwordChecks = [
    { label: 'At least 8 characters', test: (v) => v.length >= 8 },
    { label: 'An uppercase letter (A-Z)', test: (v) => /[A-Z]/.test(v) },
    { label: 'A lowercase letter (a-z)', test: (v) => /[a-z]/.test(v) },
    { label: 'A number (0-9)', test: (v) => /\d/.test(v) },
    { label: 'A special character (!@#$…)', test: (v) => /[!@#$%^&*(),.?":{}|<>_\-=+\\[\]~`]/.test(v) },
  ];

  const handleSignup = async (e) => {
    e.preventDefault();
    setSignupErrors({});

    const errors = {};
    if (!username.trim()) errors.username = 'Username is required';
    if (!email.trim()) errors.email = 'Email is required';
    else if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address';
    if (!whatsapp.trim()) errors.whatsapp = 'WhatsApp number is required';
    if (!signupPassword) errors.signupPassword = 'Password is required';
    else if (signupPassword.length < 8) errors.signupPassword = 'Password must be at least 8 characters';
    if (!confirmPassword) errors.confirmPassword = 'Please confirm your password';
    else if (signupPassword !== confirmPassword) errors.confirmPassword = 'Passwords do not match';
    setSignupErrors(errors);
    if (Object.keys(errors).length) return;

    setSubmitting(true);
    const result = await signup({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      whatsapp_number: whatsapp.trim(),
      password: signupPassword,
      password2: confirmPassword,
    });

    if (result.success) {
      setOtpEmail(email.trim().toLowerCase());
      setDevOtp(result.otp || '');
      setOtp('');
      setOtpError('');
      setResendIn(30);
      setMode('otp');
    } else {
      const errs = {};
      const data = result.errors || {};
      if (data.username) errs.username = Array.isArray(data.username) ? data.username[0] : data.username;
      if (data.email) errs.email = Array.isArray(data.email) ? data.email[0] : data.email;
      if (data.whatsapp_number) errs.whatsapp = Array.isArray(data.whatsapp_number) ? data.whatsapp_number[0] : data.whatsapp_number;
      if (data.password) errs.signupPassword = Array.isArray(data.password) ? data.password[0] : data.password;
      if (data.password2) errs.confirmPassword = Array.isArray(data.password2) ? data.password2[0] : data.password2;
      if (data.non_field_errors) errs.form = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
      setSignupErrors(errs);
    }
    setSubmitting(false);
  };

  // ================= OTP =================
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError('');
    if (otp.trim().length !== 6) {
      setOtpError('Enter the 6-digit code.');
      return;
    }
    setSubmitting(true);
    const result = await verifyOTP(otpEmail, otp.trim(), { rememberMe });
    if (!result.success) {
      setOtpError(result.error || 'Invalid or expired OTP.');
    }
    // success → navigation handled by the isAuthenticated effect
    setSubmitting(false);
  };

  const handleResendOtp = async () => {
    setOtpError('');
    setSubmitting(true);
    const result = await sendOTP(otpEmail);
    if (result.success) {
      setDevOtp(result.otp || '');
      setOtpSent(true);
      setResendIn(30);
    } else {
      setOtpError(result.error || 'Failed to resend the code.');
    }
    setSubmitting(false);
  };

  const handleOtpChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setOtp(value);
    if (otpError) setOtpError('');
  };

  // ================= GOOGLE =================
  const handleGoogleError = (msg) => {
    setLoginError(msg || 'Google Sign-In failed.');
  };

  return (
    <div className="login-page">
      <Helmet>
        <title>Login — Mcubes Cafe</title>
        <meta name="description" content="Login to your Mcubes Cafe account. Order online, track orders and more." />
      </Helmet>
      <div className="container">
        <div className="auth-shell">
          {/* ======== Branding panel ======== */}
          <aside className="auth-brand-panel">
            <div className="auth-brand-top">
              <img src="/logo.png" alt="M Cube's Cafe Logo" className="auth-brand-logo" />
              <span className="auth-brand-name">Mcubes</span>
            </div>
            <h1 className="auth-brand-title">Welcome to Mcubes Cafe</h1>
            <p className="auth-brand-subtitle">
              Fresh juices, shakes, momos, burgers &amp; more. Order online, track your orders and earn every sip.
            </p>
            <ul className="auth-brand-points">
              <li><Coffee size={18} /> 150+ menu items, fresh every day</li>
              <li><UtensilsCrossed size={18} /> Dine-in &amp; takeaway</li>
              <li><ShieldCheck size={18} /> Secure login with email or Google</li>
            </ul>
            <div className="auth-brand-quote">
              <span>“</span> Good food, good coffee, good people.
            </div>
          </aside>

          {/* ======== Form panel ======== */}
          <div className="auth-card">
            {/* Mode selector */}
            {mode !== 'otp' && (
              <div className="mode-tabs" role="tablist" aria-label="Login or create account">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'login'}
                  className={`mode-tab ${mode === 'login' ? 'active' : ''}`}
                  onClick={() => switchMode('login')}
                >
                  Login
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'signup'}
                  className={`mode-tab ${mode === 'signup' ? 'active' : ''}`}
                  onClick={() => switchMode('signup')}
                >
                  Create Account
                </button>
              </div>
            )}

            {authLoading && (
              <div className="auth-loading">
                <Loader2 size={20} className="spin" /> Checking your session…
              </div>
            )}

            {/* ============ OTP step ============ */}
            {mode === 'otp' && (
              <div className="otp-step">
                <div className="otp-step-header">
                  <div className="otp-step-icon"><Mail size={24} /></div>
                  <h2>Verify your email</h2>
                  <p>We sent a 6-digit code to <strong>{otpEmail}</strong>. Enter it below to activate your account.</p>
                </div>

                <form onSubmit={handleVerifyOtp} className="otp-form">
                  <div className={`otp-input-group ${otpError ? 'error' : ''}`}>
                    <input
                      className="otp-input"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      placeholder="• • • • • •"
                      value={otp}
                      onChange={handleOtpChange}
                      autoFocus
                      aria-label="6-digit OTP code"
                    />
                  </div>
                  {otpError && <div className="form-error otp-error">{otpError}</div>}
                  {devOtp && (
                    <div className="dev-otp-box">
                      <span className="dev-otp-label">🔧 Dev mode — your code:</span>
                      <span className="dev-otp-code">{devOtp}</span>
                    </div>
                  )}
                  {otpSent && <div className="otp-sent-note">A new code has been sent. Check your email.</div>}

                  <button type="submit" className="btn btn-primary btn-block" disabled={submitting || otp.length !== 6}>
                    {submitting ? (<><Loader2 size={18} className="spin" /> Verifying…</>) : 'Verify & Continue'}
                  </button>
                </form>

                <div className="otp-resend-row">
                  <button
                    type="button"
                    className="otp-resend-btn"
                    onClick={handleResendOtp}
                    disabled={submitting || resendIn > 0}
                  >
                    {resendIn > 0 ? (
                      <><Timer size={15} /> Resend code in {resendIn}s</>
                    ) : (
                      <><RefreshCw size={15} /> Resend code</>
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  className="back-link otp-back"
                  onClick={() => { setMode('signup'); setOtpError(''); setOtp(''); }}
                >
                  <ArrowLeft size={15} /> Back to signup
                </button>
              </div>
            )}

            {/* ============ Signup form ============ */}
            {mode === 'signup' && (
              <form onSubmit={handleSignup} className="auth-form" noValidate>
                <h2 className="auth-form-title">Create your account</h2>
                <p className="auth-form-sub">Join Mcubes Cafe to order online &amp; track your orders.</p>

                {signupErrors.form && <div className="auth-alert auth-alert-error">{signupErrors.form}</div>}

                <div className="form-group">
                  <label className="form-label" htmlFor="su-username">Username</label>
                  <div className="input-with-icon">
                    <UserIcon size={17} />
                    <input
                      id="su-username"
                      type="text"
                      className={`form-input ${signupErrors.username ? 'error' : ''}`}
                      placeholder="e.g. coffee_lover"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      maxLength={150}
                      autoComplete="username"
                    />
                  </div>
                  {signupErrors.username && <div className="form-error">{signupErrors.username}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="su-email">Email address</label>
                  <div className="input-with-icon">
                    <Mail size={17} />
                    <input
                      id="su-email"
                      type="email"
                      className={`form-input ${signupErrors.email ? 'error' : ''}`}
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      maxLength={254}
                      autoComplete="email"
                    />
                  </div>
                  {signupErrors.email && <div className="form-error">{signupErrors.email}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="su-whatsapp">WhatsApp number <span className="req-star">*</span></label>
                  <div className="input-with-icon">
                    <Phone size={17} />
                    <input
                      id="su-whatsapp"
                      type="tel"
                      className={`form-input ${signupErrors.whatsapp ? 'error' : ''}`}
                      placeholder="+91 98765 43210"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      maxLength={15}
                      autoComplete="tel"
                    />
                  </div>
                  <small className="field-hint">Used for order confirmation &amp; billing.</small>
                  {signupErrors.whatsapp && <div className="form-error">{signupErrors.whatsapp}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="su-password">Password</label>
                  <div className="password-input-wrapper">
                    <input
                      id="su-password"
                      type={showSignupPassword ? 'text' : 'password'}
                      className={`form-input ${signupErrors.signupPassword ? 'error' : ''}`}
                      placeholder="Create a strong password"
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      maxLength={128}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      aria-label={showSignupPassword ? 'Hide password' : 'Show password'}
                    >
                      {showSignupPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {signupErrors.signupPassword && <div className="form-error">{signupErrors.signupPassword}</div>}

                  <ul className="password-checklist">
                    {passwordChecks.map((check) => {
                      const ok = signupPassword && check.test(signupPassword);
                      return (
                        <li key={check.label} className={ok ? 'ok' : ''}>
                          {ok ? <CheckCircle2 size={13} /> : <Circle size={13} />}
                          {check.label}
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="su-confirm">Confirm password</label>
                  <input
                    id="su-confirm"
                    type={showSignupPassword ? 'text' : 'password'}
                    className={`form-input ${signupErrors.confirmPassword ? 'error' : ''}`}
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    maxLength={128}
                    autoComplete="new-password"
                  />
                  {signupErrors.confirmPassword && <div className="form-error">{signupErrors.confirmPassword}</div>}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={submitting}
                >
                  {submitting ? (<><Loader2 size={18} className="spin" /> Creating account…</>) : 'Create Account'}
                </button>

                <div className="auth-divider"><span>or continue with</span></div>
                <GoogleLogin onError={handleGoogleError} rememberMe={rememberMe} />

                <p className="auth-switch-line">
                  Already have an account?{' '}
                  <button type="button" className="auth-switch-btn" onClick={() => switchMode('login')}>Login</button>
                </p>
              </form>
            )}

            {/* ============ Login form ============ */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="auth-form" noValidate>
                <h2 className="auth-form-title">Welcome back!</h2>
                <p className="auth-form-sub">Login to continue ordering your favorites.</p>

                {loginError && <div className="auth-alert auth-alert-error">{loginError}</div>}

                <div className="form-group">
                  <label className="form-label" htmlFor="login-identifier">Email or username</label>
                  <div className="input-with-icon">
                    <Mail size={17} />
                    <input
                      id="login-identifier"
                      type="text"
                      className={`form-input ${loginErrors.identifier ? 'error' : ''}`}
                      placeholder="you@example.com"
                      value={identifier}
                      onChange={(e) => { setIdentifier(e.target.value); if (loginErrors.identifier) setLoginErrors((p) => ({ ...p, identifier: '' })); }}
                      maxLength={254}
                      autoComplete="username"
                    />
                  </div>
                  {loginErrors.identifier && <div className="form-error">{loginErrors.identifier}</div>}
                </div>

                <div className="form-group">
                  <div className="label-row">
                    <label className="form-label" htmlFor="login-password">Password</label>
                    <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
                  </div>
                  <div className="password-input-wrapper">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      className={`form-input ${loginErrors.password ? 'error' : ''}`}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (loginErrors.password) setLoginErrors((p) => ({ ...p, password: '' })); }}
                      maxLength={128}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {loginErrors.password && <div className="form-error">{loginErrors.password}</div>}
                </div>

                <div className="remember-row">
                  <label className="remember-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember me</span>
                  </label>
                </div>

                {captcha && (
                  <div className="captcha-box">
                    <div className="captcha-head">
                      <ShieldCheck size={16} />
                      <span>Security check</span>
                    </div>
                    <p className="captcha-prompt">Multiple failed attempts detected. Solve to continue: <strong>{captcha.a} + {captcha.b} = ?</strong></p>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="form-input captcha-input"
                      placeholder="Your answer"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value.replace(/\D/g, ''))}
                      maxLength={2}
                      aria-label="CAPTCHA answer"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={submitting || !identifier.trim() || !password}
                >
                  {submitting ? (
                    <><Loader2 size={18} className="spin" /> Logging in…</>
                  ) : (
                    'Login'
                  )}
                </button>

                <div className="auth-divider"><span>or continue with</span></div>
                <GoogleLogin onError={handleGoogleError} rememberMe={rememberMe} />

                <p className="auth-switch-line">
                  New to Mcubes Cafe?{' '}
                  <button type="button" className="auth-switch-btn" onClick={() => switchMode('signup')}>Create Account</button>
                </p>

                {/* Link to the separate admin portal */}
                <p className="auth-admin-link">
                  <Lock size={13} />
                  Are you an admin?{' '}
                  <Link to="/admin/login" className="auth-admin-link-btn">Go to Admin Portal</Link>
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
