import { getTrackPaths } from '../constants/trackPaths';
import { getWorldPorts, UP } from './transforms';

/** Two points closer than this (mm) count as the same junction. */
const JOIN_EPS = 1;
/** Safety cap so corrupted graphs can never spin forever. */
const MAX_SEGMENTS = 1000;

const toWorldPoints = (track, path) =>
  path.map((p) =>
    p
      .clone()
      .applyAxisAngle(UP, track.rotation)
      .add({ x: track.position[0], y: track.position[1], z: track.position[2] })
  );

const worldPathsForTrack = (track) =>
  getTrackPaths(track.type, track.isLeft).map((path) => toWorldPoints(track, path));

const nearest = (items, pos, getPos) => {
  let best = null;
  let bestDist = JOIN_EPS;
  items.forEach((item) => {
    const dist = getPos(item).distanceTo(pos);
    if (dist < bestDist) {
      best = item;
      bestDist = dist;
    }
  });
  return best;
};

const findStart = (tracks) => {
  for (const track of tracks) {
    const openPortId = Object.entries(track.connections || {}).find(([, v]) => v === null)?.[0];
    if (openPortId) {
      const port = getWorldPorts(track).find((p) => p.id === openPortId);
      if (port) return { track, port };
    }
  }
  // Closed loop: start anywhere.
  const track = tracks[0];
  const port = getWorldPorts(track)[0];
  return port ? { track, port } : null;
};

/**
 * Builds a drivable polyline by walking the connection graph from an open
 * port (or anywhere, for closed loops). At junctions with several paths
 * leaving the entry port (Y switches), pickBranch chooses one.
 *
 * Returns { points, cumulative, totalLength, isLoop } or null when no
 * route exists.
 */
export const buildRoute = (tracks, { pickBranch = (options) => options[0] } = {}) => {
  if (!tracks || tracks.length === 0) return null;

  const start = findStart(tracks);
  if (!start) return null;

  const byId = new Map(tracks.map((t) => [t.id, t]));
  const points = [];
  const visited = new Set();
  let isLoop = false;
  let { track, port } = start;

  for (let i = 0; i < MAX_SEGMENTS; i++) {
    const entryKey = `${track.id}:${port.id}`;
    if (visited.has(entryKey)) {
      isLoop = true;
      break;
    }
    visited.add(entryKey);

    // Paths that begin or end at the entry port.
    const candidates = worldPathsForTrack(track).filter(
      (path) =>
        path[0].distanceTo(port.pos) < JOIN_EPS ||
        path[path.length - 1].distanceTo(port.pos) < JOIN_EPS
    );
    if (candidates.length === 0) break;

    let path = candidates.length > 1 ? pickBranch(candidates) : candidates[0];
    if (path[0].distanceTo(port.pos) >= JOIN_EPS) path = [...path].reverse();

    points.push(...(points.length > 0 ? path.slice(1) : path));

    // Leave through the port sitting at the path's far end.
    const exitPos = path[path.length - 1];
    const exitPort = nearest(getWorldPorts(track), exitPos, (p) => p.pos);
    if (!exitPort) break;

    const nextTrack = byId.get(track.connections?.[exitPort.id]);
    if (!nextTrack) break;

    const nextPort = nearest(getWorldPorts(nextTrack), exitPort.pos, (p) => p.pos);
    if (!nextPort) break;

    track = nextTrack;
    port = nextPort;
  }

  if (points.length < 2) return null;

  const cumulative = [0];
  for (let i = 1; i < points.length; i++) {
    cumulative.push(cumulative[i - 1] + points[i].distanceTo(points[i - 1]));
  }

  return { points, cumulative, totalLength: cumulative[cumulative.length - 1], isLoop };
};

/**
 * Samples the route at a distance along it. Open routes clamp at both
 * ends; loops wrap. Writes into outPosition/outTangent when given to
 * avoid per-frame allocations.
 */
export const sampleRoute = (route, distance, outPosition, outTangent) => {
  const { points, cumulative, totalLength, isLoop } = route;

  let d = distance;
  if (isLoop) {
    d = ((d % totalLength) + totalLength) % totalLength;
  } else {
    d = Math.min(Math.max(d, 0), totalLength);
  }

  // Binary search for the segment containing d.
  let lo = 0;
  let hi = cumulative.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (cumulative[mid] <= d) lo = mid;
    else hi = mid;
  }

  const a = points[lo];
  const b = points[hi];
  const segLen = cumulative[hi] - cumulative[lo];
  const t = segLen > 0 ? (d - cumulative[lo]) / segLen : 0;

  const position = (outPosition ?? a.clone()).copy(a).lerp(b, t);
  const tangent = (outTangent ?? b.clone()).copy(b).sub(a).normalize();
  return { position, tangent };
};
