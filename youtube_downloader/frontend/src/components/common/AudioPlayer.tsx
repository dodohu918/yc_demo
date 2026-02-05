import React, { useRef, useState, useEffect } from 'react';

interface AudioPlayerProps {
  src: string;
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, className = '' }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setProgress(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;

    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setProgress(newTime);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <audio ref={audioRef} src={src} preload="metadata" />

      <button
        onClick={togglePlay}
        className={`w-9 h-9 flex items-center justify-center rounded-full transition-all shadow-md hover:shadow-lg hover:scale-105 ${
          isPlaying
            ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
            : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'
        }`}
      >
        {isPlaying ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <div className="flex-1 relative h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-100"
          style={{ width: `${progressPercent}%` }}
        />
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={progress}
          onChange={handleSeek}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>

      <span className="text-xs font-medium text-gray-500 min-w-[40px] text-right">
        {formatTime(progress)}
      </span>
    </div>
  );
};
