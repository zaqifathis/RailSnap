import * as THREE from 'three';
import { getPortsTrack } from '../constants/trackPaths';

export const UP = new THREE.Vector3(0, 1, 0);

const toVector3 = (position) =>
  position instanceof THREE.Vector3 ? position.clone() : new THREE.Vector3(...position);

/**
 * Transforms a local port into world space given the track's position and rotation.
 * @param {{pos: THREE.Vector3, rot: number, id: string}} port - Local port definition
 * @param {THREE.Vector3|number[]} position - Track world position
 * @param {number} rotation - Track Y rotation in radians
 */
export const portToWorld = (port, position, rotation) => ({
  ...port,
  pos: port.pos.clone().applyAxisAngle(UP, rotation).add(toVector3(position)),
  rot: port.rot + rotation,
});

/** Returns all ports of a track in world space. */
export const getWorldPorts = (track) =>
  getPortsTrack(track.type, track.isLeft).map((p) =>
    portToWorld(p, track.position, track.rotation)
  );

/**
 * Returns the local port a new track anchors with when snapping.
 * Y tracks cycle through all 3 ports; crossings cycle through their
 * two entry ports; everything else anchors at its first port.
 */
export const getAnchorPort = (type, isLeft = false, portIndex = 0) => {
  const ports = getPortsTrack(type, isLeft);
  if (ports.length === 0) return null;
  if (type === 'Y_TRACK') return ports[portIndex % ports.length];
  if (type === 'X_TRACK' || type === 'CROSS_90') return ports[portIndex % (ports.length / 2)];
  return ports[0];
};
