import * as THREE from 'three';

// 1. BROAD-PHASE: Quick distance filter
const isWithinRangeSq = (pos1, pos2, thresholdSq = 5000) => {
  const dx = pos1.x - pos2[0];
  const dz = pos1.z - pos2[2];
  return (dx * dx + dz * dz) < thresholdSq;
};

// 2. NARROW-PHASE: Shortest distance between two 2D line segments
const getMinDistanceSq = (p1, p2, p3, p4) => {
  const diff1 = new THREE.Vector3().subVectors(p2, p1);
  const diff2 = new THREE.Vector3().subVectors(p4, p3);
  const diff3 = new THREE.Vector3().subVectors(p1, p3);

  const a = diff1.dot(diff1);
  const b = diff1.dot(diff2);
  const c = diff2.dot(diff2);
  const d = diff1.dot(diff3);
  const e = diff2.dot(diff3);
  const denom = a * c - b * b;

  let s, t;

  if (denom !== 0) {
    s = THREE.MathUtils.clamp((b * e - c * d) / denom, 0, 1);
  } else {
    s = 0;
  }

  t = THREE.MathUtils.clamp((b * s + e) / c, 0, 1);
  
  if (denom !== 0) {
      s = THREE.MathUtils.clamp((b * t - d) / a, 0, 1);
  }

  const closestPoint1 = p1.clone().add(diff1.multiplyScalar(s));
  const closestPoint2 = p3.clone().add(diff2.multiplyScalar(t));

  return closestPoint1.distanceToSquared(closestPoint2);
};

export const checkTrackCollision = (ghost, existingTracks, parentId) => {
  if (!ghost.paths) return false;

  const COLLISION_THRESHOLD_SQ = 1600; 

  const ghostWorldSegments = [];
  ghost.paths.forEach(path => {
    for (let i = 0; i < path.length - 1; i++) {
      ghostWorldSegments.push({
        start: new THREE.Vector3(path[i].x, 0, path[i].z).applyAxisAngle(new THREE.Vector3(0, 1, 0), ghost.rotation).add(ghost.position),
        end: new THREE.Vector3(path[i+1].x, 0, path[i+1].z).applyAxisAngle(new THREE.Vector3(0, 1, 0), ghost.rotation).add(ghost.position)
      });
    }
  });

  const nearby = existingTracks.filter(t => t.id !== parentId && isWithinRangeSq(ghost.position, t.position));

  for (const track of nearby) {
    if (!track.paths) continue;
    for (const path of track.paths) {
      for (let i = 0; i < path.length - 1; i++) {
        const tStart = new THREE.Vector3(path[i].x, 0, path[i].z)
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), track.rotation)
          .add(new THREE.Vector3(...track.position));
        
        const tEnd = new THREE.Vector3(path[i+1].x, 0, path[i+1].z)
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), track.rotation)
          .add(new THREE.Vector3(...track.position));

        // Check if ANY ghost segment is too close to ANY existing track segment
        const collision = ghostWorldSegments.some(g => 
          getMinDistanceSq(g.start, g.end, tStart, tEnd) < COLLISION_THRESHOLD_SQ
        );

        if (collision) return true;
      }
    }
  }
  return false;
};