import { useState, useMemo } from 'react';
import { buildRoute } from '../../utils/trainRoute';
import { playHonk } from '../../utils/honk';
import { uiTheme, glassStyle } from '../../constants/theme';
import PlayScene from './PlayScene';
import ControlBar from '../UI/ControlBar';

const EmptyHint = () => (
  <div
    style={{
      ...glassStyle,
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      padding: '16px 28px',
      borderRadius: '16px',
      color: uiTheme.secondary,
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontSize: '13px',
      fontWeight: 'bold',
      zIndex: 1000,
      pointerEvents: 'none',
    }}
  >
    Build a track in the Editor first 🚂
  </div>
);

const PlayPage = ({ tracks }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [resetSignal, setResetSignal] = useState(0);
  // Y-switch lever states: trackId → 'left' | 'right'. Main line is left.
  const [switches, setSwitches] = useState({});

  const route = useMemo(() => buildRoute(tracks, { switches }), [tracks, switches]);

  const handleStop = () => {
    setIsPlaying(false);
    setResetSignal((n) => n + 1);
  };

  const toggleSwitch = (trackId) =>
    setSwitches((prev) => ({
      ...prev,
      [trackId]: prev[trackId] === 'right' ? 'left' : 'right',
    }));

  return (
    <>
      <PlayScene
        tracks={tracks}
        route={route}
        isPlaying={isPlaying}
        speed={speed}
        resetSignal={resetSignal}
        switches={switches}
        onToggleSwitch={toggleSwitch}
      />
      {!route && <EmptyHint />}
      <ControlBar
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying((p) => !p)}
        onStop={handleStop}
        speed={speed}
        onSpeedChange={setSpeed}
        onHonk={playHonk}
        disabled={!route}
      />
    </>
  );
};

export default PlayPage;
