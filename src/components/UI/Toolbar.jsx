import { useState } from 'react';
import { glassStyle } from './glassStyle';
import { StraightIcon, CurveIcon, YIcon, XIcon, ActionIcon } from './Icons';

// UI Colors
const activeTrackColor = '#0ceda2'; // Vibrant green for active track
const idleTrackColor = 'rgba(177, 174, 4, 0.89)'; // Your yellow/gold
const utilityColor = 'rgba(186, 186, 186, 0.89)'; // Grey for actions
const iconColor = '#222222'; // Dark color for icons

const Toolbar = ({ activeTool, onSelectTool, onSave, onLoad, onReset }) => {
  const [hovered, setHovered] = useState(null);

  const tools = [
    { id: 'STRAIGHT', label: 'Straight Track', icon: <StraightIcon /> },
    { id: 'CURVED', label: 'Curve Track', icon: <CurveIcon /> },
    { id: 'Y_TRACK', label: 'Y-Switch', icon: <YIcon /> },
    { id: 'X_TRACK', label: 'X-Crossing', icon: <XIcon /> }
  ];

  // The Main Parent that centers everything
  const masterWrapper = {
    position: 'absolute',
    bottom: '30px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: '24px', // Space between the two glass boundaries
    userSelect: 'none',
    zIndex: 1000
  };

  const groupContainer = {
    ...glassStyle,
    padding: '8px 25px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  };

  const getButtonStyle = (id, type = 'track') => {
    const isHovered = hovered === id;
    const isActive = activeTool === id;

    // Track buttons use yellow (idle) or green (active)
    // Action buttons use grey
    let bgColor = type === 'action' ? utilityColor : idleTrackColor;
    if (isActive || isHovered) bgColor = activeTrackColor;

    return {
      width: '44px',
      height: '44px',
      borderRadius: '15px',
      border: 'none',
      outline: 'none',
      backgroundColor: bgColor,
      color: iconColor, // Use the dark color for the SVG stroke
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      transform: (isHovered || isActive) ? 'scale(1.1)' : 'scale(1)',
    };
  };

  return (
    <div style={masterWrapper}>
      {/* SECTION 1: Construction Tools */}
      <div style={groupContainer}>
        {tools.map((tool) => (
          <button
            key={tool.id}
            title={tool.label}
            style={getButtonStyle(tool.id, 'track')}
            onMouseEnter={() => setHovered(tool.id)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onSelectTool(activeTool === tool.id ? null : tool.id)}
          >
            {tool.icon}
          </button>
        ))}
        
        <div style={{ width: '1px', height: '24px', background: 'rgba(0,0,0,0.1)', margin: '0 4px' }} />
        
        <button 
          title="Reset Scene"
          style={getButtonStyle('reset', 'action')}
          onClick={onReset}
          onMouseEnter={() => setHovered('reset')} 
          onMouseLeave={() => setHovered(null)}
        >
          <ActionIcon type="reset" />
        </button>
      </div>

      {/* SECTION 2: File Management */}
      <div style={groupContainer}>
        <button 
          title="Save Track Layout"
          style={getButtonStyle('save', 'action')}
          onClick={onSave}
          onMouseEnter={() => setHovered('save')} 
          onMouseLeave={() => setHovered(null)}
        >
          <ActionIcon type="save" />
        </button>

        <label 
          title="Load Track Layout"
          onMouseEnter={() => setHovered('load')} 
          onMouseLeave={() => setHovered(null)}
          style={{ ...getButtonStyle('load', 'action'), cursor: 'pointer' }}
        >
          <ActionIcon type="load" />
          <input type="file" accept=".json" style={{ display: 'none' }} onChange={onLoad} />
        </label>
      </div>
    </div>
  );
};

export default Toolbar;