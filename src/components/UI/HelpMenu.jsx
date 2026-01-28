import React, { useState } from 'react';
import { uiTheme , glassStyle} from '../../constants/theme';
import LeftClick from '../../assets/icons/LeftClick.svg?react';
import RightClick from '../../assets/icons/RightClick.svg?react';

const ControlRow = ({ icon: Icon, label, text }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
    <div style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {typeof Icon === 'string' ? (
        <div style={{ 
          minWidth: '24px', padding: '0 4px', textAlign: 'center', fontWeight: 'bold', fontSize: '8px',
          border: `1.2px solid ${uiTheme.secondary}`, 
          borderRadius: '3px', lineHeight: '1.6', color: uiTheme.secondary 
        }}>{Icon}</div>
      ) : (
        <Icon style={{ width: '28px', height: '28px', color: uiTheme.secondary }} />
      )}
    </div>
    <span style={{ color: uiTheme.secondary, fontSize: '11px' }}>
      <b style={{ color: uiTheme.secondary }}>{label}:</b> {text}
    </span>
  </div>
);

const HelpMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const controls = [
    { icon: LeftClick, label: "Left Click", text: "Place / Delete" },
    { icon: RightClick, label: "Right Click", text: "Toggle Switch" },
    { icon: "ESC", label: "ESC", text: "Deselect Tool" },
    { icon: "SNAP", label: "Snap", text: "Move cursor to end of track" }
  ];

  const cardStyle = {
    ...glassStyle,
    display: isOpen ? 'flex' : 'none',
    flexDirection: 'column',
    padding: '12px',
    width: '180px',
    borderRadius: '12px',
    position: 'absolute',
    bottom: '70px', 
    right: '30px',
    zIndex: 3000,
    fontFamily: 'system-ui, -apple-system, sans-serif',
  };

  return (
    <div style={{ position: 'absolute', bottom: '40px', right: '30px', zIndex: 3000 }}>
      <div style={cardStyle}>
        <div style={{ 
          fontWeight: 'bold', 
          fontSize: '12px', 
          marginBottom: '8px', 
          color: uiTheme.secondary 
        }}>
          Controls
        </div>
        {controls.map((ctrl, i) => (
          <ControlRow key={i} icon={ctrl.icon} label={ctrl.label} text={ctrl.text} />
        ))}
      </div>
      <button 
        style={{ 
          ...glassStyle, 
          width: '30px', 
          height: '30px', 
          borderRadius: '50%', 
          cursor: 'pointer', 
          border: 'none', 
          display: 'flex',          
          alignItems: 'center',    
          justifyContent: 'center',  
          padding: 0,
          backgroundColor: (isOpen || isHovered) ? uiTheme.accent : uiTheme.utilityIdle,
          color: uiTheme.background, 
          fontSize: '14px',
          fontWeight: 'normal',
          transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          transform: (isHovered || isOpen) ? 'scale(1.1)' : 'scale(1)',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={() => setIsOpen(!isOpen)}
      >
        ?
      </button>
    </div>
  );
};

export default HelpMenu;