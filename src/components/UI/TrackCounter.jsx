import React from 'react';
import { color } from 'three/tsl';

const borderRad = '50px';

const TrackCounter = ({ tracks = [] }) => {
  const straightCount = tracks.filter(t => t.type === 'STRAIGHT').length;
  const curveCount = tracks.filter(t => t.type === 'CURVED').length;

  const containerStyle = {
    position: 'absolute',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: '25px', // Gap between the Straight group and Curve group
    backgroundColor: 'rgba(238, 238, 238, 0.21)',
    padding: '6px 12px',
    borderRadius: borderRad,
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
    backdropFilter: 'blur(8px)',
    zIndex: 100,
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '13px',
    color: 'white',
    pointerEvents: 'none'
  };

  // Style for the text "pills" that look like the toolbar buttons
  const labelPillStyle = (color) => ({
    backgroundColor: color,
    padding: '4px 12px',
    borderRadius: borderRad,
    fontWeight: '500',
    display: 'inline-block',
  });

  const sectionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '8px' // Gap between the label pill and the number
  };

  const numberStyle = {
    fontWeight: 'bold',
    fontSize: '14px',
    minWidth: '15px',
    color: 'black'
  };

  return (
    <div style={containerStyle}>
      {/* Straight Section */}
      <div style={sectionStyle}>
        <div style={labelPillStyle('#999999')}>Straight</div>
        <div style={numberStyle}>{straightCount}</div>
      </div>

      {/* Curve Section */}
      <div style={sectionStyle}>
        <div style={labelPillStyle('#999999')}>Curve</div>
        <div style={numberStyle}>{curveCount}</div>
      </div>
    </div>
  );
};

export default TrackCounter;