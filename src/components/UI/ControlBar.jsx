import { useState } from 'react';
import { uiTheme, glassStyle } from '../../constants/theme';
import { PlayIcon, PauseIcon, StopIcon, HornIcon } from './Icons';

const ControlBar = ({ isPlaying, onTogglePlay, onStop, speed, onSpeedChange, onHonk, disabled }) => {
  const [hovered, setHovered] = useState(null);

  const buttonStyle = (id, active = false) => ({
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    border: 'none',
    outline: 'none',
    backgroundColor: active || hovered === id ? uiTheme.accent : uiTheme.utilityIdle,
    color: uiTheme.background,
    cursor: disabled ? 'default' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    transform: !disabled && (hovered === id || active) ? 'scale(1.1)' : 'scale(1)',
  });

  return (
    <div
      style={{
        ...glassStyle,
        position: 'absolute',
        bottom: '30px',
        left: '50%',
        transform: 'translateX(-50%)',
        alignItems: 'center',
        gap: '14px',
        padding: '10px 18px',
        zIndex: 1000,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <button
        title={isPlaying ? 'Pause' : 'Play'}
        disabled={disabled}
        style={buttonStyle('play', isPlaying)}
        onMouseEnter={() => setHovered('play')}
        onMouseLeave={() => setHovered(null)}
        onClick={onTogglePlay}
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>

      <button
        title="Stop"
        disabled={disabled}
        style={buttonStyle('stop')}
        onMouseEnter={() => setHovered('stop')}
        onMouseLeave={() => setHovered(null)}
        onClick={onStop}
      >
        <StopIcon />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 6px' }}>
        <input
          type="range"
          min={-3}
          max={3}
          step={0.5}
          value={speed}
          disabled={disabled}
          onChange={(e) => onSpeedChange(Number(e.target.value))}
          style={{ width: '140px', accentColor: uiTheme.accent, cursor: 'pointer' }}
        />
        <span
          style={{
            fontSize: '12px',
            fontWeight: 'bold',
            color: uiTheme.secondary,
            minWidth: '34px',
            textAlign: 'center',
          }}
        >
          {speed > 0 ? `+${speed}` : speed}×
        </span>
      </div>

      <button
        title="Honk!"
        disabled={disabled}
        style={buttonStyle('honk')}
        onMouseEnter={() => setHovered('honk')}
        onMouseLeave={() => setHovered(null)}
        onClick={onHonk}
      >
        <HornIcon />
      </button>
    </div>
  );
};

export default ControlBar;
