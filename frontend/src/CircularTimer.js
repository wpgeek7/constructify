import React, { useState, useEffect } from 'react';
import './CircularTimer.css';

const CircularTimer = ({ jobId, timerState, onTimerAction }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const isActive = timerState === 'start' || timerState === 'resume';
    setIsRunning(isActive);

    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else if (!isActive && elapsedTime !== 0) {
      clearInterval(interval);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerState, elapsedTime]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return {
      hours: String(hrs).padStart(2, '0'),
      minutes: String(mins).padStart(2, '0'),
      seconds: String(secs).padStart(2, '0')
    };
  };

  const time = formatTime(elapsedTime);
  const circumference = 2 * Math.PI * 90; // radius = 90
  const progress = (elapsedTime % 60) / 60; // Progress based on seconds
  const strokeDashoffset = circumference - (progress * circumference);

  return (
    <div className="circular-timer-container">
      <div className="circular-timer">
        <svg className="timer-svg" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle
            className="timer-circle-bg"
            cx="100"
            cy="100"
            r="90"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            className={`timer-circle-progress ${isRunning ? 'running' : ''}`}
            cx="100"
            cy="100"
            r="90"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform="rotate(-90 100 100)"
          />
        </svg>
        
        <div className="timer-display">
          <div className="timer-time">
            <span className="time-hours">{time.hours}</span>
            <span className="time-separator">:</span>
            <span className="time-minutes">{time.minutes}</span>
            <span className="time-separator">:</span>
            <span className="time-seconds">{time.seconds}</span>
          </div>
          <div className="timer-labels">
            <span>HRS</span>
            <span>MIN</span>
            <span>SEC</span>
          </div>
        </div>
      </div>

      <div className="timer-controls">
        {!timerState || timerState === 'stop' ? (
          <button
            className="timer-btn start"
            onClick={() => onTimerAction('start')}
          >
            <span className="btn-icon">▶️</span>
            <span>Start Work</span>
          </button>
        ) : timerState === 'start' || timerState === 'resume' ? (
          <>
            <button
              className="timer-btn pause"
              onClick={() => onTimerAction('pause')}
            >
              <span className="btn-icon">⏸️</span>
              <span>Pause</span>
            </button>
            <button
              className="timer-btn stop"
              onClick={() => onTimerAction('stop')}
            >
              <span className="btn-icon">⏹️</span>
              <span>Stop</span>
            </button>
          </>
        ) : timerState === 'pause' ? (
          <>
            <button
              className="timer-btn resume"
              onClick={() => onTimerAction('resume')}
            >
              <span className="btn-icon">▶️</span>
              <span>Resume</span>
            </button>
            <button
              className="timer-btn stop"
              onClick={() => onTimerAction('stop')}
            >
              <span className="btn-icon">⏹️</span>
              <span>Stop</span>
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default CircularTimer;

