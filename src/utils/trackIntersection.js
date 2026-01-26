// src/utils/trackIntersection.js
import * as THREE from 'three';

const areBoundsTouching = (ghostBox, track) => {
  if (!track.geometry) return false;
  
  // 1. Ensure the bounding box exists
  if (!track.geometry.boundingBox) track.geometry.computeBoundingBox();
  
  // 2. Clone the local box so we don't modify the original
  const trackBox = track.geometry.boundingBox.clone();
  
  // 3. Create the world matrix for the existing track
  const trackMatrix = new THREE.Matrix4().compose(
    new THREE.Vector3(...track.position),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, track.rotation, 0)),
    new THREE.Vector3(1, 1, 1)
  );
  
  // 4. Move the box to its real position in the world
  trackBox.applyMatrix4(trackMatrix);
  trackBox.expandByScalar(5); // Small buffer to prevent math precision gaps
  
  // 5. Check intersection against the ghost's world-space box
  return ghostBox.intersectsBox(trackBox);
};

export const checkTrackCollision = (ghost, existingTracks, parentId) => {
  if (!ghost.geometry || !ghost.geometry.boundsTree) return false;

  // Prepare Ghost Box in World Space
  if (!ghost.geometry.boundingBox) ghost.geometry.computeBoundingBox();
  const ghostBox = ghost.geometry.boundingBox.clone();

  const ghostMatrix = new THREE.Matrix4().compose(
    ghost.position,
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ghost.rotation, 0)),
    new THREE.Vector3(0.98, 0.98, 0.98) // Slight shrink for ports
  );
  ghostBox.applyMatrix4(ghostMatrix);

  // Filter nearby tracks using the volumetric check
  const nearby = existingTracks.filter(t => 
    t.id !== parentId && areBoundsTouching(ghostBox, t)
  );
  
  if (nearby.length === 0) return false;

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

    // Exact triangle check
    if (track.geometry.boundsTree.intersectsGeometry(ghost.geometry, relativeMatrix)) {
      console.log("YES, it is intersect!")
      return true;
    }
  }
  return false;
};