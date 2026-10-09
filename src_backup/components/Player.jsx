import { useState, useCallback } from 'react';
import { usePlayer } from '../PlayerContext';
import { getStreamUrl } from '../api';

function formatTime(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function Player({ onQueueToggle, queueOpen }) {
  const { state, dispatch, playSong, seek } = usePlayer();
  const { currentSong, isPlaying, progress, duration, volume, repeatMode, isShuffle, isLoadingStream, likedSongs } = state;
  const [isDragging, setIsDragging] = useState(false);

  const isLiked = currentSong && likedSongs.find(s => s.id === currentSong.id);

  const handleProgressClick = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    seek(ratio * duration);
  }, [duration, seek]);

  const handleNext = () => {
    const { queue, queueIndex, repeatMode } = state;
    const nextIdx = queueIndex + 1;
    if (nextIdx < queue.length) {
      const nextSong = queue[nextIdx];
      dispatch({ type: 'SET_QUEUE', queue, index: nextIdx });
      playSong(nextSong, getStreamUrl, queue);
    } else if (repeatMode === 'all' && queue.length > 0) {
      playSong(queue[0], getStreamUrl, queue);
    }
  };

  const handlePrev = () => {
    if (progress > 3) { seek(0); return; }
    const { queue, queueIndex } = state;
    if (queueIndex > 0) {
      const prevSong = queue[queueIndex - 1];
      dispatch({ type: 'SET_QUEUE', queue, index: queueIndex - 1 });
      playSong(prevSong, getStreamUrl, queue);
    }
  };

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="player">
      {/* ── Track Info ── */}
      <div className="player-track">
        {currentSong ? (
          <>
            <img
              className="player-thumb"
              src={currentSong.image}
              alt={currentSong.title}
              onError={e => { e.target.src = 'https://placehold.co/52x52/111118/555?text=♪'; }}
            />
            <div className="player-track-info">
              <div className="player-track-title">
                {currentSong.title}
                {currentSong.isPreview && (
                  <span style={{ fontSize: 10, background: 'var(--purple)', color: 'white', borderRadius: 6, padding: '2px 6px', marginLeft: 8, verticalAlign: 'middle' }}>30s Preview</span>
                )}
                {currentSong.source === 'youtube' && (
                  <span style={{ fontSize: 10, background: '#ff0000', color: 'white', borderRadius: 6, padding: '2px 6px', marginLeft: 8, verticalAlign: 'middle' }}>▶ YouTube</span>
                )}
                {currentSong.source === 'jiosaavn' && (
                  <span style={{ fontSize: 10, background: '#2B76D4', color: 'white', borderRadius: 6, padding: '2px 6px', marginLeft: 8, verticalAlign: 'middle' }}>♪ JioSaavn</span>
                )}
              </div>
              <div className="player-track-artist">{currentSong.artist}</div>
            </div>
            <button
              className={`player-like-btn ${isLiked ? 'liked' : ''}`}
              onClick={() => dispatch({ type: 'TOGGLE_LIKE', song: currentSong })}
              title={isLiked ? 'Unlike' : 'Like'}
            >
              {isLiked ? '♥' : '♡'}
            </button>
          </>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>No song playing</div>
        )}
      </div>

      {/* ── Controls ── */}
      <div className="player-controls">
        <div className="player-buttons">
          <button
            className={`ctrl-btn ${isShuffle ? 'active' : ''}`}
            title="Shuffle"
            onClick={() => dispatch({ type: 'TOGGLE_SHUFFLE' })}
          >⇌</button>
          <button className="ctrl-btn" title="Previous" onClick={handlePrev}>⏮</button>
          <button
            className="play-pause-btn"
            onClick={() => {
              if (!currentSong) return;
              dispatch({ type: 'TOGGLE_PLAY' });
            }}
            disabled={isLoadingStream}
          >
            {isLoadingStream ? '⏳' : isPlaying ? '⏸' : '▶'}
          </button>
          <button className="ctrl-btn" title="Next" onClick={handleNext}>⏭</button>
          <button
            className={`ctrl-btn ${repeatMode !== 'none' ? 'active' : ''}`}
            title={`Repeat: ${repeatMode}`}
            onClick={() => dispatch({ type: 'CYCLE_REPEAT' })}
          >
            {repeatMode === 'one' ? '🔂' : '🔁'}
          </button>
        </div>

        {/* Progress */}
        <div className="progress-wrap">
          <span className="progress-time">{formatTime(progress)}</span>
          <div className="progress-bar-track" onClick={handleProgressClick}>
            <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <span className="progress-time right">{formatTime(duration)}</span>
        </div>
      </div>

      {/* ── Extra (Volume, Queue) ── */}
      <div className="player-extra">
        <div className="volume-wrap">
          <span className="volume-icon">
            {volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
          </span>
          <input
            type="range" className="volume-slider"
            min="0" max="1" step="0.01"
            value={volume}
            onChange={e => dispatch({ type: 'SET_VOLUME', volume: parseFloat(e.target.value) })}
          />
        </div>
        <button
          className={`queue-btn ${queueOpen ? 'active' : ''}`}
          title="Queue"
          onClick={onQueueToggle}
        >≡</button>
      </div>
    </div>
  );
}
