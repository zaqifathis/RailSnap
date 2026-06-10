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
 * Default branch choice at a junction. For Y switches the lever state in
 * `switches` decides: main line curves left unless set to 'right'.
 * Candidate order follows getTrackPaths (left path first).
 */
const switchPickBranch = (switches) => (options, track) =>
  track.type === 'Y_TRACK' && switches[track.id] === 'right'
    ? options[options.length - 1]
    : options[0];

/**
 * Builds a drivable polyline by walking the connection graph from an open
 * port (or anywhere, for closed loops). At junctions with several paths
 * leaving the entry port (Y switches), pickBranch chooses one; by default
 * the `switches` map (trackId → 'left' | 'right') decides.
 *
 * Returns { points, cumulative, totalLength, isLoop, loopStartDistance }
 * or null when no route exists. Routes can be rho-shaped (a lead-in tail
 * followed by a cycle); loopStartDistance marks where the cycle begins.
 */
export const buildRoute = (tracks, { switches = {}, pickBranch } = {}) => {
  if (!tracks || tracks.length === 0) return null;

  const start = findStart(tracks);
  if (!start) return null;

  const chooseBranch = pickBranch ?? switchPickBranch(switches);
  const byId = new Map(tracks.map((t) => [t.id, t]));
  const points = [];
  const visited = new Set();
  const entryPointIndex = new Map();
  let isLoop = false;
  let loopStartIndex = 0;
  let { track, port } = start;

  for (let i = 0; i < MAX_SEGMENTS; i++) {
    const entryKey = `${track.id}:${port.id}`;
    if (visited.has(entryKey)) {
      isLoop = true;
      loopStartIndex = entryPointIndex.get(entryKey) ?? 0;
      break;
    }
    visited.add(entryKey);
    entryPointIndex.set(entryKey, Math.max(points.length - 1, 0));

    // Paths that begin or end at the entry port.
    const candidates = worldPathsForTrack(track).filter(
      (path) =>
        path[0].distanceTo(port.pos) < JOIN_EPS ||
        path[path.length - 1].distanceTo(port.pos) < JOIN_EPS
    );
    if (candidates.length === 0) break;

    let path = candidates.length > 1 ? chooseBranch(candidates, track) : candidates[0];
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

  return {
    points,
    cumulative,
    totalLength: cumulative[cumulative.length - 1],
    isLoop,
    loopStartDistance: isLoop ? cumulative[loopStartIndex] : 0,
  };
};

/**
 * Samples the route at a distance along it. Open routes clamp at both
 * ends; loops wrap (rho-shaped routes wrap back to the start of the
 * cycle, not the tail). Writes into outPosition/outTangent when given to
 * avoid per-frame allocations.
 */
export const sampleRoute = (route, distance, outPosition, outTangent) => {
  const { points, cumulative, totalLength, isLoop, loopStartDistance = 0 } = route;

  let d = distance;
  if (isLoop) {
    const loopLength = totalLength - loopStartDistance;
    if (loopStartDistance === 0) {
      d = ((d % totalLength) + totalLength) % totalLength;
    } else if (d > totalLength) {
      d = loopStartDistance + ((d - loopStartDistance) % loopLength);
    } else {
      d = Math.max(d, 0);
    }
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

/**
 * Distance along the route closest to a world position. Used to keep the
 * train where it stands when the route is rebuilt (e.g. a switch flips).
 */
export const nearestRouteDistance = (route, position) => {
  const { points, cumulative } = route;
  let bestDistSq = Infinity;
  let bestD = 0;

  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const abx = b.x - a.x;
    const abz = b.z - a.z;
    const lenSq = abx * abx + abz * abz;
    const t =
      lenSq > 0
        ? Math.min(Math.max(((position.x - a.x) * abx + (position.z - a.z) * abz) / lenSq, 0), 1)
        : 0;
    const px = a.x + abx * t;
    const pz = a.z + abz * t;
    const dx = position.x - px;
    const dz = position.z - pz;
    const distSq = dx * dx + dz * dz;
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      bestD = cumulative[i - 1] + Math.sqrt(lenSq) * t;
    }
  }

  return bestD;
};
