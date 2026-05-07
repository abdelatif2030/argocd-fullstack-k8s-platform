import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = '/api';

const MOCK_PODS = [
  { name: 'backend-7484df889d-lb9m7', namespace: 'production-app', status: 'Running', restarts: 0, age: '27m', ready: '1/1' },
  { name: 'backend-7484df889d-z7rw9', namespace: 'production-app', status: 'Running', restarts: 0, age: '27m', ready: '1/1' },
  { name: 'frontend-68968b7ddc-6m7hh', namespace: 'production-app', status: 'Running', restarts: 0, age: '27m', ready: '1/1' },
  { name: 'frontend-68968b7ddc-6wsmh', namespace: 'production-app', status: 'Running', restarts: 0, age: '27m', ready: '1/1' },
  { name: 'postgres-0', namespace: 'production-app', status: 'Running', restarts: 0, age: '27m', ready: '1/1' },
  { name: 'argocd-application-controller-0', namespace: 'argocd', status: 'Running', restarts: 0, age: '25m', ready: '1/1' },
  { name: 'argocd-applicationset-controller-85b88fdf48-rf8ff', namespace: 'argocd', status: 'Running', restarts: 6, age: '25m', ready: '1/1' },
  { name: 'argocd-dex-server-845756b4d9-4hxzm', namespace: 'argocd', status: 'Running', restarts: 1, age: '25m', ready: '1/1' },
  { name: 'argocd-notifications-controller-6fc87b677c-5v2q4', namespace: 'argocd', status: 'Running', restarts: 0, age: '25m', ready: '1/1' },
  { name: 'argocd-redis-5fb947d99-q79qs', namespace: 'argocd', status: 'Running', restarts: 0, age: '25m', ready: '1/1' },
  { name: 'argocd-repo-server-78d447bf85-hnvbg', namespace: 'argocd', status: 'Running', restarts: 0, age: '25m', ready: '1/1' },
  { name: 'argocd-server-5799948b66-5cqkt', namespace: 'argocd', status: 'Running', restarts: 0, age: '25m', ready: '1/1' },
];

function StatusBadge({ status }) {
  const colors = {
    Running: { bg: 'var(--green-dim)', color: 'var(--green)', border: 'rgba(34,211,165,0.2)' },
    Pending: { bg: 'var(--amber-dim)', color: 'var(--amber)', border: 'rgba(245,158,11,0.2)' },
    Failed:  { bg: 'var(--red-dim)',   color: 'var(--red)',   border: 'rgba(248,113,113,0.2)' },
    CrashLoopBackOff: { bg: 'var(--red-dim)', color: 'var(--red)', border: 'rgba(248,113,113,0.2)' },
  };
  const c = colors[status] || colors.Failed;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      fontSize: '11px', fontWeight: '500',
      padding: '3px 9px', borderRadius: '20px',
      background: c.bg, color: c.color,
      border: `0.5px solid ${c.border}`,
    }}>
      <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: c.color, display: 'inline-block' }} />
      {status}
    </span>
  );
}

