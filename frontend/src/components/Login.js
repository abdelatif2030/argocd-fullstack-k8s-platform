import React, { useState } from 'react';

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--bg-base)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-sans)',
  },
  grid: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)',
    backgroundSize: '40px 40px',
    pointerEvents: 'none',
  },
  card: {
    background: 'var(--bg-surface)',
    border: '0.5px solid var(--border-bright)',
    borderRadius: 'var(--radius-lg)',
    padding: '2.5rem',
    width: '380px',
    position: 'relative',
    zIndex: 1,
    animation: 'fadeIn 0.4s ease forwards',
  },
  logoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '2rem',
  },
  logoBox: {
    width: '38px',
    height: '38px',
    background: 'var(--accent)',
    borderRadius: 'var(--radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '18px',
  },
  logoText: {
    fontSize: '16px',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  logoSub: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    fontFamily: 'var(--font-mono)',
  },
  heading: {
    fontSize: '22px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    marginBottom: '6px',
  },
  subheading: {
    fontSize: '13px',
    color: 'var(--text-secondary)',
    marginBottom: '2rem',
  },
  field: {
    marginBottom: '1rem',
  },
  label: {
    display: 'block',
    fontSize: '12px',
    color: 'var(--text-secondary)',
    marginBottom: '6px',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    background: 'var(--bg-base)',
    border: '0.5px solid var(--border-bright)',
    borderRadius: 'var(--radius-sm)',
    padding: '10px 14px',
    color: 'var(--text-primary)',
    fontSize: '14px',
    fontFamily: 'var(--font-sans)',
    outline: 'none',
    transition: 'border-color 0.15s',
  },
  btn: {
    width: '100%',
    background: 'var(--accent)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    padding: '11px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: '600',
    fontFamily: 'var(--font-sans)',
    cursor: 'pointer',
    marginTop: '0.5rem',
    transition: 'opacity 0.15s, transform 0.1s',
    letterSpacing: '0.02em',
  },
  hint: {
    marginTop: '1.5rem',
    padding: '10px 14px',
    background: 'var(--accent-dim)',
    border: '0.5px solid var(--accent-glow)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '12px',
    color: '#a5b4fc',
    fontFamily: 'var(--font-mono)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  err: {
    fontSize: '12px',
    color: 'var(--red)',
    marginTop: '6px',
    minHeight: '16px',
  },
};

export default function Login({ onLogin }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!user || !pass) { setErr('Please enter credentials'); return; }
    setLoading(true);
    setErr('');
    await new Promise(r => setTimeout(r, 600));
    if (user === 'admin' && pass === 'admin') {
      onLogin();
    } else {
      setErr('Invalid username or password');
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.grid} />
      <div style={styles.card}>
        <div style={styles.logoRow}>
          <div style={styles.logoBox}>⎈</div>
          <div>
            <div style={styles.logoText}>K8s Dashboard</div>
            <div style={styles.logoSub}>production-cluster</div>
          </div>
        </div>

        <h1 style={styles.heading}>Sign in</h1>
        <p style={styles.subheading}>Monitor your cluster and deployments</p>

        <div style={styles.field}>
          <label style={styles.label}>Username</label>
          <input
            style={styles.input}
            type="text"
            placeholder="admin"
            value={user}
            onChange={e => setUser(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-bright)'}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Password</label>
          <input
            style={styles.input}
            type="password"
            placeholder="••••••••"
            value={pass}
            onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-bright)'}
          />
        </div>

        <p style={styles.err}>{err}</p>

        <button
          style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? 'Signing in...' : 'Sign in →'}
        </button>

        <div style={styles.hint}>
          <span>💡</span>
          <span>Default: <strong>admin</strong> / <strong>admin</strong></span>
        </div>
      </div>
    </div>
  );
}
