import * as THREE from 'three';
import { Plane } from '@react-three/drei';
import { useState, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

import Track from '../Tracks/Track';
import { computeGhostState } from '../../utils/ghostPlacement';

// Track types whose anchor port can be cycled with right-click.
const CYCLABLE_TOOLS = ['Y_TRACK', 'X_TRACK', 'CROSS_90'];

// Mounted with key={activeTool} so all ghost state (orientation, port
// index, cached geometry) resets when the tool changes.
const InteractionHandler = ({ activeTool, tracks = [], onPlaceTrack }) => {
  const [isLeft, setIsLeft] = useState(false);
  const [ghostPortIndex, setGhostPortIndex] = useState(0);
  const [mousePos, setMousePos] = useState(() => new THREE.Vector3());
  const [ghostGeometry, setGhostGeometry] = useState(null);
  const { raycaster, pointer, camera } = useThree();
  const floorRef = useRef();

  useFrame(() => {
    if (!activeTool || !floorRef.current) return;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObject(floorRef.current);
    if (hits.length > 0) {
      setMousePos(hits[0].point);
    }
  });

  const ghostState = useMemo(
    () => computeGhostState({ activeTool, isLeft, ghostPortIndex, mousePos, tracks, ghostGeometry }),
    [activeTool, isLeft, ghostPortIndex, mousePos, tracks, ghostGeometry]
  );

  const handleContextMenu = (e) => {
    if (!activeTool) return;
    e.nativeEvent.preventDefault();

    if (activeTool === 'CURVED') setIsLeft((prev) => !prev);
    else if (CYCLABLE_TOOLS.includes(activeTool)) setGhostPortIndex((prev) => prev + 1);
  };

  const handleClick = () => {
    if (!activeTool || !ghostState) return;

    const isFirstTrack = tracks.length === 0;
    const canPlace = isFirstTrack || (ghostState.isSnapped && !ghostState.isOccupied);
    if (!canPlace) return;

    onPlaceTrack(
      activeTool,
      ghostState.pos,
      ghostState.rot,
      ghostState.snapInfo,
      isLeft,
      ghostGeometry
    );
  };

  return (
    <>
      <Plane
        ref={floorRef}
        name="interaction-floor"
        args={[10000, 10000]}
        rotation={[-Math.PI / 2, 0, 0]}
        onContextMenu={handleContextMenu}
        onClick={handleClick}
      >
        <meshBasicMaterial transparent opacity={0} />
      </Plane>

      {activeTool && ghostState && (
        <group position={ghostState.pos} rotation={[0, ghostState.rot, 0]}>
          <Track
            type={activeTool}
            isLeft={activeTool === 'CURVED' ? isLeft : false}
            isGhost
            isOccupied={ghostState.isOccupied}
            isSnapped={ghostState.isSnapped}
            onGeometryReady={setGhostGeometry}
          />
        </group>
      )}
    </>
  );
};

export default InteractionHandler;
