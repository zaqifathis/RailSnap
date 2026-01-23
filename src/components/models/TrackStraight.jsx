import React, { forwardRef, useEffect } from 'react';
import * as THREE from 'three';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
import { useGLTF } from '@react-three/drei';
import { interactionColor } from '../../constants/theme';

if (!THREE.BufferGeometry.prototype.computeBoundsTree) {
  THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
  THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
  THREE.Mesh.prototype.raycast = acceleratedRaycast;
}

export const TrackStraight = forwardRef(({ isGhost, isOccupied, isSnapped, isSelected, raycast, ...props }, ref) => {
  const { nodes } = useGLTF('/models/track_straight-opt.glb');

  useEffect(() => {
    if (nodes.straight) {
      nodes.straight.geometry.computeBoundsTree();
      return () => nodes.straight.geometry.disposeBoundsTree();
    }
  }, [nodes]);

  const getMaterialColor = () => {
    if (isOccupied) return interactionColor.occupied;
    if (isSnapped) return interactionColor.snap;  
    if (isSelected) return interactionColor.selected;
    return interactionColor.default;                 
  };

  return (
    <group {...props} dispose={null}>
      <mesh
        ref={ref}
        name="straight"
        castShadow
        receiveShadow
        geometry={nodes.straight.geometry}
        raycast={raycast}
      >
        <meshStandardMaterial 
          color={getMaterialColor()}
          roughness={0.4}
          transparent={isGhost}
          opacity={isGhost ? 0.5 : 1}
        />
      </mesh>
    </group>
  );
});

useGLTF.preload('/models/track_straight-opt.glb');