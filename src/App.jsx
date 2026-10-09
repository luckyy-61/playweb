import { useState } from 'react';
import { usePlayer } from './PlayerContext';
import HomeScreen from './screens/HomeScreen';
import Player from './components/Player';
import QueuePanel from './components/QueuePanel';

export default function App() {
  const [view, setView] = useState('home');
  const [activePlaylistId, setActivePlaylistId] = useState(null);
  const [queueOpen, setQueueOpen] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [addToPlaylistSong, setAddToPlaylistSong] = useState(null);
  const [showAddToPlaylist, setShowAddToPlaylist] = useState(false);

  const { state, dispatch } = usePlayer();
  const { playlists } = state;

  const handleCreatePlaylist = () => {
    if (!newPlaylistName.trim()) return;
    dispatch({ type: 'CREATE_PLAYLIST', name: newPlaylistName.trim() });
    setNewPlaylistName('');
    setShowCreatePlaylist(false);
  };

  const handleAddToPlaylist = (song) => {
    setAddToPlaylistSong(song);
    setShowAddToPlaylist(true);
  };

  const handlePickPlaylist = (playlistId) => {
    dispatch({ type: 'ADD_TO_PLAYLIST', playlistId, song: addToPlaylistSong });
    setShowAddToPlaylist(false);
    setAddToPlaylistSong(null);
  };

  return (
    <div className="app">
      {/* ── Background Aurora Blobs ── */}
      <div className="ambient-glow-blob blob-purple" />
      <div className="ambient-glow-blob blob-magenta" />

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">▶</div>
          <span className="logo-text">PLAY</span>
        </div>

        <div className="nav-section">
          <div className="nav-label">Menu</div>
          <div
            className={`nav-item ${view === 'home' ? 'active' : ''}`}
            onClick={() => { setView('home'); setActivePlaylistId(null); }}
          >
            <span className="nav-icon">🏠</span> Home
          </div>
          <div
            className={`nav-item ${view === 'liked' ? 'active' : ''}`}
            onClick={() => setView('liked')}
          >
            <span className="nav-icon">♥</span> Liked Songs
            {state.likedSongs.length > 0 && (
              <span style={{
                marginLeft: 'auto', fontSize: 11, fontWeight: 700,
                background: 'linear-gradient(135deg, var(--g1), var(--g2))',
                color: 'white', borderRadius: 12, padding: '2px 8px'
              }}>
                {state.likedSongs.length}
              </span>
            )}
          </div>
        </div>

        <div className="nav-section" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="nav-label">Your Library</div>
          <div className="playlist-list">
            {playlists.length === 0 && (
              <div style={{ padding: '12px 10px', color: 'var(--text3)', fontSize: 13 }}>
                No playlists yet
              </div>
            )}
            {playlists.map(pl => (
              <div
                key={pl.id}
                className={`playlist-item ${view === 'playlist' && activePlaylistId === pl.id ? 'active' : ''}`}
                onClick={() => { setView('playlist'); setActivePlaylistId(pl.id); }}
              >
                <span className="pl-icon">🎵</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pl.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0 }}>{pl.songs.length}</span>
              </div>
            ))}
          </div>
          <div className="create-playlist-btn" onClick={() => setShowCreatePlaylist(true)}>
            <span style={{ fontSize: 18 }}>＋</span> New Playlist
          </div>
        </div>

        {/* Sidebar footer gradient bar */}
        <div style={{
          marginTop: 20, height: 2, borderRadius: 2,
          background: 'linear-gradient(90deg, var(--g1), var(--g2))',
          opacity: 0.3
        }} />
        <div style={{ padding: '12px 8px 0', color: 'var(--text3)', fontSize: 11, textAlign: 'center' }}>
          PLAY — Stream everything. Free.
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main">
        <HomeScreen
          view={view}
          playlistId={activePlaylistId}
          onAddToPlaylist={handleAddToPlaylist}
        />
      </main>

      {/* ── Player ── */}
      <Player
        onQueueToggle={() => setQueueOpen(o => !o)}
        queueOpen={queueOpen}
      />

      {/* ── Queue Panel ── */}
      <QueuePanel open={queueOpen} onClose={() => setQueueOpen(false)} />

      {/* ── Create Playlist Modal ── */}
      {showCreatePlaylist && (
        <div className="modal-overlay" onClick={() => setShowCreatePlaylist(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>✨ Create Playlist</h3>
            <input
              type="text"
              placeholder="Give it a name..."
              value={newPlaylistName}
              onChange={e => setNewPlaylistName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreatePlaylist()}
              autoFocus
            />
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowCreatePlaylist(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreatePlaylist}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add to Playlist Modal ── */}
      {showAddToPlaylist && (
        <div className="modal-overlay" onClick={() => setShowAddToPlaylist(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>🎵 Add to Playlist</h3>
            {playlists.length === 0 ? (
              <p style={{ color: 'var(--text2)', marginBottom: 16, fontSize: 14, lineHeight: 1.6 }}>
                You have no playlists yet.<br/>Create one first!
              </p>
            ) : (
              <div className="song-list" style={{ maxHeight: 280, overflow: 'auto', marginBottom: 16 }}>
                {playlists.map(pl => (
                  <div
                    key={pl.id}
                    className="song-row"
                    style={{ padding: '10px 8px', borderRadius: 10 }}
                    onClick={() => handlePickPlaylist(pl.id)}
                  >
                    <span style={{ fontSize: 20 }}>🎵</span>
                    <div className="song-row-info">
                      <div className="song-row-title">{pl.name}</div>
                      <div className="song-row-artist">{pl.songs.length} songs</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setShowAddToPlaylist(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => { setShowCreatePlaylist(true); setShowAddToPlaylist(false); }}>
                + New Playlist
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
