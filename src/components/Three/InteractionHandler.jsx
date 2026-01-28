import * as THREE from 'three';
import { Plane } from '@react-three/drei';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

import Track from '../Tracks/Track';
import {checkTrackCollision} from './trackIntersection'
import { getPortsTrack } from '../../constants/trackPaths';

const InteractionHandler = ({ activeTool, tracks = [], onPlaceTrack }) => {
  const [isLeft, setIsLeft] = useState(false);
  const [ghostPortIndex, setGhostPortIndex] = useState(0);
  const [mousePos, setMousePos] = useState(new THREE.Vector3(0, 0, 0));
  const [ghostGeometry, setGhostGeometry] = useState(null);
  const { raycaster, pointer, camera, scene } = useThree();
  const floorRef = useRef();

  useEffect(() => {
    setIsLeft(false);
    setGhostPortIndex(0);
  }, [activeTool]);

  useFrame(() => {
    if (!activeTool || !floorRef.current) return;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObject(floorRef.current);
    if (hits.length > 0) {
      setMousePos(hits[0].point);
    }
  });

  const ghostState = useMemo(() => {
    if (!activeTool) return null;

    let bestTarget = null;
    let minDistance = 30;

    // 1. Find Snap Target
    tracks.forEach(track => {
      const ports = getPortsTrack(track.type, track.isLeft).map(p => {
        const worldPos = p.pos.clone()
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), track.rotation)
          .add(new THREE.Vector3(...track.position));
        
        return { ...p, pos: worldPos, rot: p.rot + track.rotation, parentId: track.id };
      });

      ports.forEach(port => {
        const dist = mousePos.distanceTo(port.pos);
        if (dist < minDistance) {
          const isOccupied = track.connections && track.connections[port.id] !== null && track.connections[port.id] !== undefined;
          bestTarget = {...port, isOccupied};
          minDistance = dist;
        }
      });
    });

    // 2. Local Anchor Logic
    const localPortsList = getPortsTrack(activeTool, isLeft);

    const portToUse =( activeTool === 'Y_TRACK') ? localPortsList[ghostPortIndex % localPortsList.length]
      : (activeTool === 'X_TRACK') ? localPortsList[ghostPortIndex % (localPortsList.length/2)] : localPortsList[0];

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
      finalRot = bestTarget.rot - selectedLocalPort.rot;
      const worldOffset = selectedLocalPort.pos.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), finalRot);
      finalPosVec = bestTarget.pos.clone().sub(worldOffset);
    } else {
      finalRot = -selectedLocalPort.rot; 
      const worldOffset = selectedLocalPort.pos.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), finalRot);
      finalPosVec.sub(worldOffset);
    }

    // 3. BVH Collision Check
    const potentialConnections = [];
    const ghostWorldPorts = localPortsList.map(lp => {
      const worldPos = lp.pos.clone()
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), finalRot)
        .add(finalPosVec);
      return { ...lp, pos: worldPos };
    });

    // Check every track in the scene to see if it aligns with ANY of the ghost's ports
    tracks.forEach(track => {
      const trackPorts = getPortsTrack(track.type, track.isLeft).map(p => {
        const pWorld = p.pos.clone()
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), track.rotation)
          .add(new THREE.Vector3(...track.position));
        return { ...p, pos: pWorld };
      });

      trackPorts.forEach(tp => {
        ghostWorldPorts.forEach(gp => {
          // If a ghost port is extremely close to an existing track port, it's a connection
          if (gp.pos.distanceTo(tp.pos) < 1) { // 1mm threshold
            potentialConnections.push(track.id);
          }
        });
      });
    });

    const isIntersecting = ghostGeometry ? checkTrackCollision(
      { position: finalPosVec, rotation: finalRot, geometry: ghostGeometry },
      tracks,
      potentialConnections
    ) : false;
    
    return {
      pos: [finalPosVec.x, 0, finalPosVec.z],
      rot: finalRot,
      isSnapped: isSnapped,
      isOccupied: isOccupied || isIntersecting,
      snapInfo: isSnapped ? { ...bestTarget, ghostPortIndex: ghostPortIndex } : null
    };
  }, [mousePos, ghostPortIndex, activeTool, tracks, isLeft, ghostGeometry]);

  return (
    <>
      <Plane 
        ref={floorRef}
        name="interaction-floor"
        args={[10000, 10000]} 
        rotation={[-Math.PI / 2, 0, 0]} 
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
              isLeft,
              ghostGeometry
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
            isLeft={activeTool === 'CURVED' ? isLeft : false} 
            isGhost
            isOccupied={ghostState.isOccupied}
            isSnapped={ghostState.isSnapped}
            onGeometryReady={setGhostGeometry}
            raycast={() => null}
          />
        </group>
      )}
    </>
  );
};

export default InteractionHandler;