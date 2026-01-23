// src/utils/trackIntersection.js
import * as THREE from 'three';

/**
 * BROAD-PHASE: Quick distance filter to skip tracks that are physically 
 * impossible to hit. This keeps the BVH math performant.
 */
const isWithinRangeSq = (pos1, pos2, thresholdSq = 5000) => {
  const dx = pos1.x - pos2[0];
  const dz = pos1.z - pos2[2];
  return (dx * dx + dz * dz) < thresholdSq;
};

/**
 * NARROW-PHASE: Checks for actual triangle-to-triangle intersection 
 * between the ghost track and existing tracks using three-mesh-bvh.
 */
export const checkTrackCollision = (ghost, existingTracks, parentId) => {
  // 1. Broad Phase: Only check tracks near the ghost
  const nearby = existingTracks.filter(t => 
    t.id !== parentId && 
    isWithinRangeSq(ghost.position, t.position)
  );
  
  if (nearby.length === 0) return false;

  // 2. Prepare Ghost Transformation Matrix
  const ghostMatrix = new THREE.Matrix4().compose(
    ghost.position,
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ghost.rotation, 0)),
    new THREE.Vector3(1, 1, 1)
  );

  // 3. BVH Intersection Loop
  for (const track of nearby) {
    // Note: This requires that your track state or model components 
    // provide access to the pre-computed boundsTree
    if (!track.geometry?.boundsTree) continue;

    const trackMatrix = new THREE.Matrix4().compose(
      new THREE.Vector3(...track.position),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, track.rotation, 0)),
      new THREE.Vector3(1, 1, 1)
    );

    // Calculate relative matrix to transform ghost into the local space of the existing track
    const relativeMatrix = new THREE.Matrix4()
      .copy(trackMatrix)
      .invert()
      .multiply(ghostMatrix);

    /**
     * intersectsGeometry is the core BVH method. 
     * It checks if the ghost geometry hits the target's triangle tree.
     */
    const isColliding = track.geometry.boundsTree.intersectsGeometry(
      ghost.geometry, 
      relativeMatrix
    );

    if (isColliding) return true;
  }

  return false;
};