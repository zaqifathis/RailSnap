export const uiTheme = {
  accent: '#0ceda2',       // Active/Highlight Green
  background: '#222222',   // Primary text and icon color
  secondary: '#7a7a7a',    // Muted text and inactive icons

  trackIdle: '#B1AE04E3',   // Idle color for track buttons
  utilityIdle: '#BABAE3E3', // Idle color for save/load buttons
  badgeBg: 'rgba(0, 0, 0, 0.1)', // Background for counter numbers
};

export const interactionColor = {
  occupied: '#ff4444',
  snap: '#44ff44',
  default: '#8a8a8a',
  selected: '#b1ae04',
};

// Path line colors per track type.
export const trackColors = {
  STRAIGHT: '#0b3c66',
  CURVED: '#7e0c6b',
  Y_TRACK: '#b31552',
  X_TRACK: '#0e798b',
  CROSS_90: '#9a6a00',
};

// Material settings shared by all GLB track models.
export const trackModelStyle = {
  roughness: 0.4, // smooth plastic reflection
  metalness: 0.0, // non-metallic
  opacity: 0.4,
  ghostOpacity: 0.5,
};

// Rendering of the mathematical path lines on top of the models.
export const trackLineStyle = {
  visible: true,
  width: 5,
  selectedWidth: 6,
};

export const glassStyle = {
  backgroundColor: 'rgba(87, 87, 87, 0.1)',
  backdropFilter: 'blur(15px) saturate(180%)',
  WebkitBackdropFilter: 'blur(15px) saturate(160%)',
  border: '1px solid rgba(0, 0, 0, 0.1)',
  borderRadius: '50px',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.1)',
  display: 'flex',
  zIndex: 100,
};
