import React from 'react';
import logoSrc from '../assets/logo.png';
import { loginByEmail, loginByMemberId, saveSession } from '../auth.js';
import { Icon } from '../ui/components.jsx';

export function LoginPage({ onLogin }) {
  const [mode, setMode] = React.useState('email');
  const [email, setEmail]       = React.useState('');
  const [memberId, setMemberId] = React.useState('');
  const [pass, setPass]         = React.useState('');
  const [showPass, setShowPass] = React.useState(false);
  const [error, setError]       = React.useState('');

  const reset = (m) => { setMode(m); setError(''); setPass(''); setEmail(''); setMemberId(''); };

  const handleLogin = (e) => {
    e.preventDefault();
    const user = mode === 'email'
      ? loginByEmail(email.trim(), pass)
      : loginByMemberId(memberId.trim(), pass);
    if (!user) { setError('Invalid credentials. Please check and try again.'); return; }
    saveSession(user);
    onLogin(user);
  };

  return (
    <div className="login-shell">
      <div className="login-card">

        {/* Brand */}
        <div className="login-brand">
          <img src={logoSrc} alt="Attiguppe RWA" className="login-logo" />
          <div>
            <div className="login-org">Attiguppe Residents</div>
            <div className="login-org-sub">Welfare Association</div>
          </div>
        </div>

        {/* Removed ID card preview for Member ID login — no preview shown */}

        {/* Login tabs */}
        <div className="login-tabs">
          <button className={'login-tab' + (mode === 'email' ? ' on' : '')} onClick={() => reset('email')}>
            <Icon name="user" size={15} /> Email Login
          </button>
          <button className={'login-tab' + (mode === 'memberid' ? ' on' : '')} onClick={() => reset('memberid')}>
            <Icon name="qr" size={15} /> Member ID Login
          </button>
        </div>

        <form className="login-form" onSubmit={handleLogin} autoComplete="off">
          <h2 className="login-heading">Sign in to your account</h2>

          {mode === 'email' ? (
            <div className="lf-field">
              <label>Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                autoFocus
              />
            </div>
          ) : (
            <div className="lf-field">
              <label>Member ID</label>
              <input
                type="text"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                placeholder="e.g. M-001"
                required
                autoFocus
              />
            </div>
          )}

          <div className="lf-field">
            <label>Password</label>
            <div className="lf-pass-wrap">
              <input
                type={showPass ? 'text' : 'password'}
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <button type="button" className="lf-eye" onClick={() => setShowPass(v => !v)}>
                <Icon name={showPass ? 'eyeoff' : 'eye'} size={16} />
              </button>
            </div>
          </div>

          {error && (
            <div className="lf-error">
              <Icon name="info" size={14} />{error}
            </div>
          )}

          <button type="submit" className="lf-submit">Sign In</button>

          <div className="lf-links">
            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
              Contact your administrator to get access.
            </span>
          </div>
        </form>

        <div className="login-footer">
          Reg. No. DRB4/SOR/226/2025-2026 &middot; Attiguppe, Vijayanagar, Bengaluru – 560040
          <br />+91 9986020447 &middot; info@treva.in
        </div>
      </div>
    </div>
  );
}
