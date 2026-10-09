import { usePlayer } from '../PlayerContext';
import { getStreamUrl } from '../api';

export default function SongCard({ song, songs }) {
  const { state, playSong, dispatch } = usePlayer();
  const isActive = state.currentSong?.id === song.id;
  const isLiked = state.likedSongs.find(s => s.id === song.id);

  const handlePlay = () => {
    if (isActive) {
      dispatch({ type: 'TOGGLE_PLAY' });
    } else {
      playSong(song, getStreamUrl, songs);
    }
  };

  return (
    <div className={`song-card ${isActive ? 'active' : ''}`} onClick={handlePlay}>
      <div className="song-card-thumb">
        <img
          src={song.image}
          alt={song.title}
          onError={e => { e.target.src = 'https://placehold.co/180x180/111118/555?text=♪'; }}
        />
        <div className="play-overlay">
          <div className="play-overlay-btn">
            {isActive && state.isPlaying
              ? (state.isLoadingStream ? '⏳' : '⏸')
              : '▶'
            }
          </div>
        </div>
        {isActive && state.isPlaying && !state.isLoadingStream && (
          <div className="equalizer" style={{ position: 'absolute', bottom: 8, left: 8 }}>
            <div className="eq-bar" />
            <div className="eq-bar" />
            <div className="eq-bar" />
          </div>
        )}
      </div>
      <div className="song-card-title" title={song.title}>{song.title}</div>
      <div className="song-card-artist" title={song.artist}>{song.artist}</div>
    </div>
  );
}
