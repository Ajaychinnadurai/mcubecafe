import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import api from '../../api/axios';
import { Mail, ArrowLeft, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import './ForgotPassword.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [devUrl, setDevUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/password-reset/', { email });
      setSent(true);
      if (res.data.reset_url) {
        setDevUrl(res.data.reset_url);
      }
    } catch (err) {
      if (err.response?.data?.email) {
        setError(err.response.data.email[0]);
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-password-page">
      <Helmet>
        <title>Forgot Password — Mcubes Cafe</title>
        <meta name="description" content="Reset your Mcubes Cafe account password." />
      </Helmet>
      <div className="container">
        <div className="forgot-password-card">
          {!sent ? (
            <>
              <div className="forgot-password-header">
                <div className="forgot-password-icon">
                  <Mail size={28} />
                </div>
                <h2>Forgot Password?</h2>
                <p>No worries! Enter your email and we'll send you a password reset link.</p>
              </div>

              <form onSubmit={handleSubmit} className="forgot-password-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="reset-email">Email Address</label>
                  <input
                    id="reset-email"
                    type="email"
                    className={`form-input ${error ? 'error' : ''}`}
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                  {error && <div className="form-error">{error}</div>}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={loading || !email}
                >
                  {loading ? (
                    <><Loader2 size={18} className="spin" /> Sending...</>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>

              <div className="forgot-password-footer">
                <Link to="/login" className="back-link">
                  <ArrowLeft size={16} /> Back to Login
                </Link>
              </div>
            </>
          ) : (
            <div className="reset-sent">
              <div className="reset-sent-icon">
                <CheckCircle size={48} />
              </div>
              <h2>Check Your Email</h2>
              <p>If an account exists with <strong>{email}</strong>, we've sent a password reset link.</p>
              <p className="reset-sent-note">Didn't receive it? Check your spam folder or try again.</p>

              {devUrl && (
                <div className="dev-reset-link">
                  <p className="dev-label">🔧 Dev Mode — Reset Link (click to test):</p>
                  <a
                    href={devUrl}
                    className="btn btn-outline btn-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Reset Password → <small style={{ opacity: 0.7 }}>(opens new tab)</small>
                  </a>
                </div>
              )}

              <div className="forgot-password-footer" style={{ marginTop: '1.5rem' }}>
                <Link to="/login" className="back-link">
                  <ArrowLeft size={16} /> Back to Login
                </Link>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => { setSent(false); setEmail(''); setDevUrl(''); }}
                  style={{ marginLeft: '1rem' }}
                >
                  Try another email
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