function StatCard({ label, value, color, sub }) {
  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-md)',
      padding: '1.25rem',
      animation: 'fadeIn 0.3s ease forwards',
    }}>
      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '28px', fontWeight: '600', color: color || 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [pods] = useState(MOCK_PODS);
  const [health, setHealth] = useState(null);
  const [nsFilter, setNsFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const checkHealth = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/health`);
      setHealth(res.data);
    } catch {
      setHealth({ status: 'disconnected' });
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await checkHealth();
    setLastUpdated(new Date());
    setTimeout(() => setRefreshing(false), 800);
  };

  const filtered = nsFilter === 'all' ? pods : pods.filter(p => p.namespace === nsFilter);
  const running = filtered.filter(p => p.status === 'Running').length;
  const unhealthy = filtered.filter(p => p.status !== 'Running').length;
  const namespaces = [...new Set(pods.map(p => p.namespace))];

  return (
    <div style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>Cluster Overview</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            production-cluster · kind-production-cluster
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
            Updated {lastUpdated.toLocaleTimeString()}
          </span>
          <button
            onClick={handleRefresh}
            style={{
              background: 'var(--bg-elevated)',
              border: '0.5px solid var(--border-bright)',
              borderRadius: 'var(--radius-sm)',
              padding: '7px 14px',
              color: 'var(--text-secondary)',
              fontSize: '12px',
              fontFamily: 'var(--font-sans)',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ display: 'inline-block', animation: refreshing ? 'spin 0.6s linear infinite' : 'none' }}>↻</span>
            Refresh
          </button>
        </div>
      </div>

      {/* API Health Banner */}
      {health && (
        <div style={{
          marginBottom: '1.5rem',
          padding: '10px 16px',
          borderRadius: 'var(--radius-sm)',
          background: health.status === 'healthy' ? 'var(--green-dim)' : 'var(--red-dim)',
          border: `0.5px solid ${health.status === 'healthy' ? 'rgba(34,211,165,0.2)' : 'rgba(248,113,113,0.2)'}`,
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '13px',
          color: health.status === 'healthy' ? 'var(--green)' : 'var(--red)',
          animation: 'fadeIn 0.3s ease forwards',
        }}>
          <span>{health.status === 'healthy' ? '✓' : '✗'}</span>
          Backend API: <strong>{health.status}</strong>
          {health.timestamp && <span style={{ marginLeft: 'auto', fontSize: '11px', fontFamily: 'var(--font-mono)', opacity: 0.7 }}>{new Date(health.timestamp).toLocaleTimeString()}</span>}
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: '12px', marginBottom: '2rem' }}>
        <StatCard label="Total pods" value={filtered.length} color="var(--blue)" sub="in selected namespace" />
        <StatCard label="Running" value={running} color="var(--green)" sub="healthy" />
        <StatCard label="Unhealthy" value={unhealthy} color={unhealthy > 0 ? 'var(--amber)' : 'var(--green)'} sub="need attention" />
        <StatCard label="Namespaces" value={namespaces.length} color="var(--accent)" sub={namespaces.join(' · ')} />
      </div>

      {/* Pods table */}
      <div style={{ background: 'var(--bg-surface)', border: '0.5px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        {/* Table header row */}
        <div style={{ padding: '1rem 1.5rem', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)', marginRight: '8px' }}>Pods</span>

          {/* NS Filter buttons */}
          <button
            onClick={() => setNsFilter('all')}
            style={{
              fontSize: '11px', padding: '4px 12px', borderRadius: '20px', cursor: 'pointer',
              border: '0.5px solid', fontFamily: 'var(--font-sans)',
              background: nsFilter === 'all' ? 'var(--accent-dim)' : 'transparent',
              borderColor: nsFilter === 'all' ? 'var(--accent)' : 'var(--border-bright)',
              color: nsFilter === 'all' ? '#a5b4fc' : 'var(--text-secondary)',
              transition: 'all 0.15s',
            }}
          >All</button>
          {namespaces.map(ns => (
            <button
              key={ns}
              onClick={() => setNsFilter(ns)}
              style={{
                fontSize: '11px', padding: '4px 12px', borderRadius: '20px', cursor: 'pointer',
                border: '0.5px solid', fontFamily: 'var(--font-sans)',
                background: nsFilter === ns ? 'var(--accent-dim)' : 'transparent',
                borderColor: nsFilter === ns ? 'var(--accent)' : 'var(--border-bright)',
                color: nsFilter === ns ? '#a5b4fc' : 'var(--text-secondary)',
                transition: 'all 0.15s',
              }}
            >{ns}</button>
          ))}
        </div>

        {/* Column headers */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2.5fr 1.2fr 1fr 0.6fr 0.6fr',
          padding: '8px 1.5rem',
          background: 'var(--bg-elevated)',
          borderBottom: '0.5px solid var(--border)',
          fontSize: '11px', color: 'var(--text-secondary)',
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          <span>Pod name</span>
          <span>Namespace</span>
          <span>Status</span>
          <span>Restarts</span>
          <span>Age</span>
        </div>

        {/* Rows */}
        {filtered.map((pod, i) => (
          <div
            key={pod.name}
            style={{
              display: 'grid', gridTemplateColumns: '2.5fr 1.2fr 1fr 0.6fr 0.6fr',
              padding: '11px 1.5rem',
              borderBottom: i < filtered.length - 1 ? '0.5px solid var(--border)' : 'none',
              alignItems: 'center',
              transition: 'background 0.1s',
              animation: `fadeIn 0.2s ease ${i * 0.03}s both`,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ fontSize: '12px', color: '#c7d2fe', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: '1rem' }}>
              {pod.name}
            </span>
            <span>
              <span style={{
                fontSize: '11px', padding: '3px 9px', borderRadius: '20px',
                background: 'var(--accent-dim)', color: '#a5b4fc',
                border: '0.5px solid rgba(99,102,241,0.25)',
              }}>{pod.namespace}</span>
            </span>
            <span><StatusBadge status={pod.status} /></span>
            <span style={{
              fontSize: '13px', fontFamily: 'var(--font-mono)',
              color: pod.restarts > 2 ? 'var(--amber)' : pod.restarts > 0 ? 'var(--text-secondary)' : 'var(--text-secondary)',
              fontWeight: pod.restarts > 2 ? '500' : '400',
            }}>{pod.restarts}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{pod.age}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
