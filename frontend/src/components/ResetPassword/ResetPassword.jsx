import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../../api/axios';
import { Lock, ArrowLeft, CheckCircle, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import './ResetPassword.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [step, setStep] = useState(token ? 'form' : 'invalid');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/password-reset/confirm/', {
        token,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      setStep('success');
    } catch (err) {
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.data?.confirm_password) {
        setError(err.response.data.confirm_password[0]);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reset-password-page">
      <Helmet>
        <title>Reset Password — Mcubes Cafe</title>
        <meta name="description" content="Set a new password for your Mcubes Cafe account." />
      </Helmet>
      <div className="container">
        <div className="reset-password-card">
          {step === 'invalid' && (
            <>
              <div className="reset-password-header">
                <div className="reset-password-icon error-icon">
                  <AlertCircle size={28} />
                </div>
                <h2>Invalid Link</h2>
                <p>This password reset link is missing or invalid. Please request a new one.</p>
              </div>
              <div className="reset-password-footer">
                <Link to="/forgot-password" className="btn btn-primary">
                  Request New Link
                </Link>
              </div>
            </>
          )}

          {step === 'form' && (
            <>
              <div className="reset-password-header">
                <div className="reset-password-icon">
                  <Lock size={28} />
                </div>
                <h2>Set New Password</h2>
                <p>Enter your new password below.</p>
              </div>

              <form onSubmit={handleSubmit} className="reset-password-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="new-password">New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      className={`form-input ${error ? 'error' : ''}`}
                      placeholder="At least 8 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      autoFocus
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
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="confirm-password">Confirm Password</label>
                  <input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    className={`form-input ${error ? 'error' : ''}`}
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                </div>

                {error && <div className="form-error">{error}</div>}

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={loading || !newPassword || !confirmPassword}
                >
                  {loading ? (
                    <><Loader2 size={18} className="spin" /> Resetting...</>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>

              <div className="reset-password-footer">
                <Link to="/login" className="back-link">
                  <ArrowLeft size={16} /> Back to Login
                </Link>
              </div>
            </>
          )}

          {step === 'success' && (
            <>
              <div className="reset-password-header">
                <div className="reset-password-icon success-icon">
                  <CheckCircle size={28} />
                </div>
                <h2>Password Reset!</h2>
                <p>Your password has been updated successfully. You can now log in with your new password.</p>
              </div>
              <div className="reset-password-footer">
                <button
                  className="btn btn-primary"
                  onClick={() => navigate('/login')}
                >
                  Go to Login
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
