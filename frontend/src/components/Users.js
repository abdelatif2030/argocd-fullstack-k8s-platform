import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = '/api';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setFetching(true);
    try {
      const res = await axios.get(`${API_URL}/api/users`);
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setFetching(false);
    }
  };

  const handleSubmit = async () => {
    if (!name || !email) { setError('Name and email are required'); return; }
    setLoading(true);
    setError('');
    try {
      await axios.post(`${API_URL}/api/users`, { name, email });
      setName('');
      setEmail('');
      fetchUsers();
    } catch (err) {
      setError('Error creating user: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
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
  };

  return (
    <div style={{ fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '20px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '4px' }}>Users</h1>
        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Manage application users</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'start' }}>

        {/* Add user form */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          animation: 'fadeIn 0.3s ease forwards',
        }}>
          <h2 style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)', marginBottom: '1.25rem' }}>Add user</h2>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Name</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-bright)'}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Email</label>
            <input
              style={inputStyle}
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              onFocus={e => e.target.style.borderColor = 'var(--accent)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-bright)'}
            />
          </div>

          {error && <p style={{ fontSize: '12px', color: 'var(--red)', marginBottom: '0.75rem' }}>{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: '100%',
              background: 'var(--accent)',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              padding: '10px',
              color: '#fff',
              fontSize: '13px',
              fontWeight: '500',
              fontFamily: 'var(--font-sans)',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Adding...' : '+ Add user'}
          </button>
        </div>

        {/* Users list */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'hidden',
          animation: 'fadeIn 0.3s ease 0.1s both',
        }}>
          <div style={{ padding: '1rem 1.5rem', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--text-primary)' }}>All users</span>
            <span style={{
              fontSize: '11px', padding: '3px 9px', borderRadius: '20px',
              background: 'var(--accent-dim)', color: '#a5b4fc',
              border: '0.5px solid rgba(99,102,241,0.25)',
            }}>{users.length}</span>
          </div>

          {/* Column headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr',
            padding: '8px 1.5rem',
            background: 'var(--bg-elevated)',
            borderBottom: '0.5px solid var(--border)',
            fontSize: '11px', color: 'var(--text-secondary)',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            <span>Name</span>
            <span>Email</span>
            <span>Created</span>
          </div>

          {fetching ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              Loading...
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '13px' }}>
              No users yet. Add one to get started.
            </div>
          ) : (
            users.map((user, i) => (
              <div
                key={user.id}
                style={{
                  display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr',
                  padding: '11px 1.5rem',
                  borderBottom: i < users.length - 1 ? '0.5px solid var(--border)' : 'none',
                  alignItems: 'center',
                  animation: `fadeIn 0.2s ease ${i * 0.04}s both`,
                  transition: 'background 0.1s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: '500' }}>{user.name}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{user.email}</span>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                  {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
