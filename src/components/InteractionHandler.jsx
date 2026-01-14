import * as THREE from 'three';
import { STRAIGHT_LENGTH,CURVE_ANGLE, CURVE_RADIUS } from '../utils/constants';
import { Plane } from '@react-three/drei';
import { useState, useEffect } from 'react';
import Track from './Track';

const InteractionHandler = ({ activeTool, tracks = [], onPlaceTrack }) => {
  const [isLeft, setIsLeft] = useState(false);
  const [ghostState, setGhostState] = useState({ 
    pos: [0, 0, 0], 
    rot: 0, 
    isOccupied: false, 
    isSnapped: false,
    snapInfo: null
  });
  const SNAP_THRESHOLD = 30;

  useEffect(() => {
    setIsLeft(false);
  }, [activeTool]);

  const getPorts = (track) => {
    const ports = [];
    const { type, rotation = 0, position, isLeft: trackIsLeft } = track;
    const posVec = new THREE.Vector3(...position);

    // 1. STRAIGHT: Start [0,0,0], End [0,0,L]
    if (type === 'STRAIGHT') {
      ports.push({ pos: new THREE.Vector3(0, 0, 0), rot: rotation + Math.PI, id: 'start' });
      ports.push({ pos: new THREE.Vector3(0, 0, STRAIGHT_LENGTH), rot: rotation, id: 'end' });
    } 
    
    // 2. CURVED: Start [0,0,0], End [Calculated]
    else if (type === 'CURVED') {
      ports.push({ pos: new THREE.Vector3(0, 0, 0), rot: rotation + Math.PI, id: 'start' });
      const dir = trackIsLeft ? -1 : 1;
      const localEnd = new THREE.Vector3(
        (CURVE_RADIUS - Math.cos(CURVE_ANGLE) * CURVE_RADIUS) * dir,
        0,
        Math.sin(CURVE_ANGLE) * CURVE_RADIUS
      );
      const angleChange = trackIsLeft ? -CURVE_ANGLE : CURVE_ANGLE;
      ports.push({ pos: localEnd, rot: rotation + angleChange, id: 'end' });
    }

    // 3. Y_TRACK: 1 Base Port, 2 Exit Ports
    else if (type === 'Y_TRACK') {
      ports.push({ pos: new THREE.Vector3(0, 0, 0), rot: rotation + Math.PI, id: 'base' });
      // Left exit
      ports.push({ 
        pos: new THREE.Vector3((CURVE_RADIUS - Math.cos(CURVE_ANGLE) * CURVE_RADIUS) * -1, 0, Math.sin(CURVE_ANGLE) * CURVE_RADIUS), 
        rot: rotation - CURVE_ANGLE, id: 'left' 
      });
      // Right exit
      ports.push({ 
        pos: new THREE.Vector3((CURVE_RADIUS - Math.cos(CURVE_ANGLE) * CURVE_RADIUS) * 1, 0, Math.sin(CURVE_ANGLE) * CURVE_RADIUS), 
        rot: rotation + CURVE_ANGLE, id: 'right' 
      });
    }

    // 4. X_TRACK: 4 Ports (Crossing at center)
    else if (type === 'X_TRACK') {
      const half = STRAIGHT_LENGTH / 2;
      const angle = Math.PI / 6;
      ports.push({ pos: new THREE.Vector3(0, 0, -half), rot: rotation + Math.PI, id: 'a_start' });
      ports.push({ pos: new THREE.Vector3(0, 0, half), rot: rotation, id: 'a_end' });
      ports.push({ 
        pos: new THREE.Vector3(-Math.sin(angle) * half, 0, -Math.cos(angle) * half), 
        rot: rotation + angle + Math.PI, id: 'b_start' 
      });
      ports.push({ 
        pos: new THREE.Vector3(Math.sin(angle) * half, 0, Math.cos(angle) * half), 
        rot: rotation + angle, id: 'b_end' 
      });
    }

    // Convert local ports to World Space
    return ports.map(port => {
      const worldPos = port.pos
        .clone()
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation)
        .add(posVec);
      
      return { ...port, pos: worldPos, parentId: track.id };
    });
  };

  const handlePointerMove = (e) => {
    if (!activeTool) return;
    let bestTarget = null;
    let minDistance = SNAP_THRESHOLD;

    tracks.forEach(track => {
      const ports = getPorts(track);
      ports.forEach(port => {
        const dist = e.point.distanceTo(port.pos);
        if (dist < minDistance) {
          bestTarget = port;
          minDistance = dist;
        }
      });
    });

    if (bestTarget) {
      let finalPos = [bestTarget.pos.x, 0, bestTarget.pos.z];
      let finalRot = bestTarget.rot;

      // SPECIAL LOGIC FOR X_TRACK GHOST
      // Since X_TRACK pivot is at the center, we must offset the position 
      // so the PORT (edge) hits the snap target, not the center.
      if (activeTool === 'X_TRACK') {
        const half = STRAIGHT_LENGTH / 2;
        const offset = new THREE.Vector3(0, 0, half).applyAxisAngle(new THREE.Vector3(0, 1, 0), finalRot);
        finalPos = [bestTarget.pos.x + offset.x, 0, bestTarget.pos.z + offset.z];
      }

      setGhostState({
        pos: finalPos,
        rot: finalRot,
        isOccupied: false, // Need to check connection logic later
        isSnapped: true,
        snapInfo: bestTarget
      });
    } else {
      setGhostState({ 
        pos: [e.point.x, 0, e.point.z], 
        rot: 0, 
        isOccupied: false, 
        isSnapped: false, 
        snapInfo: null });
    }
  };

  return (
    <>
      <Plane 
        args={[10000, 10000]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        onPointerMove={handlePointerMove}
        onContextMenu={(e) => {
          if (!activeTool) return;
          e.nativeEvent.preventDefault();
          setIsLeft(!isLeft);
        }}
        onClick={() => {
          const isFirstTrack = tracks.length === 0;
  
          if (activeTool && (isFirstTrack || ghostState.isSnapped)) {
            onPlaceTrack(
              activeTool, 
              ghostState.pos,    // Pass the actual ghost position (could be mouse or snapped)
              ghostState.rot,    // Pass the actual ghost rotation
              ghostState.snapInfo, 
              isLeft
            );
          }
        }}
      >
        <meshBasicMaterial transparent opacity={0} />
      </Plane>

      {activeTool && (
        <group position={ghostState.pos} rotation={[0, ghostState.rot, 0]}>
          <Track 
            type={activeTool} 
            isLeft={activeTool === 'STRAIGHT' ? false : activeTool === 'CURVED' ? isLeft : false} 
            isGhost
            isOccupied={ghostState.isOccupied}
            isSnapped={ghostState.isSnapped}
          />
        </group>
      )}
    </>
  );
};

export default InteractionHandler;