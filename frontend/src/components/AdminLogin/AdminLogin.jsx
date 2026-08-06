import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../contexts/AuthContext';
import {
  ShieldCheck, Mail, Eye, EyeOff, Loader2, ArrowLeft, KeyRound, Lock,
} from 'lucide-react';
import './AdminLogin.css';

export default function AdminLogin() {
  const { adminLogin, isAuthenticated, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  // Rate-limit guard: CAPTCHA appears after 3 failed attempts
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

  // Already authenticated? Go to the right place.
  useEffect(() => {
    if (!isAuthenticated) return;
    navigate(isAdmin ? '/admin-dashboard' : '/', { replace: true });
  }, [isAuthenticated, isAdmin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const errs = {};
    if (!email.trim()) errs.email = 'Email is required';
    if (!password) errs.password = 'Password is required';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    if (captcha && Number(captchaInput) !== captcha.answer) {
      setFormError('Incorrect CAPTCHA answer. Please try again.');
      generateCaptcha();
      return;
    }

    setSubmitting(true);
    const result = await adminLogin(email.trim(), password, { rememberMe });

    if (result.success) {
      setFailedAttempts(0);
      setCaptcha(null);
      // navigation handled by the isAuthenticated effect
    } else {
      const next = failedAttempts + 1;
      setFailedAttempts(next);
      if (next >= 3) generateCaptcha();
      setFormError(result.error || 'Invalid admin credentials.');
      setPassword('');
    }
    setSubmitting(false);
  };

  return (
    <div className="admin-login-page">
      <Helmet>
        <title>Admin Login — Mcubes Cafe</title>
        <meta name="description" content="Restricted area. Sign in to the Mcubes Cafe admin portal." />
      </Helmet>
      <div className="container">
        <div className="admin-login-shell">
          <div className="admin-login-card">
            {/* Restricted badge */}
            <div className="admin-login-badge">
              <KeyRound size={13} />
              Restricted area
            </div>

            {/* Emblem */}
            <div className="admin-login-emblem">
              <ShieldCheck size={30} />
            </div>

            <h1 className="admin-login-title">Admin Portal</h1>
            <p className="admin-login-sub">Authorised staff only. Sign in to manage orders, menu, gallery &amp; more.</p>

            {authLoading && (
              <div className="admin-login-loading">
                <Loader2 size={18} className="spin" /> Checking your session…
              </div>
            )}

            {!authLoading && (
              <form onSubmit={handleSubmit} className="admin-login-form" noValidate>
                {formError && <div className="auth-alert auth-alert-error">{formError}</div>}

                <div className="form-group">
                  <label className="form-label" htmlFor="admin-email">Admin email</label>
                  <div className="input-with-icon">
                    <Mail size={17} />
                    <input
                      id="admin-email"
                      type="email"
                      className={`form-input ${errors.email ? 'error' : ''}`}
                      placeholder="admin@mcubes.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors((p) => ({ ...p, email: '' })); }}
                      maxLength={254}
                      autoComplete="username"
                      autoFocus
                    />
                  </div>
                  {errors.email && <div className="form-error">{errors.email}</div>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="admin-password">Password</label>
                  <div className="password-input-wrapper">
                    <input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      className={`form-input ${errors.password ? 'error' : ''}`}
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors((p) => ({ ...p, password: '' })); }}
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
                  {errors.password && <div className="form-error">{errors.password}</div>}
                </div>

                <div className="admin-login-options">
                  <label className="remember-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember me</span>
                  </label>
                  <Link to="/forgot-password" className="forgot-link">Forgot password?</Link>
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
                  className="btn btn-primary btn-block admin-login-btn"
                  disabled={submitting || !email.trim() || !password}
                >
                  {submitting ? (
                    <><Loader2 size={18} className="spin" /> Signing in…</>
                  ) : (
                    <><Lock size={16} /> Sign In as Admin</>
                  )}
                </button>
              </form>
            )}

            <div className="admin-login-footer">
              <Link to="/login" className="back-link">
                <ArrowLeft size={15} /> Back to customer login
              </Link>
            </div>

            <p className="admin-login-tip">
              <ShieldCheck size={13} /> Admin accounts are provisioned by the cafe — new admins can't self-register.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
