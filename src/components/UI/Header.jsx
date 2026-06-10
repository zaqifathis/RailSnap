import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { uiTheme, glassStyle } from '../../constants/theme';

const PAGES = [
  { id: 'editor', label: 'Editor' },
  { id: 'play', label: 'Play' },
];

const Header = ({ page, onPageChange }) => {
  const itemStyle = (id) => {
    const isActive = page === id;
    return {
      all: 'unset',
      backgroundColor: isActive ? uiTheme.accent : 'transparent',
      color: isActive ? uiTheme.background : uiTheme.secondary,
      padding: '7px 18px',
      borderRadius: '999px',
      fontSize: '13px',
      fontWeight: 'bold',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    };
  };

  return (
    <>
      {/* App name: plain wordmark, top left, outside any capsule. */}
      <div
        style={{
          position: 'absolute',
          top: '24px',
          left: '28px',
          zIndex: 1100,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontWeight: 800,
          fontSize: '26px',
          letterSpacing: '-0.6px',
          color: '#000000',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        RailSnap
      </div>

      {/* Page switcher capsule, centered. */}
      <header
        style={{
          ...glassStyle,
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          alignItems: 'center',
          padding: '6px 8px',
          zIndex: 1100,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <ToggleGroup.Root
          type="single"
          value={page}
          onValueChange={(value) => value && onPageChange(value)}
          style={{ display: 'flex', gap: '4px' }}
        >
          {PAGES.map(({ id, label }) => (
            <ToggleGroup.Item key={id} value={id} style={itemStyle(id)}>
              {label}
            </ToggleGroup.Item>
          ))}
        </ToggleGroup.Root>
      </header>
    </>
  );
};

export default Header;
