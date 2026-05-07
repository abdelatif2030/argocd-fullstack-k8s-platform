import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = '/api';

function App() {
  const [users, setUsers] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetchUsers();
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      const res = await axios.get(`${API_URL}/health`);
      setHealth(res.data);
    } catch {
      setHealth({ status: 'disconnected' });
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/users`);
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/api/users`, { name, email });
      setName('');
      setEmail('');
      fetchUsers();
    } catch (err) {
      alert('Error creating user: ' + err.message);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🚀 Production App</h1>
        <div className={`health-status ${health?.status}`}>
          API Status: {health?.status || 'checking...'}
        </div>
      </header>
      
      <main>
        <form onSubmit={handleSubmit} className="user-form">
          <h2>Add User</h2>
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Add User</button>
        </form>

        <div className="users-list">
          <h2>Users ({users.length})</h2>
          {users.map(user => (
            <div key={user.id} className="user-card">
              <strong>{user.name}</strong>
              <span>{user.email}</span>
              <small>{new Date(user.created_at).toLocaleDateString()}</small>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;