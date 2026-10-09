import { useState, useEffect } from 'react';
import SongCard from '../components/SongCard';
import SongRow from '../components/SongRow';
import { getTrending, searchSongs } from '../api';
import { usePlayer } from '../PlayerContext';

export default function HomeScreen({ view, playlistId, onAddToPlaylist }) {
  const [trending, setTrending] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [trendingLoading, setTrendingLoading] = useState(true);
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

  // ── Liked Songs View ──
  if (view === 'liked') {
    const { likedSongs } = state;
    return (
      <div className="main-content">
        <div className="section-title"><span>♥</span> Liked Songs</div>
        {likedSongs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">♡</div>
            <p>Songs you like will appear here.</p>
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
      <div className="main-content">
        <div className="section-title"><span>🎵</span> {playlist.name}</div>
        {playlist.songs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎶</div>
            <p>No songs yet. Search for songs and add them here!</p>
          </div>
        ) : (
          <div className="song-list">
            {playlist.songs.map((song, i) => (
              <SongRow
                key={song.id} song={song} index={i} songs={playlist.songs}
                onAddToPlaylist={onAddToPlaylist}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Home View ──
  return (
    <>
      <div className="search-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            className="search-input"
            type="text"
            placeholder="Search for songs, artists..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            autoComplete="off"
          />
        </div>
      </div>

      <div className="main-content">
        {searchQuery.trim() ? (
          <>
            <div className="section-title">
              <span>🔍</span>
              {loading ? 'Searching...' : `Results for "${searchQuery}"`}
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
                <p>No results found. Try a different search.</p>
              </div>
            )}
          </>
        ) : (
          <>
            <div className="section-title"><span>🔥</span> Trending Now</div>
            {trendingLoading ? (
              <div className="spinner" />
            ) : (
              <div className="songs-grid">
                {trending.map(song => (
                  <SongCard key={song.id} song={song} songs={trending} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
