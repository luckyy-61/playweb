import { useState, useEffect, useRef } from 'react';
import SongCard from '../components/SongCard';
import SongRow from '../components/SongRow';
import { getTrending, searchSongs } from '../api';
import { usePlayer } from '../PlayerContext';

function SkeletonGrid() {
  return (
    <div className="songs-grid">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} style={{ animationDelay: `${i * 0.05}s`, animation: 'cardReveal 0.5s ease both' }}>
          <div className="skeleton" style={{ aspectRatio: '1', borderRadius: 12, marginBottom: 14 }} />
          <div className="skeleton" style={{ height: 13, width: '80%', borderRadius: 6, marginBottom: 8 }} />
          <div className="skeleton" style={{ height: 11, width: '55%', borderRadius: 6 }} />
        </div>
      ))}
    </div>
  );
}

export default function HomeScreen({ view, playlistId, onAddToPlaylist }) {
  const [trending, setTrending] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [searchFocused, setSearchFocused] = useState(false);
  const inputRef = useRef(null);
  const { state, dispatch } = usePlayer();

  useEffect(() => {
    setTrendingLoading(true);
    getTrending()
      .then(data => setTrending(data.slice(0, 20)))
      .catch(console.error)
      .finally(() => setTrendingLoading(false));
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timer = setTimeout(() => {
      setLoading(true);
      searchSongs(searchQuery)
        .then(setSearchResults)
        .catch(console.error)
        .finally(() => setLoading(false));
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Global / key shortcut — press / to focus search
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // ── Liked Songs View ──
  if (view === 'liked') {
    const { likedSongs } = state;
    return (
      <div className="main-content" style={{ animation: 'slideUp 0.4s ease' }}>
        <div className="section-title">
          <span style={{ background: 'linear-gradient(135deg, #e040fb, #6c3bf5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>♥</span>
          Liked Songs
          {likedSongs.length > 0 && (
            <span style={{ fontSize: 14, background: 'rgba(224,64,251,0.15)', border: '1px solid rgba(224,64,251,0.3)', color: 'var(--g2)', borderRadius: 20, padding: '2px 10px', fontFamily: 'Inter', fontWeight: 600 }}>
              {likedSongs.length}
            </span>
          )}
        </div>
        {likedSongs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">♡</div>
            <p>Songs you like will appear here.<br/>Hit that heart button!</p>
          </div>
        ) : (
          <div className="song-list">
            {likedSongs.map((song, i) => (
              <SongRow key={song.id} song={song} index={i} songs={likedSongs} onAddToPlaylist={onAddToPlaylist} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Playlist View ──
  if (view === 'playlist' && playlistId !== null) {
    const playlist = state.playlists.find(p => p.id === playlistId);
    if (!playlist) return null;
    return (
      <div className="main-content" style={{ animation: 'slideUp 0.4s ease' }}>
        <div className="section-title">
          <span>🎵</span> {playlist.name}
          <span style={{ fontSize: 14, background: 'rgba(108,59,245,0.15)', border: '1px solid rgba(108,59,245,0.3)', color: 'var(--g1)', borderRadius: 20, padding: '2px 10px', fontFamily: 'Inter', fontWeight: 600 }}>
            {playlist.songs.length} songs
          </span>
        </div>
        {playlist.songs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎶</div>
            <p>This playlist is empty.<br/>Search for songs and add them!</p>
          </div>
        ) : (
          <div className="song-list">
            {playlist.songs.map((song, i) => (
              <SongRow key={song.id} song={song} index={i} songs={playlist.songs} onAddToPlaylist={onAddToPlaylist} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Home View ──
  return (
    <>
      {/* Search bar */}
      <div className="search-bar">
        <div className="search-input-wrap">
          <span className="search-icon" style={{ color: searchFocused ? 'var(--g1)' : undefined }}>
            {loading ? (
              <span style={{ display: 'inline-block', animation: 'spin 0.6s linear infinite' }}>⌛</span>
            ) : '🔍'}
          </span>
          <input
            ref={inputRef}
            className="search-input"
            type="text"
            placeholder='Search songs, artists… (press / to focus)'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            autoComplete="off"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
                fontSize: 16, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer',
                transition: 'color 0.2s'
              }}
              onMouseEnter={e => e.target.style.color = 'var(--text)'}
              onMouseLeave={e => e.target.style.color = 'var(--text3)'}
            >✕</button>
          )}
        </div>
      </div>

      <div className="main-content">
        {searchQuery.trim() ? (
          <div style={{ animation: 'slideUp 0.3s ease' }}>
            <div className="section-title">
              <span>🔍</span>
              {loading ? 'Searching...' : `"${searchQuery}"`}
              {!loading && searchResults.length > 0 && (
                <span style={{ fontSize: 14, color: 'var(--text3)', fontFamily: 'Inter', fontWeight: 400 }}>
                  {searchResults.length} results
                </span>
              )}
            </div>
            {loading ? (
              <div className="spinner" />
            ) : searchResults.length > 0 ? (
              <div className="song-list">
                {searchResults.map((song, i) => (
                  <SongRow
                    key={song.id} song={song} index={i} songs={searchResults}
                    onAddToPlaylist={onAddToPlaylist}
                  />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">😕</div>
                <p>No results for "{searchQuery}".<br/>Try different keywords!</p>
              </div>
            )}
          </div>
        ) : (
          <div style={{ animation: 'slideUp 0.4s ease' }}>
            {/* Hero greeting */}
            <div style={{ marginBottom: 36 }}>
              <h1 style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: 42,
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: '-1px',
                marginBottom: 10,
                background: 'linear-gradient(135deg, #ffffff 0%, #a0a0ff 40%, #e040fb 80%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                What are we<br/>playing today?
              </h1>
              <p style={{ color: 'var(--text2)', fontSize: 15, fontWeight: 400, letterSpacing: '0.2px' }}>
                Discover, search, and stream millions of songs — free.
              </p>
            </div>

            <div className="section-title">
              <span style={{ animation: 'floatIcon 2s ease-in-out infinite', display: 'inline-block' }}>🔥</span>
              Trending Now
            </div>
            {trendingLoading ? <SkeletonGrid /> : (
              <div className="songs-grid">
                {trending.map((song, i) => (
                  <div key={song.id} style={{ animationDelay: `${i * 0.04}s` }}>
                    <SongCard song={song} songs={trending} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
