import React, { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { STRAIGHT_LENGTH, CURVE_RADIUS, CURVE_ANGLE } from '../../utils/constants';

const Track = ({ type = 'STRAIGHT', isLeft = false, isGhost = false, isOccupied = false, isSnapped = false }) => {
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

  // COLOR LOGIC
  let trackColor;
  if (isGhost) {
    if (isOccupied) {
      trackColor = '#ff0000'; // Red for blocked
    } else if (isSnapped) {
      trackColor = '#cfb912'; // Yellow for valid snap
    } else {
      // Free movement color
      trackColor = '#a3a3a3';
    }
  } else {
    trackColor = type === 'STRAIGHT' ? '#0b3c66' : isLeft ? '#ac269a' : '#14c4ff';
  }

  return (
    <Line 
      points={points} 
      color={trackColor} 
      lineWidth={isGhost ? 5 : 3} 
      transparent={isGhost} 
      opacity={isGhost ? 0.5 : 1} 
    />
  );
};

export default Track;