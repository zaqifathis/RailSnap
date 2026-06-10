import { getPortsTrack } from '../constants/trackPaths';
import { getAnchorPort, getWorldPorts, portToWorld, UP } from './transforms';
import { checkTrackCollision } from './trackIntersection';
import { TRACK_WIDTH } from '../constants/constants';

/** Max distance (mm) from cursor to a port before the ghost snaps to it. */
export const SNAP_DISTANCE = 30;
/**
 * Magnetic join tolerance: like the real toy, two pieces misaligned by up
 * to half a track width still pull together when pushed near each other.
 */
export const JOIN_DISTANCE = TRACK_WIDTH / 2;
/** Ports closer than this (mm) count as connected, not colliding. */
export const CONNECT_DISTANCE = 1;

/** Finds the closest track port within maxDistance of the cursor, or null. */
export const findSnapTarget = (tracks, mousePos, maxDistance = SNAP_DISTANCE) => {
  let best = null;
  let bestDist = maxDistance;

  tracks.forEach((track) => {
    getWorldPorts(track).forEach((port) => {
      const dist = mousePos.distanceTo(port.pos);
      if (dist < bestDist) {
        bestDist = dist;
        best = { ...port, parentId: track.id, isOccupied: track.connections?.[port.id] != null };
      }
    });
  });

  return best;
};

/**
 * Finds the closest (ghost port, track port) pair within JOIN_DISTANCE.
 * This is the "physics" join: any port of the ghost that gets pushed close
 * enough to an existing port grabs it, even if the cursor itself is far
 * from that port.
 */
const findMagneticJoin = (tracks, ghostPorts) => {
  let best = null;
  let bestDist = JOIN_DISTANCE;

  tracks.forEach((track) => {
    getWorldPorts(track).forEach((trackPort) => {
      ghostPorts.forEach((ghostPort, index) => {
        const dist = ghostPort.pos.distanceTo(trackPort.pos);
        if (dist < bestDist) {
          bestDist = dist;
          best = {
            target: {
              ...trackPort,
              parentId: track.id,
              isOccupied: track.connections?.[trackPort.id] != null,
            },
            ghostPortIndex: index,
          };
        }
      });
    });
  });

  return best;
};

/**
 * All (ghost port ↔ track port) pairs that coincide at the ghost's pose.
 * Closing a loop touches more than one track, so every pair matters for
 * the connection graph, not just the snapped one.
 */
export const findPortAlignments = (tracks, ghostPorts) => {
  const alignments = [];
  tracks.forEach((track) => {
    getWorldPorts(track).forEach((trackPort) => {
      ghostPorts.forEach((ghostPort) => {
        if (ghostPort.pos.distanceTo(trackPort.pos) < CONNECT_DISTANCE) {
          alignments.push({
            ghostPortId: ghostPort.id,
            parentId: track.id,
            parentPortId: trackPort.id,
            isOccupied: track.connections?.[trackPort.id] != null,
          });
        }
      });
    });
  });
  return alignments;
};

/** Pose that aligns localPort exactly onto targetPort, facing into it. */
const poseFromPortPair = (localPort, targetPort) => {
  const rotation = targetPort.rot - (localPort.rot + Math.PI);
  const position = targetPort.pos
    .clone()
    .sub(localPort.pos.clone().applyAxisAngle(UP, rotation));
  return { position, rotation };
};

/**
 * Computes the ghost track's placement: position, rotation, snap state,
 * port alignments for the connection graph, and whether placement is
 * blocked (occupied port or geometry collision).
 */
export const computeGhostState = ({
  activeTool,
  isLeft,
  ghostPortIndex,
  mousePos,
  tracks,
  ghostGeometry,
}) => {
  if (!activeTool) return null;

  const anchorPort = getAnchorPort(activeTool, isLeft, ghostPortIndex);
  if (!anchorPort) return null;

  // Rotate 180° so the ghost "looks into" the port it snaps onto.
  const anchorRot = anchorPort.rot + Math.PI;
  const localPorts = getPortsTrack(activeTool, isLeft);
  const snapTarget = findSnapTarget(tracks, mousePos);

  let rotation;
  let position;
  let joined = Boolean(snapTarget);

  if (snapTarget) {
    ({ position, rotation } = poseFromPortPair(anchorPort, snapTarget));
  } else {
    rotation = -anchorRot;
    position = mousePos.clone().sub(anchorPort.pos.clone().applyAxisAngle(UP, rotation));

    // No port under the cursor: check whether any ghost port got pushed
    // within half a track width of an open port and pull the piece in.
    const freePorts = localPorts.map((p) => portToWorld(p, position, rotation));
    const join = findMagneticJoin(tracks, freePorts);
    if (join) {
      ({ position, rotation } = poseFromPortPair(localPorts[join.ghostPortIndex], join.target));
      joined = true;
    }
  }

  const ghostPorts = localPorts.map((p) => portToWorld(p, position, rotation));
  const alignments = joined ? findPortAlignments(tracks, ghostPorts) : [];
  const connectedTrackIds = alignments.map((a) => a.parentId);

  const isIntersecting = ghostGeometry
    ? checkTrackCollision({ position, rotation, geometry: ghostGeometry }, tracks, connectedTrackIds)
    : false;

  return {
    pos: [position.x, 0, position.z],
    rot: rotation,
    isSnapped: joined,
    isOccupied: alignments.some((a) => a.isOccupied) || isIntersecting,
    alignments,
  };
};
