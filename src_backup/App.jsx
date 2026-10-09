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
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">▶</div>
          <span>PLAY</span>
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
              <span style={{ marginLeft: 'auto', fontSize: 11, background: 'var(--accent)', color: 'white', borderRadius: 10, padding: '2px 7px' }}>
                {state.likedSongs.length}
              </span>
            )}
          </div>
        </div>

        <div className="nav-section" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="nav-label">Playlists</div>
          <div className="playlist-list">
            {playlists.map(pl => (
              <div
                key={pl.id}
                className={`playlist-item ${view === 'playlist' && activePlaylistId === pl.id ? 'active' : ''}`}
                onClick={() => { setView('playlist'); setActivePlaylistId(pl.id); }}
              >
                <span className="pl-icon">🎵</span>
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pl.name}</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{pl.songs.length}</span>
              </div>
            ))}
          </div>
          <div className="create-playlist-btn" onClick={() => setShowCreatePlaylist(true)}>
            <span>＋</span> New Playlist
          </div>
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
            <h3>Create Playlist</h3>
            <input
              type="text"
              placeholder="Playlist name..."
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
            <h3>Add to Playlist</h3>
            {playlists.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>
                No playlists yet. Create one first!
              </p>
            ) : (
              <div className="song-list" style={{ maxHeight: 280, overflow: 'auto', marginBottom: 16 }}>
                {playlists.map(pl => (
                  <div
                    key={pl.id}
                    className="song-row"
                    style={{ padding: '10px 8px', borderRadius: 8 }}
                    onClick={() => handlePickPlaylist(pl.id)}
                  >
                    <span style={{ fontSize: 18 }}>🎵</span>
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
              <button className="btn btn-primary" onClick={() => { setShowCreatePlaylist(true); setShowAddToPlaylist(false); }}>+ New Playlist</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
