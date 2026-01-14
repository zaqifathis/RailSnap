import React, { useMemo } from 'react';
import { Line, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { STRAIGHT_LENGTH, CURVE_RADIUS, CURVE_ANGLE } from '../utils/constants';
import {TrackStraight} from './models/TrackStraight';

const Track = ({ 
  type = 'STRAIGHT', 
  isLeft = false, 
  isGhost = false, 
  isOccupied = false, 
  isSnapped = false,
  isSelected = false, 
  onPointerOver,
  onPointerOut,
  onClick 
}) => {  

  // TRACKS LINE/CURVE
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

  let trackColor;
  if (isSelected) {
    trackColor = '#ffffff'; // White highlight when hovering for delete
  } else if (isGhost) {
    if (isOccupied) trackColor = '#ff0000';
    else if (isSnapped) trackColor = '#cfb912';
    else trackColor = '#a3a3a3';
  } else {
    trackColor = type === 'STRAIGHT' ? '#0b3c66' : isLeft ? '#ac269a' : '#14c4ff';
  }

  return (
    <group 
      onPointerOver={onPointerOver} 
      onPointerOut={onPointerOut} 
      onClick={onClick}
    >
      {type === 'STRAIGHT' && (
        <TrackStraight 
          isGhost={isGhost}
          isOccupied={isOccupied}
          isSnapped={isSnapped}
        />
      )}
      <Line 
      points={points}
      visible={false} 
      // color={trackColor} 
      // lineWidth={isSelected ? 6 : (isGhost ? 5 : 3)} 
      // transparent={isGhost} 
      // opacity={isGhost ? 0.5 : 1}
      // onPointerOver={onPointerOver}
      // onPointerOut={onPointerOut}
      // onClick={onClick}
      />
    </group>
    
  );
};

export default Track;