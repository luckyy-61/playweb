import { useState } from 'react';

export default function SetupScreen({ onComplete }) {
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleConnect = async () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      setError('Please enter both Client ID and Client Secret.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      // Test credentials
      const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + btoa(`${clientId.trim()}:${clientSecret.trim()}`),
        },
        body: 'grant_type=client_credentials',
      });
      if (!res.ok) throw new Error('invalid');
      saveCredentials(clientId.trim(), clientSecret.trim());
      onComplete();
    } catch {
      setError('Invalid credentials. Check your Client ID and Secret and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 440,
        background: 'var(--bg-secondary)', border: '1px solid var(--glass-border)',
        borderRadius: 24, padding: 40,
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, var(--accent), var(--purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 30,
          }}>▶</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, background: 'linear-gradient(135deg, var(--accent), var(--purple))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            PLAY
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 8 }}>
            Connect your Spotify developer account to unlock the full music database.
          </p>
        </div>

        {/* Steps */}
        <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--glass-border)',
          borderRadius: 14, padding: 20, marginBottom: 24, fontSize: 13,
          color: 'var(--text-secondary)', lineHeight: 1.8,
        }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: 10 }}>How to get your credentials (free):</div>
          <div>1. Go to <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>developer.spotify.com/dashboard</a></div>
          <div>2. Log in and click <strong style={{ color: 'var(--text-primary)' }}>"Create App"</strong></div>
          <div>3. Set any name & redirect URI (e.g. <code style={{ background: 'rgba(255,255,255,0.07)', padding: '1px 5px', borderRadius: 4 }}>http://localhost</code>)</div>
          <div>4. Copy your <strong style={{ color: 'var(--text-primary)' }}>Client ID</strong> and <strong style={{ color: 'var(--text-primary)' }}>Client Secret</strong> here</div>
        </div>

        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
          <input
            style={{
              padding: '12px 16px', borderRadius: 12, border: '1px solid var(--glass-border)',
              background: 'var(--glass)', color: 'var(--text-primary)', fontSize: 14, outline: 'none',
            }}
            placeholder="Spotify Client ID"
            value={clientId}
            onChange={e => setClientId(e.target.value)}
            autoComplete="off"
          />
          <input
            style={{
              padding: '12px 16px', borderRadius: 12, border: '1px solid var(--glass-border)',
              background: 'var(--glass)', color: 'var(--text-primary)', fontSize: 14, outline: 'none',
            }}
            type="password"
            placeholder="Spotify Client Secret"
            value={clientSecret}
            onChange={e => setClientSecret(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleConnect()}
          />
        </div>

        {error && (
          <div style={{ color: '#ff6b6b', fontSize: 13, marginBottom: 14, textAlign: 'center' }}>{error}</div>
        )}

        <button
          onClick={handleConnect}
          disabled={loading}
          style={{
            width: '100%', padding: '14px', borderRadius: 50,
            background: loading ? 'var(--glass)' : 'linear-gradient(135deg, var(--accent), var(--purple))',
            color: 'white', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer',
            border: 'none', transition: 'opacity 0.2s',
          }}
        >
          {loading ? 'Connecting...' : '🎵 Connect to Spotify'}
        </button>

        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-muted)', marginTop: 16 }}>
          Your credentials are stored only in your browser. We never send them to any server.
        </p>
      </div>
    </div>
  );
}
