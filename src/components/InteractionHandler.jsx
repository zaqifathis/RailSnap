import * as THREE from 'three';
import { STRAIGHT_LENGTH,CURVE_ANGLE, CURVE_RADIUS } from '../utils/constants';
import { Plane } from '@react-three/drei';
import { useState, useEffect, useMemo } from 'react';
import Track from './Track';

const InteractionHandler = ({ activeTool, tracks = [], onPlaceTrack }) => {
  const [isLeft, setIsLeft] = useState(false);
  const [ghostPortIndex, setGhostPortIndex] = useState(0);
  const [mousePos, setMousePos] = useState(new THREE.Vector3(0, 0, 0));
  const SNAP_THRESHOLD = 30;

  useEffect(() => {
    setIsLeft(false);
    setGhostPortIndex(0);
  }, [activeTool]);

  const handlePointerMove = (e) => {
    if (!activeTool) return;
    setMousePos(e.point); // Just update the raw position
  };

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
      const angle = Math.PI / 3;
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

  const ghostState = useMemo(() => {
    if (!activeTool) return null;

    let bestTarget = null;
    let minDistance = SNAP_THRESHOLD;

    // 1. Find Snap Target
    tracks.forEach(track => {
      const ports = getPorts(track); 
      ports.forEach(port => {
        const dist = mousePos.distanceTo(port.pos);
        if (dist < minDistance) {
          bestTarget = port;
          minDistance = dist;
        }
      });
    });

    // 2. UNIVERSAL ANCHOR LOGIC
    let selectedLocalPort = { pos: new THREE.Vector3(0, 0, 0), rot: 0 };

    if (activeTool === 'Y_TRACK') {
      const yPorts = ['base', 'left', 'right'];
      const activePortId = yPorts[ghostPortIndex % 3];
      const localPorts = {
        base: { pos: new THREE.Vector3(0, 0, 0), rot: 0 },
        left: { 
          pos: new THREE.Vector3((CURVE_RADIUS - Math.cos(CURVE_ANGLE) * CURVE_RADIUS) * -1, 0, Math.sin(CURVE_ANGLE) * CURVE_RADIUS), 
          rot: -CURVE_ANGLE + Math.PI
        },
        right: { 
          pos: new THREE.Vector3((CURVE_RADIUS - Math.cos(CURVE_ANGLE) * CURVE_RADIUS) * 1, 0, Math.sin(CURVE_ANGLE) * CURVE_RADIUS), 
          rot: CURVE_ANGLE + Math.PI
        }
      };
      selectedLocalPort = localPorts[activePortId];
    } else if (activeTool === 'X_TRACK') {
      const xPorts = ['a_start', 'b_start'];
      const activePortId = xPorts[ghostPortIndex % 2];
      const angle = Math.PI / 3; // 60 deg
      const half = STRAIGHT_LENGTH / 2;
      const localPorts = {
        a_start: { pos: new THREE.Vector3(0, 0, -half), rot: 0 },
        a_end: { pos: new THREE.Vector3(0, 0, half), rot: Math.PI },
        b_start: { pos: new THREE.Vector3(-Math.sin(angle) * half, 0, -Math.cos(angle) * half), rot: angle },
        b_end: { pos: new THREE.Vector3(Math.sin(angle) * half, 0, Math.cos(angle) * half), rot: angle + Math.PI }
      };
      selectedLocalPort = localPorts[activePortId];
    } else {
      // STRAIGHT and CURVED always "grab" by the start [0,0,0]
      selectedLocalPort = { pos: new THREE.Vector3(0, 0, 0), rot: 0 };
    }

    let finalRot = 0;
    let finalPosVec = mousePos.clone();
    let isSnapped = false;

    if (bestTarget) {
      isSnapped = true;
      // Align so ghost faces AWAY from parent (+ Math.PI)
      finalRot = bestTarget.rot - selectedLocalPort.rot;
      const worldOffset = selectedLocalPort.pos.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), finalRot);
      finalPosVec = bestTarget.pos.clone().sub(worldOffset);
    } else {
      finalRot = -selectedLocalPort.rot; 
      const worldOffset = selectedLocalPort.pos.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), finalRot);
      finalPosVec.sub(worldOffset);
    }

    return {
      pos: [finalPosVec.x, 0, finalPosVec.z],
      rot: finalRot,
      isSnapped: isSnapped,
      snapInfo: isSnapped ? { ...bestTarget, ghostPortIndex: ghostPortIndex } : null
    };
  }, [mousePos, ghostPortIndex, activeTool, tracks, isLeft]);

  return (
    <>
      <Plane 
        args={[10000, 10000]} 
        rotation={[-Math.PI / 2, 0, 0]} 
        onPointerMove={handlePointerMove}
        onContextMenu={(e) => {
          if (!activeTool) return;
          e.nativeEvent.preventDefault();

          if (activeTool === 'CURVED') setIsLeft(!isLeft); 
          else if (activeTool === 'Y_TRACK' || activeTool === 'X_TRACK') {
            setGhostPortIndex(prev => prev + 1); // Cycle snapping port
          }
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