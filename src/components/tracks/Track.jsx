import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { STRAIGHT_LENGTH, CURVE_RADIUS, CURVE_ANGLE } from '../../utils/constants';

const Track = ({ type = 'STRAIGHT', isLeft = false, isGhost = false }) => {
  const points = useMemo(() => {
    if (type === 'STRAIGHT') {
      return [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, STRAIGHT_LENGTH),
      ];
    }

    if (type === 'CURVED') {
      const pts = [];
      const segments = 32;
      const direction = isLeft ? -1 : 1;

      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * CURVE_ANGLE;
        const x = (CURVE_RADIUS - Math.cos(angle) * CURVE_RADIUS) * direction;
        const z = Math.sin(angle) * CURVE_RADIUS;
        pts.push(new THREE.Vector3(x, 0, z));
      }
      return pts;
    }
    return [];
  }, [type, isLeft]);

  const trackColor = type === 'STRAIGHT' ? '#0b3c66' : isLeft ? '#ac269a' : '#ff141b';

  return (
    <Line 
      points={points} 
      color={trackColor} 
      lineWidth={3} 
      transparent={isGhost} 
      opacity={isGhost ? 0.5 : 1} 
    />
  );
};

export default Track;