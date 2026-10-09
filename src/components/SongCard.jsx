import { usePlayer } from '../PlayerContext';
import { getStreamUrl } from '../api';

export default function SongCard({ song, songs }) {
  const { state, playSong, dispatch } = usePlayer();
  const isActive = state.currentSong?.id === song.id;
  const isLiked = state.likedSongs.find(s => s.id === song.id);

  const handlePlay = () => {
    if (isActive) dispatch({ type: 'TOGGLE_PLAY' });
    else playSong(song, getStreamUrl, songs);
  };

  return (
    <div className={`song-card ${isActive ? 'active' : ''}`} onClick={handlePlay}>
      <div className="song-card-thumb">
        <img
          src={song.image}
          alt={song.title}
          onError={e => { e.target.src = 'https://placehold.co/200x200/0c0c14/6c3bf5?text=♪'; }}
        />
        <div className="play-overlay">
          <div className="play-overlay-btn">
            {isActive && state.isPlaying && !state.isLoadingStream
              ? '⏸'
              : state.isLoadingStream && isActive ? '⏳' : '▶'
            }
          </div>
        </div>
        {isActive && state.isPlaying && !state.isLoadingStream && (
          <div className="equalizer-wave" style={{ position: 'absolute', bottom: 12, left: 12, zIndex: 10 }}>
            <div className="eq-wave-bar" style={{ animationDelay: '0s', animationDuration: '0.8s' }} />
            <div className="eq-wave-bar" style={{ animationDelay: '0.2s', animationDuration: '0.6s' }} />
            <div className="eq-wave-bar" style={{ animationDelay: '0.4s', animationDuration: '1.0s' }} />
            <div className="eq-wave-bar" style={{ animationDelay: '0.1s', animationDuration: '0.7s' }} />
          </div>
        )}
      </div>
      <div className="song-card-title" title={song.title}>{song.title}</div>
      <div className="song-card-artist" title={song.artist}>{song.artist}</div>
    </div>
  );
}
