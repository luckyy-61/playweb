import { usePlayer } from '../PlayerContext';
import { getStreamUrl } from '../api';
import SongRow from './SongRow';

export default function QueuePanel({ open, onClose }) {
  const { state, dispatch, playSong } = usePlayer();
  const { queue, queueIndex, currentSong } = state;

  return (
    <div className={`queue-panel ${open ? 'open' : ''}`}>
      <div className="queue-panel-header">
        <span>Queue ({queue.length})</span>
        <button onClick={onClose} style={{ fontSize: 20, color: 'var(--text-secondary)' }}>✕</button>
      </div>
      <div className="queue-panel-body">
        {queue.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎶</div>
            <p>Your queue is empty.<br />Search for songs to add them!</p>
          </div>
        ) : (
          queue.map((song, i) => (
            <SongRow
              key={`${song.id}-${i}`}
              song={song}
              index={i}
              songs={queue}
              showNum={true}
            />
          ))
        )}
      </div>
    </div>
  );
}
