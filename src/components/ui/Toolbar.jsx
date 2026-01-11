import React, { useState } from 'react';

const borderRad = '50px';
const selectedColor = '#cfb912'

const Toolbar = ({ onSelectTool }) => {
  const [hovered, setHovered] = useState(null);

  const tools = [
    { id: 'STRAIGHT', label: 'Straight', color: selectedColor },
    { id: 'CURVE_LEFT', label: 'Curve Left', color: selectedColor },
    { id: 'CURVE_RIGHT', label: 'Curve Right', color: selectedColor },
  ];

  const getButtonStyle = (id, baseColor, type = 'track') => {
    const isHovered = hovered === id;

    return {
      padding: '10px 20px',
      margin: '0 5px',
      borderRadius: borderRad,
      border: 'none',
      backgroundColor: isHovered ? selectedColor : (type === 'action' ? baseColor : '#999999'),
      color: 'white',
      cursor: 'pointer',
      fontWeight: 'bold',
      transition: 'all 0.2s ease-out',
      transform: isHovered ? 'scale(1.08)' : 'scale(1)',
      boxShadow: isHovered ? `0 0 10px ${baseColor}` : 'none',
    };
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: '30px',
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      backgroundColor: 'rgba(238, 238, 238, 0.21)',
      padding: '15px',
      borderRadius: borderRad,
      boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
      backdropFilter: 'blur(8px)',
      zIndex: 100
    }}>
      {/* Track Buttons */}
      {tools.map((tool) => (
        <button
          key={tool.id}
          style={getButtonStyle(tool.id, tool.color)}
          onMouseEnter={() => setHovered(tool.id)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onSelectTool(tool.id)}
        >
          {tool.label}
        </button>
      ))}

      <div style={{ width: '30px' }} /> {/* Spacer */}

      {/* Action Buttons */}
      <button 
        style={getButtonStyle('save', '#52c796', 'action')}
        onMouseEnter={() => setHovered('save')}
        onMouseLeave={() => setHovered(null)}
      >
        Save
      </button>
      <button 
        style={getButtonStyle('load', '#4758cb', 'action')}
        onMouseEnter={() => setHovered('load')}
        onMouseLeave={() => setHovered(null)}
      >
        Load
      </button>
    </div>
  );
};

export default Toolbar;