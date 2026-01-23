import * as THREE from 'three';
import { STRAIGHT_LENGTH,CURVE_ANGLE, CURVE_RADIUS } from '../constants/constants';
import { Plane } from '@react-three/drei';
import { useState, useEffect, useMemo } from 'react';
import Track from './Track';
import { checkTrackCollision } from '../utils/trackIntersection';
import { getTrackPaths, getPortsTrack } from '../constants/trackPaths';

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
    const { type, rotation = 0, position, isLeft: trackIsLeft } = track;
    const posVec = new THREE.Vector3(...position);
    const localPorts = getPortsTrack(type, trackIsLeft);

    return localPorts.map(port => {
      const worldPos = port.pos
        .clone()
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), rotation)
        .add(posVec);
      
      return { 
        ...port, 
        pos: worldPos, 
        rot: port.rot + rotation,
        parentId: track.id 
      };
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
          const isOccupied = track.connections && track.connections[port.id] !== null && track.connections[port.id] !== undefined;
          bestTarget = {...port, isOccupied};
          minDistance = dist;
        }
      });
    });

    // UNIVERSAL ANCHOR LOGIC
    const localPortsList = getPortsTrack(activeTool, isLeft);
    const portToUse = (activeTool === 'Y_TRACK' || activeTool === 'X_TRACK') 
      ? localPortsList[ghostPortIndex % localPortsList.length]
      : localPortsList[0];

    const selectedLocalPort = {
      pos: portToUse.pos,
      rot: portToUse.rot + Math.PI // We rotate 180 because we "look into" the port to snap
    };

    let finalRot = 0;
    let finalPosVec = mousePos.clone();
    let isSnapped = false;
    let isOccupied = false;

    if (bestTarget) {
      isSnapped = true;
      isOccupied = bestTarget.isOccupied;
      // Align so ghost faces AWAY from parent (+ Math.PI)
      finalRot = bestTarget.rot - selectedLocalPort.rot;
      const worldOffset = selectedLocalPort.pos.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), finalRot);
      finalPosVec = bestTarget.pos.clone().sub(worldOffset);
    } else {
      finalRot = -selectedLocalPort.rot; 
      const worldOffset = selectedLocalPort.pos.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), finalRot);
      finalPosVec.sub(worldOffset);
    }

    const ghostPaths = getTrackPaths(activeTool, isLeft);
    const isIntersecting = checkTrackCollision(
      { position: finalPosVec, rotation: finalRot, paths: ghostPaths },
      tracks,
      bestTarget?.parentId
    );

    return {
      pos: [finalPosVec.x, 0, finalPosVec.z],
      rot: finalRot,
      isSnapped: isSnapped,
      isOccupied: isOccupied || isIntersecting,
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
  
          if (activeTool && (isFirstTrack || ghostState.isSnapped && !ghostState.isOccupied)) {
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
        <group position={ghostState.pos} rotation={[0, ghostState.rot, 0]} pointerEvents="none">
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