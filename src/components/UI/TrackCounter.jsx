import { TRACK_TOOLS } from '../../constants/trackConfig';
import { uiTheme, glassStyle } from '../../constants/theme';

const TrackCounter = ({ tracks = [] }) => {
  const containerStyle = {
    ...glassStyle,
    position: 'absolute',
    bottom: '30px',           
    left: '50%',             
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '6px 16px',    
    fontFamily: 'system-ui, -apple-system, sans-serif',
    pointerEvents: 'none',   
    color: uiTheme.secondary, 
    zIndex: 1000            
  };

  return (
    <div style={containerStyle}>
      {TRACK_TOOLS.map(({ id, icon: Icon, label }) => (
        <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }} title={label}>
          <div style={{ color: uiTheme.secondary, display: 'flex', opacity: 0.8 }}>
            <Icon />
          </div>
          <div style={{
            backgroundColor: uiTheme.badgeBg, 
            padding: '2px 8px', borderRadius: '6px',
            fontSize: '12px', fontWeight: 'bold', minWidth: '14px', textAlign: 'center'
          }}>
            {tracks.filter(t => t.type === id).length}
          </div>
        </div>
      ))}
    </div>
  );
};

export default TrackCounter;