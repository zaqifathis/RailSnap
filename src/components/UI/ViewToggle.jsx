import * as ToggleGroup from '@radix-ui/react-toggle-group';
import { glassStyle } from './glassStyle';

const ViewToggle = ({ viewMode, setViewMode }) => {
  const rootStyle = {
    ...glassStyle,
    position: 'absolute',
    bottom: '30px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'inline-flex',
    borderRadius: '50px',
    padding: '4px 15px',
    gap: '4px',
    zIndex: 1000,
  };

  const itemStyle = (val) => {
    const isActive = viewMode === val;
    return {
      all: 'unset',
      backgroundColor: isActive ? '#0ceda2' : 'transparent',
      color: isActive ? '#222222' : '#7a7a7a',
      padding: '8px 15px',
      borderRadius: '8px',
      fontSize: '12px',
      fontWeight: 'bold',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    };
  };

  return (
    <ToggleGroup.Root
      type="single"
      value={viewMode}
      onValueChange={(value) => { if (value) setViewMode(value); }}
      style={rootStyle}
    >
      <ToggleGroup.Item value="2D" style={itemStyle("2D")}>
        2D
      </ToggleGroup.Item>
      <ToggleGroup.Item value="3D" style={itemStyle("3D")}>
        3D
      </ToggleGroup.Item>
    </ToggleGroup.Root>
  );
};

export default ViewToggle;