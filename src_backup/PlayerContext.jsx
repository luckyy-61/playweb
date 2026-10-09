import { createContext, useContext, useReducer, useRef, useEffect, useCallback } from 'react';

// ── State ───────────────────────────────────────────────────────────────────
const initialState = {
  currentSong: null,
  queue: [],
  queueIndex: -1,
  isPlaying: false,
  progress: 0,        // seconds
  duration: 0,        // seconds
  volume: 0.8,
  isShuffle: false,
  repeatMode: 'none', // 'none' | 'all' | 'one'
  likedSongs: JSON.parse(localStorage.getItem('play_liked') || '[]'),
  playlists: JSON.parse(localStorage.getItem('play_playlists') || '[]'),
  isLoadingStream: false,
};

// ── Reducer ─────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'SET_SONG':
      return { ...state, currentSong: action.song, isPlaying: true, progress: 0, duration: action.duration || 0 };
    case 'SET_QUEUE':
      return { ...state, queue: action.queue, queueIndex: action.index ?? 0 };
    case 'PLAY': return { ...state, isPlaying: true };
    case 'PAUSE': return { ...state, isPlaying: false };
    case 'TOGGLE_PLAY': return { ...state, isPlaying: !state.isPlaying };
    case 'SET_PROGRESS': return { ...state, progress: action.progress };
    case 'SET_DURATION': return { ...state, duration: action.duration };
    case 'SET_VOLUME': return { ...state, volume: action.volume };
    case 'TOGGLE_SHUFFLE': return { ...state, isShuffle: !state.isShuffle };
    case 'CYCLE_REPEAT': {
      const modes = ['none', 'all', 'one'];
      const idx = modes.indexOf(state.repeatMode);
      return { ...state, repeatMode: modes[(idx + 1) % modes.length] };
    }
    case 'NEXT_TRACK': {
      const nextIdx = state.queueIndex + 1;
      if (nextIdx >= state.queue.length) return state;
      return { ...state, queueIndex: nextIdx, currentSong: state.queue[nextIdx], progress: 0 };
    }
    case 'PREV_TRACK': {
      const prevIdx = Math.max(0, state.queueIndex - 1);
      return { ...state, queueIndex: prevIdx, currentSong: state.queue[prevIdx], progress: 0 };
    }
    case 'TOGGLE_LIKE': {
      const song = action.song;
      const exists = state.likedSongs.find(s => s.id === song.id);
      const likedSongs = exists
        ? state.likedSongs.filter(s => s.id !== song.id)
        : [...state.likedSongs, song];
      localStorage.setItem('play_liked', JSON.stringify(likedSongs));
      return { ...state, likedSongs };
    }
    case 'CREATE_PLAYLIST': {
      const playlists = [...state.playlists, { id: Date.now(), name: action.name, songs: [] }];
      localStorage.setItem('play_playlists', JSON.stringify(playlists));
      return { ...state, playlists };
    }
    case 'ADD_TO_PLAYLIST': {
      const playlists = state.playlists.map(p =>
        p.id === action.playlistId
          ? { ...p, songs: p.songs.find(s => s.id === action.song.id) ? p.songs : [...p.songs, action.song] }
          : p
      );
      localStorage.setItem('play_playlists', JSON.stringify(playlists));
      return { ...state, playlists };
    }
    case 'REMOVE_FROM_PLAYLIST': {
      const playlists = state.playlists.map(p =>
        p.id === action.playlistId
          ? { ...p, songs: p.songs.filter(s => s.id !== action.songId) }
          : p
      );
      localStorage.setItem('play_playlists', JSON.stringify(playlists));
      return { ...state, playlists };
    }
    case 'DELETE_PLAYLIST': {
      const playlists = state.playlists.filter(p => p.id !== action.playlistId);
      localStorage.setItem('play_playlists', JSON.stringify(playlists));
      return { ...state, playlists };
    }
    case 'SET_LOADING': return { ...state, isLoadingStream: action.loading };
    default: return state;
  }
}

// ── Context ─────────────────────────────────────────────────────────────────
const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const audioRef = useRef(new Audio());
  const streamUrlRef = useRef(null);

  // Keep volume in sync
  useEffect(() => {
    audioRef.current.volume = state.volume;
  }, [state.volume]);

  // Keep play/pause in sync
  useEffect(() => {
    if (state.isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [state.isPlaying]);

  // Progress tracking
  useEffect(() => {
    const audio = audioRef.current;
    const onTimeUpdate = () => dispatch({ type: 'SET_PROGRESS', progress: audio.currentTime });
    const onDurationChange = () => dispatch({ type: 'SET_DURATION', duration: audio.duration });
    const onEnded = () => handleEnded();
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('durationchange', onDurationChange);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('durationchange', onDurationChange);
      audio.removeEventListener('ended', onEnded);
    };
  }, [state.repeatMode, state.queueIndex, state.queue]);

  function handleEnded() {
    if (state.repeatMode === 'one') {
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    } else if (state.repeatMode === 'all' || state.queueIndex < state.queue.length - 1) {
      dispatch({ type: 'NEXT_TRACK' });
    }
  }

  // When queueIndex changes, load new song src
  useEffect(() => {
    if (state.currentSong && streamUrlRef.current) {
      // already handled in playSong
    }
  }, [state.queueIndex]);

  // MediaSession API for lock-screen controls
  useEffect(() => {
    if (!state.currentSong || !('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: state.currentSong.title,
      artist: state.currentSong.artist,
      artwork: [{ src: state.currentSong.image, sizes: '500x500', type: 'image/jpeg' }],
    });
    navigator.mediaSession.setActionHandler('play', () => dispatch({ type: 'PLAY' }));
    navigator.mediaSession.setActionHandler('pause', () => dispatch({ type: 'PAUSE' }));
    navigator.mediaSession.setActionHandler('nexttrack', () => dispatch({ type: 'NEXT_TRACK' }));
    navigator.mediaSession.setActionHandler('previoustrack', () => dispatch({ type: 'PREV_TRACK' }));
  }, [state.currentSong]);

  const playSong = useCallback(async (song, getStreamUrlFn, queueSongs = null) => {
    dispatch({ type: 'SET_LOADING', loading: true });
    try {
      const { streamUrl, duration, isPreview } = await getStreamUrlFn(song);
      streamUrlRef.current = streamUrl;
      audioRef.current.src = streamUrl;
      audioRef.current.load();
      dispatch({ type: 'SET_SONG', song: { ...song, isPreview }, duration });
      if (queueSongs) {
        const idx = queueSongs.findIndex(s => s.id === song.id);
        dispatch({ type: 'SET_QUEUE', queue: queueSongs, index: idx >= 0 ? idx : 0 });
      }
      audioRef.current.play().catch(console.error);
    } catch (err) {
      console.error('Stream error:', err);
      alert('Could not load this song. Try another!');
    } finally {
      dispatch({ type: 'SET_LOADING', loading: false });
    }
  }, []);

  const seek = useCallback((seconds) => {
    audioRef.current.currentTime = seconds;
    dispatch({ type: 'SET_PROGRESS', progress: seconds });
  }, []);

  return (
    <PlayerContext.Provider value={{ state, dispatch, playSong, seek, audioRef }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  return useContext(PlayerContext);
}
