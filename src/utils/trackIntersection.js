// src/utils/trackIntersection.js
import * as THREE from 'three';

const areBoundsTouching = (ghostWorldBox, track) => {
  // Check if geometry exists and is a proper Three.js object
  if (!track.geometry || typeof track.geometry.computeBoundingBox !== 'function') {
    return false;
  }
  
  // Ensure the bounding box exists
  if (!track.geometry.boundingBox) track.geometry.computeBoundingBox();
  
  // Create a world-space box for the existing track
  const trackBox = track.geometry.boundingBox.clone();
  const trackMatrix = new THREE.Matrix4().compose(
    new THREE.Vector3(...track.position),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, track.rotation, 0)),
    new THREE.Vector3(1, 1, 1)
  );
  
  trackBox.applyMatrix4(trackMatrix);
  
  // Check intersection against the ghost's world-space box
  return ghostWorldBox.intersectsBox(trackBox);
};

export const checkTrackCollision = (ghost, existingTracks, ignoreIds = []) => {
  // Check if BVH and geometry are available
  if (!ghost.geometry || !ghost.geometry.boundsTree || typeof ghost.geometry.computeBoundingBox !== 'function') {
    return false;
  }

  // 1. Prepare Ghost World-Space Bounding Box
  if (!ghost.geometry.boundingBox) ghost.geometry.computeBoundingBox();
  const ghostWorldBox = ghost.geometry.boundingBox.clone();

  const ghostMatrix = new THREE.Matrix4().compose(
    ghost.position,
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ghost.rotation, 0)),
    new THREE.Vector3(1, 1, 1) 
  );
  ghostWorldBox.applyMatrix4(ghostMatrix);

  // 2. BROAD PHASE: Use the fixed bounding box check
  // Pass ghostWorldBox instead of ghost.position
  const nearby = existingTracks.filter(t => 
    !ignoreIds.includes(t.id) && 
    areBoundsTouching(ghostWorldBox, t)
  );
  
  if (nearby.length === 0) return false;

  // 3. NARROW PHASE: BVH Triangle check
  for (const track of nearby) {
    if (!track.geometry?.boundsTree) continue;

    const trackMatrix = new THREE.Matrix4().compose(
      new THREE.Vector3(...track.position),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, track.rotation, 0)),
      new THREE.Vector3(1, 1, 1)
    );

    const relativeMatrix = new THREE.Matrix4()
      .copy(trackMatrix)
      .invert()
      .multiply(ghostMatrix);

    // Precise triangle intersection
    if (track.geometry.boundsTree.intersectsGeometry(ghost.geometry, relativeMatrix)) {
      return true;
    }
  }
  return false;
};