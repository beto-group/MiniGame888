function BasicView({ dc, folderPath, initialIsPlaying = true }) {
  const { useState, useEffect, useRef, useCallback } = dc;
  const songPath = folderPath ? `${folderPath}/data/music/beto.minigame.soundtrack.wav` : null;
  const audioSrc = songPath ? dc.app.vault.adapter.getResourcePath(songPath) : null;
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(initialIsPlaying);
  const [isLoaded, setIsLoaded] = useState(false);
  const DESIRED_VOLUME = 0.3;

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    audioElement.volume = DESIRED_VOLUME;

    if (isLoaded) {
      if (isPlaying && audioElement.paused) {
        audioElement.play().catch(error => {
          setIsPlaying(false);
        });
      } else if (!isPlaying && !audioElement.paused) {
        audioElement.pause();
      }
    }
  }, [isLoaded, isPlaying, DESIRED_VOLUME]);

  const togglePlayPause = useCallback(() => {
    if (!audioRef.current || !isLoaded) return;
    setIsPlaying(prevIsPlaying => !prevIsPlaying);
  }, [isLoaded]);

  const handleCanPlayThrough = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback((e) => {
    setIsLoaded(false);
    setIsPlaying(false);
  }, []);

  // Icon components
  const PlayIcon = () => (
    <svg width="22px" height="22px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );

  const PauseIcon = () => (
    <svg width="22px" height="22px" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
      <line x1="6" y1="4" x2="6" y2="20" />
      <line x1="18" y1="4" x2="18" y2="20" />
    </svg>
  );

  const LoadingIcon = () => (
    <svg width="20px" height="20px" viewBox="0 0 50 50" style={{ animation: 'spinIcon 1s linear infinite', display: 'block' }}>
      <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray="31.415, 31.415" strokeDashoffset="0" />
    </svg>
  );

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: isLoaded ? "pointer" : "default",
        backgroundColor: "transparent",
        borderRadius: "50%",
        boxSizing: 'border-box',
        color: 'var(--text-normal)'
      }}
      onClick={isLoaded ? togglePlayPause : undefined}
      title={isLoaded ? (isPlaying ? "Pause Music" : "Play Music") : "Loading Music..."}
    >
      {audioSrc && (
        <audio
          ref={audioRef}
          src={audioSrc}
          loop
          onCanPlayThrough={handleCanPlayThrough}
          onError={handleError}
          preload="auto"
          style={{ display: "none" }}
        />
      )}
      {isLoaded
        ? (isPlaying ? <PauseIcon /> : <PlayIcon />)
        : <LoadingIcon />}
    </div>
  );
}

return { BasicView };
