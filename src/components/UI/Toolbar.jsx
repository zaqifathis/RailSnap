import { useState } from 'react';
import { ActionIcon } from './Icons';
import { TRACK_TOOLS } from '../../constants/trackConfig';
import { uiTheme, glassStyle } from '../../constants/theme'; //

const Toolbar = ({ activeTool, onSelectTool, onSave, onLoad, onReset }) => {
  const [hovered, setHovered] = useState(null);

  const getButtonStyle = (id, type = 'track') => {
    const isHovered = hovered === id;
    const isActive = activeTool === id;

    let bgColor = type === 'action' ? uiTheme.utilityIdle : uiTheme.trackIdle;
    if (isActive || isHovered) {
      bgColor = uiTheme.accent;
    }

    return {
      width: type === 'action' ? '32px' : '38px',
      height: type === 'action' ? '32px' : '38px',
      borderRadius: '10px',
      border: 'none',
      outline: 'none',
      backgroundColor: bgColor,
      color: uiTheme.background, //
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      transform: (isHovered || isActive) ? 'scale(1.1)' : 'scale(1)',
    };
  };

  return (
    <>
      {/* SECTION 1: Construction Tools (LEFT) */}
      <div style={{ position: 'absolute', top: '50%', left: '20px', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '20px', zIndex: 1000 }}>
        <div style={{ ...glassStyle, padding: '12px 8px', flexDirection: 'column', gap: '10px' }}>
          {TRACK_TOOLS.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              title={label}
              style={getButtonStyle(id, 'track')}
              onMouseEnter={() => setHovered(id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => onSelectTool(activeTool === id ? null : id)}
            >
              <div style={{ transform: 'scale(0.85)' }}><Icon /></div>
            </button>
          ))}
        </div>
      </div>

      {/* SECTION 2: File Management (RIGHT) */}
      <div style={{ position: 'absolute', top: '50%', right: '20px', transform: 'translateY(-50%)', display: 'flex', flexDirection: 'column', gap: '20px', zIndex: 1000 }}>
        <div style={{ ...glassStyle, padding: '10px 6px', flexDirection: 'column', gap: '8px' }}>
          {['reset', 'save', 'load'].map((type) => (
            <button 
              key={type}
              title={`${type.charAt(0).toUpperCase() + type.slice(1)} Scene`}
              style={getButtonStyle(type, 'action')}
              onClick={type === 'load' ? undefined : (type === 'save' ? onSave : onReset)}
              onMouseEnter={() => setHovered(type)} 
              onMouseLeave={() => setHovered(null)}
            >
              {type === 'load' ? (
                <label style={{ cursor: 'pointer', display: 'flex' }}>
                   <div style={{ transform: 'scale(0.8)' }}><ActionIcon type="load" /></div>
                   <input type="file" accept=".json" style={{ display: 'none' }} onChange={onLoad} />
                </label>
              ) : (
                <div style={{ transform: 'scale(0.8)' }}><ActionIcon type={type} /></div>
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default Toolbar;