import { useEffect, useRef, useState, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2, ChevronDown, LogIn } from 'lucide-react';
import './GoogleLogin.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

const DEMO_ACCOUNTS = [
  { email: 'demo.customer@gmail.com', username: 'Demo Customer', initials: 'DC' },
  { email: 'demo.sweety@gmail.com', username: 'Demo Sweet Tooth', initials: 'DS' },
];

export default function GoogleLogin({ onSuccess, onError, rememberMe = true }) {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const containerRef = useRef(null);
  const renderedRef = useRef(false);

  // Keep latest callbacks in refs so the GIS callback stays stable
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;
  // rememberMe read through a ref so a late toggle is honoured by the
  // one-time-initialized Google Identity Services callback
  const rememberMeRef = useRef(rememberMe);
  rememberMeRef.current = rememberMe;

  const completeLogin = useCallback(
    async (payload) => {
      setLoading(true);
      try {
        const result = await loginWithGoogle(payload, { rememberMe: rememberMeRef.current });
        if (result.success) {
          onSuccessRef.current?.(result);
        } else {
          onErrorRef.current?.(result.error || 'Google Sign-In failed.');
        }
      } catch {
        onErrorRef.current?.('Could not complete Google Sign-In.');
      } finally {
        setLoading(false);
      }
    },
    [loginWithGoogle]
  );

  const handleCredentialResponse = useCallback(
    async (response) => {
      try {
        const payload = jwtDecode(response.credential);
        await completeLogin({
          email: payload.email,
          username: payload.name || payload.email.split('@')[0],
          sub: payload.sub,
          token: response.credential,
          avatar: payload.picture,
        });
      } catch {
        onErrorRef.current?.('Could not verify Google credentials.');
      }
    },
    [completeLogin]
  );

  // Render the official Google button when a Client ID is configured
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !containerRef.current || renderedRef.current) return;
    renderedRef.current = true;

    let cancelled = false;
    const init = () => {
      if (cancelled || !window.google?.accounts?.id || !containerRef.current) return;
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleCredentialResponse,
          ux_mode: 'popup',
          auto_select: false,
        });
        window.google.accounts.id.renderButton(containerRef.current, {
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          width: 320,
          text: 'continue_with',
          logo_alignment: 'left',
        });
      } catch {
        onErrorRef.current?.('Google button failed to load.');
      }
    };

    if (window.google?.accounts?.id) {
      init();
    } else {
      // index.html loads the SDK with async defer — ensure it exists
      const script = document.createElement('script');
      script.src = GSI_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = init;
      document.head.appendChild(script);
    }

    return () => {
      cancelled = true;
      try {
        window.google?.accounts?.id?.disableAutoSelect?.();
      } catch {
        // ignore
      }
    };
  }, [handleCredentialResponse]);

  const handleDemoSelect = async (account) => {
    setDemoOpen(false);
    await completeLogin({
      email: account.email,
      username: account.username,
      sub: `demo:${account.email}`,
    });
  };

  const handleCustomEmail = async (e) => {
    e.preventDefault();
    const email = customEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      onErrorRef.current?.('Please enter a valid email address.');
      return;
    }
    setDemoOpen(false);
    setCustomEmail('');
    await completeLogin({
      email,
      username: email.split('@')[0],
      sub: `demo:${email}`,
    });
  };

  // ---- Dev demo mode (no Client ID configured) ----
  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="google-login">
        <button
          type="button"
          className="google-btn"
          onClick={() => setDemoOpen(!demoOpen)}
          disabled={loading}
          aria-haspopup="listbox"
          aria-expanded={demoOpen}
        >
          {loading ? (
            <Loader2 size={18} className="spin" />
          ) : (
            <svg className="google-g" width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.2 6.1 29.3 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.2 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.5l6.3 5.3C41.7 35.9 44 30.6 44 24c0-1.3-.1-2.6-.4-3.9z"/>
            </svg>
          )}
          <span>{loading ? 'Signing in…' : 'Continue with Google'}</span>
          <ChevronDown size={16} className={`google-chevron ${demoOpen ? 'open' : ''}`} />
        </button>

        {demoOpen && (
          <div className="google-demo-panel" role="listbox">
            <p className="google-demo-note">
              <span className="google-demo-badge">Demo</span>
              No <code>VITE_GOOGLE_CLIENT_ID</code> configured — using the in-app demo flow.
            </p>
            <ul className="google-demo-accounts">
              {DEMO_ACCOUNTS.map((acc) => (
                <li key={acc.email}>
                  <button type="button" onClick={() => handleDemoSelect(acc)} disabled={loading}>
                    <span className="google-demo-avatar">{acc.initials}</span>
                    <span className="google-demo-meta">
                      <span className="google-demo-name">{acc.username}</span>
                      <span className="google-demo-email">{acc.email}</span>
                    </span>
                    <LogIn size={16} />
                  </button>
                </li>
              ))}
            </ul>
            <form className="google-demo-custom" onSubmit={handleCustomEmail}>
              <input
                type="email"
                placeholder="Or try any email address…"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                aria-label="Custom demo email"
              />
              <button type="submit" disabled={loading || !customEmail.trim()}>
                Sign in
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }

  // ---- Production mode: official Google button ----
  return (
    <div className="google-login">
      <div ref={containerRef} className="google-gis-container" aria-label="Sign in with Google" />
    </div>
  );
}
