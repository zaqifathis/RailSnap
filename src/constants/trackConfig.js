import { StraightIcon, CurveIcon, YIcon, XIcon, Cross90Icon } from '../components/UI/Icons';

export const TRACK_TOOLS = [
  { id: 'STRAIGHT', label: 'Straight Track', icon: StraightIcon },
  { id: 'CURVED', label: 'Curve Track', icon: CurveIcon },
  { id: 'Y_TRACK', label: 'Y-Switch', icon: YIcon },
  { id: 'X_TRACK', label: 'X-Crossing', icon: XIcon },
  { id: 'CROSS_90', label: '90° Cross', icon: Cross90Icon },
];

// GLB model per track type. `node` is the mesh that drives collision and
// color feedback; `extraNodes` are rendered with their original materials.
export const TRACK_MODELS = {
  STRAIGHT: { url: '/models/track_straight-opt.glb', node: 'straight' },
  CURVED: { url: '/models/track_curved-opt.glb', node: 'track_curved' },
  CURVED_LEFT: { url: '/models/track_curved_L-opt.glb', node: 'track_curved-l' },
  Y_TRACK: { url: '/models/track_switch-opt.glb', node: 'Y', extraNodes: ['switch'] },
  X_TRACK: { url: '/models/track_cross60-opt.glb', node: 'cross60' },
  CROSS_90: { url: '/models/track_cross90-opt.glb', node: 'cross90' },
};

export const getTrackModelConfig = (type, isLeft = false) =>
  type === 'CURVED' && isLeft ? TRACK_MODELS.CURVED_LEFT : TRACK_MODELS[type];
