import { usePlayer } from '../PlayerContext';
import { getStreamUrl } from '../api';

function formatTime(sec) {
  if (!sec || isNaN(sec)) return '';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function SongRow({ song, index, songs, showNum = true, onAddToPlaylist }) {
  const { state, playSong, dispatch } = usePlayer();
  const isActive = state.currentSong?.id === song.id;
  const isLiked = state.likedSongs.find(s => s.id === song.id);

  const handlePlay = () => {
    if (isActive) dispatch({ type: 'TOGGLE_PLAY' });
    else playSong(song, getStreamUrl, songs);
  };

  const handleAddToQueue = (e) => {
    e.stopPropagation();
    dispatch({ type: 'SET_QUEUE', queue: [...state.queue, song], index: state.queueIndex });
  };

  return (
    <div className={`song-row ${isActive ? 'active' : ''}`} onClick={handlePlay}>
      {showNum && (
        <div className="song-row-num">
          {isActive && state.isPlaying && !state.isLoadingStream ? (
            <div className="equalizer-wave" style={{ height: 14, gap: '2px', justifyContent: 'center' }}>
              <div className="eq-wave-bar" style={{ width: '2px', animationDelay: '0s', animationDuration: '0.6s' }} />
              <div className="eq-wave-bar" style={{ width: '2px', animationDelay: '0.15s', animationDuration: '0.5s' }} />
              <div className="eq-wave-bar" style={{ width: '2px', animationDelay: '0.3s', animationDuration: '0.7s' }} />
            </div>
          ) : (
            <span>{index + 1}</span>
          )}
        </div>
      )}
      <img
        className="song-row-thumb"
        src={song.image}
        alt={song.title}
        onError={e => { e.target.src = 'https://placehold.co/44x44/111118/555?text=♪'; }}
      />
      <div className="song-row-info">
        <div className="song-row-title">{song.title}</div>
        <div className="song-row-artist">{song.artist}</div>
      </div>
      <div className="song-row-actions">
        <button
          className={`row-action-btn ${isLiked ? 'liked' : ''}`}
          title="Like"
          onClick={e => { e.stopPropagation(); dispatch({ type: 'TOGGLE_LIKE', song }); }}
        >{isLiked ? '♥' : '♡'}</button>
        <button className="row-action-btn" title="Add to queue" onClick={handleAddToQueue}>+</button>
        {onAddToPlaylist && (
          <button
            className="row-action-btn"
            title="Add to playlist"
            onClick={e => { e.stopPropagation(); onAddToPlaylist(song); }}
          >⊕</button>
        )}
      </div>
    </div>
  );
}
