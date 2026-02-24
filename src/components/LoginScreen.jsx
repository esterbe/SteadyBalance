import { useState } from 'react';

export default function LoginScreen({ onLogin, message }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Login failed');
        setLoading(false);
        return;
      }
      localStorage.setItem('sb-token', data.token);
      onLogin(data.token);
    } catch {
      setError('Connection error');
      setLoading(false);
    }
  };

  return (
    <div className="ma-app">
      <header className="ma-header">
        <img src="/steadybalance-logo.svg" alt="SteadyBalance" className="ma-logo" />
        <div className="ma-header-text">
          <span className="ma-title">Steady Balance</span>
          <span className="ma-subtitle">Portfolio Rebalancing Tool</span>
        </div>
      </header>
      <main className="ma-main">
        <form className="ma-login-form" onSubmit={handleSubmit}>
          <h2 className="ma-login-heading">Sign In</h2>
          {message && <p className="ma-login-message">{message}</p>}
          <label className="ma-login-label">
            Email
            <input
              type="email"
              className="ma-login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </label>
          <label className="ma-login-label">
            Password
            <input
              type="password"
              className="ma-login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <p className="ma-login-error">{error}</p>}
          <button
            type="submit"
            className="ma-btn ma-btn--active ma-login-btn"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </main>
    </div>
  );
}
