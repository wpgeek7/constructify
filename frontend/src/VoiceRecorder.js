import React, { useState, useRef, useEffect } from 'react';
import './VoiceRecorder.css';

const VoiceRecorder = ({ onRecordingComplete, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please grant permission and try again.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      clearInterval(timerRef.current);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      clearInterval(timerRef.current);
    }
  };

  const handleSave = () => {
    if (audioBlob) {
      // Convert blob to File object
      const file = new File([audioBlob], `voice-report-${Date.now()}.webm`, {
        type: 'audio/webm'
      });
      onRecordingComplete(file);
    }
  };

  const handleRetry = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="voice-recorder">
      <div className="recorder-header">
        <h3>🎤 Voice Report</h3>
        <p>Record your daily progress report or notes</p>
      </div>

      {!audioBlob ? (
        <>
          <div className="recording-visualizer">
            <div className={`mic-icon ${isRecording ? 'recording' : ''}`}>
              🎤
            </div>
            <div className="recording-time">
              {formatTime(recordingTime)}
            </div>
            {isRecording && (
              <div className="recording-indicator">
                <span className="rec-dot"></span>
                {isPaused ? 'PAUSED' : 'RECORDING'}
              </div>
            )}
          </div>

          <div className="recorder-controls">
            {!isRecording ? (
              <button className="rec-btn start" onClick={startRecording}>
                <span className="btn-icon">⏺️</span>
                <span>Start Recording</span>
              </button>
            ) : (
              <>
                {!isPaused ? (
                  <button className="rec-btn pause" onClick={pauseRecording}>
                    <span className="btn-icon">⏸️</span>
                    <span>Pause</span>
                  </button>
                ) : (
                  <button className="rec-btn resume" onClick={resumeRecording}>
                    <span className="btn-icon">▶️</span>
                    <span>Resume</span>
                  </button>
                )}
                <button className="rec-btn stop" onClick={stopRecording}>
                  <span className="btn-icon">⏹️</span>
                  <span>Stop</span>
                </button>
              </>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="playback-section">
            <div className="playback-info">
              <span className="playback-icon">✅</span>
              <div>
                <strong>Recording Complete!</strong>
                <p>Duration: {formatTime(recordingTime)}</p>
              </div>
            </div>
            
            <audio controls src={audioUrl} className="audio-player">
              Your browser does not support the audio element.
            </audio>
          </div>

          <div className="playback-controls">
            <button className="rec-btn retry" onClick={handleRetry}>
              <span className="btn-icon">🔄</span>
              <span>Record Again</span>
            </button>
            <button className="rec-btn save" onClick={handleSave}>
              <span className="btn-icon">💾</span>
              <span>Save & Upload</span>
            </button>
          </div>
        </>
      )}

      <div className="recorder-tips">
        <p><strong>Tips:</strong></p>
        <ul>
          <li>Speak clearly and at a normal pace</li>
          <li>Mention the date and what work was completed</li>
          <li>Note any issues or materials needed</li>
          <li>Maximum recording time: 5 minutes</li>
        </ul>
      </div>

      <div className="recorder-actions">
        <button className="btn-cancel-rec" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
};

export default VoiceRecorder;

