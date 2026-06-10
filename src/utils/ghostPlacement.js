import { getPortsTrack } from '../constants/trackPaths';
import { getAnchorPort, getWorldPorts, portToWorld, UP } from './transforms';
import { checkTrackCollision } from './trackIntersection';

/** Max distance (mm) from cursor to a port before the ghost snaps to it. */
export const SNAP_DISTANCE = 30;
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

/** Ids of tracks that have a port aligned with one of the ghost's ports. */
const findAlignedTrackIds = (tracks, ghostPorts) =>
  tracks
    .filter((track) =>
      getWorldPorts(track).some((tp) =>
        ghostPorts.some((gp) => gp.pos.distanceTo(tp.pos) < CONNECT_DISTANCE)
      )
    )
    .map((track) => track.id);

/**
 * Computes the ghost track's placement: position, rotation, snap state and
 * whether placement is blocked (occupied port or geometry collision).
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
  const snapTarget = findSnapTarget(tracks, mousePos);

  let rotation;
  let position;
  if (snapTarget) {
    rotation = snapTarget.rot - anchorRot;
    position = snapTarget.pos.clone().sub(anchorPort.pos.clone().applyAxisAngle(UP, rotation));
  } else {
    rotation = -anchorRot;
    position = mousePos.clone().sub(anchorPort.pos.clone().applyAxisAngle(UP, rotation));
  }

  const ghostPorts = getPortsTrack(activeTool, isLeft).map((p) =>
    portToWorld(p, position, rotation)
  );
  const connectedTrackIds = findAlignedTrackIds(tracks, ghostPorts);

  const isIntersecting = ghostGeometry
    ? checkTrackCollision({ position, rotation, geometry: ghostGeometry }, tracks, connectedTrackIds)
    : false;

  return {
    pos: [position.x, 0, position.z],
    rot: rotation,
    isSnapped: Boolean(snapTarget),
    isOccupied: Boolean(snapTarget?.isOccupied) || isIntersecting,
    snapInfo: snapTarget ? { ...snapTarget, ghostPortIndex } : null,
  };
};
