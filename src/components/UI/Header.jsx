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
      padding: '7px 16px',
      borderRadius: '999px',
      fontSize: '12px',
      fontWeight: 'bold',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    };
  };

  return (
    <header
      style={{
        ...glassStyle,
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        alignItems: 'center',
        gap: '14px',
        padding: '6px 8px 6px 18px',
        zIndex: 1100,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
        <span style={{ fontWeight: 800, fontSize: '15px', color: uiTheme.background, letterSpacing: '-0.3px' }}>
          Rail
        </span>
        <span style={{ fontWeight: 800, fontSize: '15px', color: uiTheme.accent, letterSpacing: '-0.3px' }}>
          Snap
        </span>
      </div>

      <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(0,0,0,0.15)' }} />

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
  );
};

export default Header;
