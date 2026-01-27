import * as THREE from 'three';
import { STRAIGHT_LENGTH, CURVE_RADIUS, CURVE_ANGLE } from '../constants/constants';

/**
 * Generates mathematical path points for collision and rendering.
 * @param {string} type - The track type (e.g., 'STRAIGHT', 'CURVED')
 * @param {boolean} isLeft - Orientation for curved tracks
 * @returns {THREE.Vector3[][]} Array of paths, where each path is an array of Vector3 points.
 */

export const getTrackPaths = (type, isLeft = false) => {
  switch (type) {
    case 'STRAIGHT':
      return [[
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(0, 0, STRAIGHT_LENGTH),
      ]];

    case 'CURVED': {
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

    case 'Y_TRACK': {
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

    case 'X_TRACK': {
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

    case 'CROSS_90': {
      const half = STRAIGHT_LENGTH / 2;
      return [
        [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, STRAIGHT_LENGTH)],
        [new THREE.Vector3(-half, 0, half), new THREE.Vector3(half, 0, half)],
      ];
    }

    default:
      return [];
  }
};


/**
 * Returns the local port positions and rotations for a track type.
 * @param {string} type - Track type (STRAIGHT, CURVED, etc.)
 * @param {boolean} isLeft - Orientation for curved tracks
 * @returns {Array} List of ports with local pos, rot, and id.
 */
export const getPortsTrack = (type, isLeft = false) => {
  const ports = [];

  switch (type) {
    case 'STRAIGHT':
      ports.push({ pos: new THREE.Vector3(0, 0, 0), rot: Math.PI, id: 'start' });
      ports.push({ pos: new THREE.Vector3(0, 0, STRAIGHT_LENGTH), rot: 0, id: 'end' });
      break;

    case 'CURVED': {
      ports.push({ pos: new THREE.Vector3(0, 0, 0), rot: Math.PI, id: 'start' });
      const dir = isLeft ? -1 : 1;
      const localEnd = new THREE.Vector3(
        (CURVE_RADIUS - Math.cos(CURVE_ANGLE) * CURVE_RADIUS) * dir,
        0,
        Math.sin(CURVE_ANGLE) * CURVE_RADIUS
      );
      const angleChange = isLeft ? -CURVE_ANGLE : CURVE_ANGLE;
      ports.push({ pos: localEnd, rot: angleChange, id: 'end' });
      break;
    }

    case 'Y_TRACK':
      ports.push({ pos: new THREE.Vector3(0, 0, 0), rot: Math.PI, id: 'start' });
      ports.push({ 
        pos: new THREE.Vector3((CURVE_RADIUS - Math.cos(CURVE_ANGLE) * CURVE_RADIUS) * -1, 0, Math.sin(CURVE_ANGLE) * CURVE_RADIUS), 
        rot: -CURVE_ANGLE, id: 'end_left' 
      });
      ports.push({ 
        pos: new THREE.Vector3((CURVE_RADIUS - Math.cos(CURVE_ANGLE) * CURVE_RADIUS) * 1, 0, Math.sin(CURVE_ANGLE) * CURVE_RADIUS), 
        rot: CURVE_ANGLE, id: 'end_right' 
      });
      break;

    case 'X_TRACK': {
      const half = STRAIGHT_LENGTH / 2;
      const angle = Math.PI / 3;
      ports.push({ pos: new THREE.Vector3(0, 0, -half), rot: Math.PI, id: 'a_start' });
      ports.push({ 
        pos: new THREE.Vector3(-Math.sin(angle) * half, 0, -Math.cos(angle) * half), 
        rot: angle + Math.PI, id: 'b_start' 
      });
      ports.push({ pos: new THREE.Vector3(0, 0, half), rot: 0, id: 'a_end' });
      ports.push({ 
        pos: new THREE.Vector3(Math.sin(angle) * half, 0, Math.cos(angle) * half), 
        rot: angle, id: 'b_end' 
      });
      break;
    }

    case 'CROSS_90': {
      const half = STRAIGHT_LENGTH / 2;
      ports.push({ pos: new THREE.Vector3(0, 0, 0), rot: Math.PI, id: 'a_start' });
      ports.push({ pos: new THREE.Vector3(0, 0, STRAIGHT_LENGTH), rot: 0, id: 'a_end' });
      ports.push({ pos: new THREE.Vector3(-half, 0, half), rot: -Math.PI / 2, id: 'b_start' });
      ports.push({ pos: new THREE.Vector3(half, 0, half), rot: Math.PI / 2, id: 'b_end' });
      break;
    }
    
    default:
      break;
  }

  return ports;
};