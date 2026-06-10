import { useMemo, useRef, useEffect } from 'react';
import { Line } from '@react-three/drei';

import { TrackModel } from './models/TrackModel';
import { interactionColor, trackColors, trackLineStyle } from '../../constants/theme';
import { getTrackPaths } from '../../constants/trackPaths';

const getLineColor = ({ type, isGhost, isOccupied, isSnapped, isSelected }) => {
  if (isSelected) return interactionColor.selected;
  if (isGhost) {
    if (isOccupied) return interactionColor.occupied;
    if (isSnapped) return interactionColor.snap;
    return interactionColor.default;
  }
  return trackColors[type] ?? interactionColor.default;
};

const Track = ({
  position = [0, 0, 0],
  rotation = 0,
  type = 'STRAIGHT',
  isLeft = false,
  isGhost = false,
  isOccupied = false,
  isSnapped = false,
  isSelected = false,
  onPointerOver,
  onPointerOut,
  onGeometryReady,
  onClick,
  switchDirection,
  onSwitchClick,
}) => {
  const meshRef = useRef();

  useEffect(() => {
    if (meshRef.current && onGeometryReady) {
      onGeometryReady(meshRef.current.geometry);
    }
  }, [type, isLeft, onGeometryReady]);

  const paths = useMemo(() => getTrackPaths(type, isLeft), [type, isLeft]);
  const lineColor = getLineColor({ type, isGhost, isOccupied, isSnapped, isSelected });

  return (
    <group
      position={position}
      rotation={[0, rotation, 0]}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      onClick={onClick}
    >
      <TrackModel
        ref={meshRef}
        type={type}
        isLeft={isLeft}
        isGhost={isGhost}
        isOccupied={isOccupied}
        isSnapped={isSnapped}
        isSelected={isSelected}
        switchDirection={switchDirection}
        onSwitchClick={onSwitchClick}
      />

      {trackLineStyle.visible &&
        paths.map((points, index) => (
          <Line
            key={index}
            points={points}
            color={lineColor}
            lineWidth={isSelected ? trackLineStyle.selectedWidth : trackLineStyle.width}
            transparent={isGhost}
            opacity={isGhost ? 0.5 : 1}
            raycast={() => null}
          />
        ))}
    </group>
  );
};

export default Track;
