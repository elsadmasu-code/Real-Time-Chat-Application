import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

const VoicePlayer = ({ audioUrl, duration: providedDuration }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(providedDuration || 0);
  const audioRef = useRef(null);

  useEffect(() => {
    // Update duration when audio metadata is loaded
    if (audioRef.current) {
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current.duration);
      });
    }
  }, []);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleSeek = (e) => {
    const seekTime = (e.target.value / 100) * duration;
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Generate simple waveform visualization
  const generateWaveform = () => {
    const bars = 40;
    const heights = [];
    for (let i = 0; i < bars; i++) {
      // Create a pseudo-random but consistent pattern
      const height = Math.sin(i * 0.5) * 0.5 + 0.5;
      heights.push(height);
    }
    return heights;
  };

  const waveformHeights = generateWaveform();

  return (
    <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-lg max-w-md">
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
      />

      {/* Play/Pause button */}
      <button
        onClick={handlePlayPause}
        className="flex-shrink-0 w-10 h-10 rounded-full bg-accent hover:bg-accent/80 flex items-center justify-center text-white transition-all"
      >
        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
      </button>

      {/* Waveform and progress */}
      <div className="flex-1 flex flex-col gap-2">
        {/* Waveform visualization */}
        <div className="relative h-8 flex items-center gap-0.5">
          {waveformHeights.map((height, index) => {
            const barProgress = (index / waveformHeights.length) * 100;
            const isActive = barProgress <= progressPercentage;
            return (
              <div
                key={index}
                className={`flex-1 rounded-full transition-all ${
                  isActive ? 'bg-accent' : 'bg-gray-600'
                }`}
                style={{
                  height: `${height * 100}%`,
                  minHeight: '4px',
                }}
              />
            );
          })}
        </div>

        {/* Seek bar */}
        <input
          type="range"
          min="0"
          max="100"
          value={progressPercentage}
          onChange={handleSeek}
          className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${progressPercentage}%, #4b5563 ${progressPercentage}%, #4b5563 100%)`
          }}
        />
      </div>

      {/* Time display */}
      <div className="flex-shrink-0 text-xs text-gray-400 font-mono min-w-[60px] text-right">
        {isPlaying ? formatTime(currentTime) : formatTime(duration)}
      </div>
    </div>
  );
};

export default VoicePlayer;
