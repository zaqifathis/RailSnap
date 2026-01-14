import { glassStyle } from './glassStyle';
import { StraightIcon, CurveIcon, YIcon, XIcon } from './Icons';

// Styled to be dark grey/black for better visibility on the light glass
const darkColor = '#7a7a7a'; 
const badgeBg = 'rgba(0, 0, 0, 0.1)'; // Subtle dark tint for the number badge

const TrackCounter = ({ tracks = [] }) => {
  const straightCount = tracks.filter(t => t.type === 'STRAIGHT').length;
  const curveCount = tracks.filter(t => t.type === 'CURVED').length;
  const yCount = tracks.filter(t => t.type === 'Y_TRACK').length;
  const xCount = tracks.filter(t => t.type === 'X_TRACK').length;

  const containerStyle = {
    ...glassStyle,
    position: 'absolute',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '8px 20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    pointerEvents: 'none',
    userSelect: 'none',
    // Ensure the background matches the toolbar's glassStyle exactly
    color: darkColor, 
  };

  const CounterItem = ({ icon, count, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} title={label}>
      {/* Icon wrapper to force the dark color onto the SVG stroke */}
      <div style={{ color: darkColor, display: 'flex', opacity: 0.8 }}>
        {icon}
      </div>
      <div style={{
        backgroundColor: badgeBg,
        padding: '2px 8px',
        borderRadius: '6px',
        color: darkColor,
        fontSize: '12px',
        fontWeight: 'bold',
        minWidth: '14px',
        textAlign: 'center'
      }}>
        {count}
      </div>
    </div>
  );

  return (
    <div style={containerStyle}>
      <CounterItem icon={<StraightIcon />} count={straightCount} label="Straights" />
      <CounterItem icon={<CurveIcon />} count={curveCount} label="Curves" />
      <CounterItem icon={<YIcon />} count={yCount} label="Y-Switches" />
      <CounterItem icon={<XIcon />} count={xCount} label="X-Crossings" />
    </div>
  );
};

export default TrackCounter;