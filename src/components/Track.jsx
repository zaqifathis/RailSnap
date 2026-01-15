import React, { useMemo } from 'react';
import { Line, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { STRAIGHT_LENGTH, CURVE_RADIUS, CURVE_ANGLE } from '../utils/constants';
import {TrackStraight} from './models/TrackStraight';


const Track = ({ 
  position= [0, 0, 0],
  rotation=0,
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
  const paths = useMemo(() => {
    // --- STRAIGHT ---
    if (type === 'STRAIGHT') {
      return [[
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, STRAIGHT_LENGTH),
      ]];
    }

    // --- CURVED ---
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
      return [pts];
    }

    // --- Y-TRACK (Switch) ---
    if (type === 'Y_TRACK') {
      const leftPath = [];
      const rightPath = [];
      const segments = 32;
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * CURVE_ANGLE;
        const z = Math.sin(angle) * CURVE_RADIUS;
        const xLeft = (CURVE_RADIUS - Math.cos(angle) * CURVE_RADIUS) * -1;
        const xRight = (CURVE_RADIUS - Math.cos(angle) * CURVE_RADIUS) * 1;
        leftPath.push(new THREE.Vector3(xLeft, 0, z));
        rightPath.push(new THREE.Vector3(xRight, 0, z));
      }
      return [leftPath, rightPath];
    }

    // --- X-TRACK (Crossing) ---
    if (type === 'X_TRACK') {
      const half = STRAIGHT_LENGTH / 2;
      const angle = Math.PI / 3; // 60 degrees
      const pathA = [
        new THREE.Vector3(0, 0, -half),
        new THREE.Vector3(0, 0, half),
      ];
      const pathB = [
        new THREE.Vector3(-Math.sin(angle) * half, 0, -Math.cos(angle) * half),
        new THREE.Vector3(Math.sin(angle) * half, 0, Math.cos(angle) * half),
      ];
      return [pathA, pathB];
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
      if (type === "STRAIGHT") trackColor = '#0b3c66'
      if (type === "CURVED") trackColor = '#7e0c6b'
      if (type === "Y_TRACK") trackColor = '#b31552'
      if (type === "X_TRACK") trackColor = '#0e798b'
  }

  return (
    <group 
      position={position}          
      rotation={[0, rotation, 0]}
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
      {paths.map((pts, index) => {
        return (
          <Line 
            key={index}
            points={pts}
            visible={true} 
            color={trackColor} 
            lineWidth={isSelected ? 6 : (isGhost ? 5 : 3)} 
            transparent={isGhost} 
            opacity={isGhost ? 0.5 : 1}
          />
        );
      })}
    </group>
    
  );
};

export default Track;