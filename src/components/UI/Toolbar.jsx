import { useState } from 'react';
import { ActionIcon } from './Icons';
import { TRACK_TOOLS } from '../../constants/trackConfig';
import { uiTheme, glassStyle } from '../../constants/theme';

/**
 * UI hierarchy:
 *  - LEFT: track palette (the primary editing tools), each button carrying
 *    its piece count so the inventory lives with the tool, not in a
 *    separate bar.
 *  - TOP RIGHT: file actions — destructive reset separated from save/load
 *    by a divider.
 */
const Toolbar = ({ activeTool, onSelectTool, onSave, onLoad, onReset, tracks = [] }) => {
  const [hovered, setHovered] = useState(null);

  const getButtonStyle = (id, type = 'track') => {
    const isHovered = hovered === id;
    const isActive = activeTool === id;

    let bgColor = type === 'action' ? uiTheme.utilityIdle : uiTheme.trackIdle;
    if (isActive || isHovered) {
      bgColor = uiTheme.accent;
    }

    return {
      position: 'relative',
      width: type === 'action' ? '32px' : '38px',
      height: type === 'action' ? '32px' : '38px',
      borderRadius: '10px',
      border: 'none',
      outline: 'none',
      backgroundColor: bgColor,
      color: uiTheme.background,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      transform: isHovered || isActive ? 'scale(1.1)' : 'scale(1)',
    };
  };

  const countBadgeStyle = {
    position: 'absolute',
    top: '-6px',
    right: '-6px',
    minWidth: '16px',
    height: '16px',
    padding: '0 4px',
    borderRadius: '8px',
    backgroundColor: uiTheme.background,
    color: '#ffffff',
    fontSize: '9px',
    fontWeight: 'bold',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    pointerEvents: 'none',
  };

  const divider = (
    <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(0,0,0,0.15)' }} />
  );

  const actionButton = (type, onClick, content) => (
    <button
      key={type}
      title={`${type.charAt(0).toUpperCase() + type.slice(1)} Scene`}
      style={getButtonStyle(type, 'action')}
      onClick={onClick}
      onMouseEnter={() => setHovered(type)}
      onMouseLeave={() => setHovered(null)}
    >
      {content}
    </button>
  );

  return (
    <>
      {/* Track palette with per-type piece counts (LEFT) */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '20px',
          transform: 'translateY(-50%)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
        }}
      >
        <div style={{ ...glassStyle, padding: '14px 10px', flexDirection: 'column', gap: '12px' }}>
          {TRACK_TOOLS.map(({ id, icon: Icon, label }) => {
            const count = tracks.filter((t) => t.type === id).length;
            return (
              <button
                key={id}
                title={`${label} — ${count} placed`}
                style={getButtonStyle(id, 'track')}
                onMouseEnter={() => setHovered(id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelectTool(activeTool === id ? null : id)}
              >
                <div style={{ transform: 'scale(0.85)' }}>
                  <Icon />
                </div>
                {count > 0 && <span style={countBadgeStyle}>{count}</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* File actions (TOP RIGHT): reset | save / load */}
      <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', zIndex: 1000 }}>
        <div
          style={{
            ...glassStyle,
            padding: '6px 10px',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          {actionButton(
            'reset',
            onReset,
            <div style={{ transform: 'scale(0.8)' }}>
              <ActionIcon type="reset" />
            </div>
          )}
          {divider}
          {actionButton(
            'save',
            onSave,
            <div style={{ transform: 'scale(0.8)' }}>
              <ActionIcon type="save" />
            </div>
          )}
          {actionButton(
            'load',
            undefined,
            <label style={{ cursor: 'pointer', display: 'flex' }}>
              <div style={{ transform: 'scale(0.8)' }}>
                <ActionIcon type="load" />
              </div>
              <input type="file" accept=".json" style={{ display: 'none' }} onChange={onLoad} />
            </label>
          )}
        </div>
      </div>
    </>
  );
};

export default Toolbar;
