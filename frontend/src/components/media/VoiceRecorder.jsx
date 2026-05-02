import { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Mic, Square, Play, Pause, Trash2, Send, X, AlertCircle } from 'lucide-react';
import { uploadMedia, validateVoiceDuration, formatDuration, VOICE_DURATION_LIMIT } from '../../services/mediaService';

const VoiceRecorder = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerIntervalRef = useRef(null);
  const audioPlayerRef = useRef(null);
  const token = useSelector((state) => state.auth.user?.token);

  // Start recording
  const startRecording = async () => {
    try {
      setError(null);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        setAudioUrl(URL.createObjectURL(audioBlob));
        
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      // Start recording
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          
          // Auto-stop at 5 minutes
          if (newTime >= VOICE_DURATION_LIMIT) {
            stopRecording();
            return VOICE_DURATION_LIMIT;
          }
          
          return newTime;
        });
      }, 1000);
    } catch (err) {
      setError('Failed to access microphone. Please check permissions.');
      console.error('Error accessing microphone:', err);
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      // Clear timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  // Pause recording
  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      
      // Pause timer
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }
  };

  // Resume recording
  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      
      // Resume timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const newTime = prev + 1;
          
          // Auto-stop at 5 minutes
          if (newTime >= VOICE_DURATION_LIMIT) {
            stopRecording();
            return VOICE_DURATION_LIMIT;
          }
          
          return newTime;
        });
      }, 1000);
    }
  };

  // Play audio
  const playAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  // Pause audio playback
  const pauseAudio = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsPlaying(false);
    }
  };

  // Delete recording
  const deleteRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    setIsPlaying(false);
    setError(null);
  };

  // Send recording
  const sendRecording = async () => {
    if (!audioBlob) return;

    // Validate duration
    const validation = validateVoiceDuration(recordingTime);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // Create File from Blob
      const file = new File([audioBlob], `voice-${Date.now()}.webm`, {
        type: 'audio/webm',
      });

      // Upload
      const result = await uploadMedia(
        file,
        (progress) => setUploadProgress(progress),
        token
      );

      // Add duration to result
      result.duration = recordingTime;

      // Call parent callback
      onSend(result);

      // Reset state
      deleteRecording();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (isRecording) {
      stopRecording();
    }
    deleteRecording();
    if (onCancel) {
      onCancel();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Handle audio player events
  useEffect(() => {
    const audioPlayer = audioPlayerRef.current;
    if (!audioPlayer) return;

    const handleEnded = () => setIsPlaying(false);
    audioPlayer.addEventListener('ended', handleEnded);

    return () => {
      audioPlayer.removeEventListener('ended', handleEnded);
    };
  }, [audioUrl]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Voice Message</h2>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            disabled={isUploading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Recording indicator */}
          <div className="flex flex-col items-center mb-6">
            {/* Timer */}
            <div className="text-4xl font-mono font-bold mb-4">
              {formatDuration(recordingTime)}
            </div>

            {/* Max duration warning */}
            {recordingTime >= VOICE_DURATION_LIMIT - 30 && isRecording && (
              <p className="text-sm text-orange-600 mb-2">
                {Math.floor((VOICE_DURATION_LIMIT - recordingTime))} seconds remaining
              </p>
            )}

            {/* Recording status */}
            {isRecording && (
              <div className="flex items-center gap-2 text-red-500">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">
                  {isPaused ? 'Paused' : 'Recording...'}
                </span>
              </div>
            )}

            {audioBlob && !isRecording && (
              <p className="text-sm text-gray-500">Recording complete</p>
            )}
          </div>

          {/* Waveform visualization (simplified) */}
          {isRecording && !isPaused && (
            <div className="flex items-center justify-center gap-1 h-16 mb-6">
              {[...Array(20)].map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-blue-500 rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 60 + 20}%`,
                    animationDelay: `${i * 0.05}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Audio player */}
          {audioUrl && (
            <audio ref={audioPlayerRef} src={audioUrl} className="hidden" />
          )}

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 mb-6">
            {!isRecording && !audioBlob && (
              <button
                onClick={startRecording}
                className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                disabled={isUploading}
              >
                <Mic className="w-6 h-6" />
              </button>
            )}

            {isRecording && (
              <>
                {!isPaused ? (
                  <button
                    onClick={pauseRecording}
                    className="p-4 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition"
                  >
                    <Pause className="w-6 h-6" />
                  </button>
                ) : (
                  <button
                    onClick={resumeRecording}
                    className="p-4 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
                  >
                    <Play className="w-6 h-6" />
                  </button>
                )}
                <button
                  onClick={stopRecording}
                  className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                >
                  <Square className="w-6 h-6" />
                </button>
              </>
            )}

            {audioBlob && !isRecording && (
              <>
                {!isPlaying ? (
                  <button
                    onClick={playAudio}
                    className="p-4 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
                    disabled={isUploading}
                  >
                    <Play className="w-6 h-6" />
                  </button>
                ) : (
                  <button
                    onClick={pauseAudio}
                    className="p-4 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition"
                    disabled={isUploading}
                  >
                    <Pause className="w-6 h-6" />
                  </button>
                )}
                <button
                  onClick={deleteRecording}
                  className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                  disabled={isUploading}
                >
                  <Trash2 className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* Upload progress */}
          {isUploading && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Uploading...</span>
                <span className="text-sm text-gray-500">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Action buttons */}
          {audioBlob && !isRecording && (
            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                onClick={sendRecording}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={isUploading}
              >
                <Send className="w-4 h-4" />
                {isUploading ? 'Sending...' : 'Send'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VoiceRecorder;
