import React from 'react';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: '⎈' },
  { id: 'users', label: 'Users', icon: '◈' },
];

export default function Layout({ children, currentPage, onNavigate, onLogout }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-base)', fontFamily: 'var(--font-sans)' }}>

      {/* Sidebar */}
      <aside style={{
        width: '220px',
        background: 'var(--bg-surface)',
        borderRight: '0.5px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '1.5rem 0',
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ padding: '0 1.25rem', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '32px', height: '32px',
              background: 'var(--accent)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px',
            }}>⎈</div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>K8s Dashboard</div>
              <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>v1.32.2</div>
            </div>
          </div>
        </div>

        {/* Cluster status */}
        <div style={{ padding: '0 1.25rem', marginBottom: '1.5rem' }}>
          <div style={{
            background: 'var(--bg-elevated)',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-sm)',
            padding: '10px 12px',
          }}>
            <div style={{ fontSize: '10px', color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Cluster</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--green)', display: 'inline-block', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>production</span>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0 0.75rem' }}>
          <div style={{ fontSize: '10px', color: 'var(--text-muted)', padding: '0 0.5rem', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Navigation</div>
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: currentPage === item.id ? 'var(--accent-dim)' : 'transparent',
                color: currentPage === item.id ? '#a5b4fc' : 'var(--text-secondary)',
                fontSize: '13px',
                fontFamily: 'var(--font-sans)',
                fontWeight: currentPage === item.id ? '500' : '400',
                cursor: 'pointer',
                textAlign: 'left',
                marginBottom: '2px',
                transition: 'all 0.15s',
                borderLeft: currentPage === item.id ? '2px solid var(--accent)' : '2px solid transparent',
              }}
              onMouseEnter={e => { if (currentPage !== item.id) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-primary)'; }}}
              onMouseLeave={e => { if (currentPage !== item.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}}
            >
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ padding: '0 0.75rem' }}>
          <button
            onClick={onLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-secondary)',
              fontSize: '13px',
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--red-dim)'; e.currentTarget.style.color = 'var(--red)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
          >
            <span>⏻</span> Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', padding: '2rem' }}>
        {children}
      </main>
    </div>
  );
}
