import { getPortsTrack } from '../constants/trackPaths';
import { portToWorld, UP } from './transforms';

const connectedIds = (track) => Object.values(track.connections || {}).filter(Boolean);
const hasOpenPort = (track) => Object.values(track.connections || {}).some((v) => v === null);

/**
 * Creates a track object with its connections initialized.
 * Each alignment ({ ghostPortId, parentId, parentPortId }) links one of the
 * new track's ports to the neighbouring track it touches — a piece that
 * closes a loop touches several neighbours at once.
 */
export const createTrack = ({
  id,
  type,
  position,
  rotation = 0,
  isLeft = false,
  alignments = [],
  geometry = null,
}) => {
  const connections = {};
  getPortsTrack(type, isLeft).forEach((port) => {
    connections[port.id] = null;
  });

  alignments.forEach((a) => {
    if (a.ghostPortId in connections) connections[a.ghostPortId] = a.parentId;
  });

  return { id, type, isLeft, position, rotation, geometry, connections };
};

/** Appends a track and links every touched parent port back to it. */
export const addTrackToLayout = (tracks, newTrack, alignments = []) => {
  if (alignments.length === 0) return [...tracks, newTrack];

  const byParent = new Map();
  alignments.forEach((a) => {
    if (!byParent.has(a.parentId)) byParent.set(a.parentId, []);
    byParent.get(a.parentId).push(a);
  });

  const updated = tracks.map((t) => {
    const touched = byParent.get(t.id);
    if (!touched) return t;
    const connections = { ...(t.connections || {}) };
    touched.forEach((a) => {
      connections[a.parentPortId] = newTrack.id;
    });
    return { ...t, connections };
  });
  return [...updated, newTrack];
};

/** Removes a track and nulls out any connections pointing at it. */
export const removeTrackFromLayout = (tracks, trackId) =>
  tracks
    .filter((t) => t.id !== trackId)
    .map((t) => {
      if (!t.connections || !Object.values(t.connections).includes(trackId)) return t;
      const connections = { ...t.connections };
      Object.keys(connections).forEach((key) => {
        if (connections[key] === trackId) connections[key] = null;
      });
      return { ...t, connections };
    });

const serializeTrack = ({ id, type, isLeft, connections }) => ({ id, type, isLeft, connections });

// Prefer a simple track with an open port as island root: its saved
// position/rotation seed the rehydration crawl.
const ROOT_PRIORITY = ['STRAIGHT', 'CURVED'];

/**
 * Splits tracks into connected islands and serializes them for storage.
 * Only each island's root keeps position/rotation; the rest are
 * reconstructed from the connection graph on load.
 */
export const serializeIslands = (tracks) => {
  const remaining = [...tracks];
  const islands = [];

  while (remaining.length > 0) {
    let rootIndex = remaining.findIndex((t) => ROOT_PRIORITY.includes(t.type) && hasOpenPort(t));
    if (rootIndex === -1) rootIndex = remaining.findIndex(hasOpenPort);
    if (rootIndex === -1) rootIndex = 0; // closed loop: any track works as root

    const root = remaining.splice(rootIndex, 1)[0];
    const island = [{ ...serializeTrack(root), position: root.position, rotation: root.rotation }];
    const visited = new Set([root.id]);
    const queue = connectedIds(root);

    while (queue.length > 0) {
      const id = queue.shift();
      if (visited.has(id)) continue;
      visited.add(id);

      const idx = remaining.findIndex((t) => t.id === id);
      if (idx === -1) continue;

      const track = remaining.splice(idx, 1)[0];
      island.push(serializeTrack(track));
      queue.push(...connectedIds(track).filter((nid) => !visited.has(nid)));
    }

    islands.push(island);
  }

  return islands;
};

/**
 * Rebuilds track positions/rotations from serialized islands by walking
 * the connection graph from each island's root. Tracks whose connection
 * data is broken (missing or without a back-reference) are dropped.
 */
export const rehydrateIslands = (islands) => {
  if (!Array.isArray(islands)) {
    throw new Error('Invalid layout file: expected an array of islands');
  }

  const rehydrated = [];

  islands.forEach((island) => {
    if (!Array.isArray(island) || island.length === 0) return;

    const byId = new Map(island.map((t) => [t.id, t]));
    const root = {
      ...island[0],
      position: island[0].position ?? [0, 0, 0],
      rotation: island[0].rotation ?? 0,
    };
    // Unknown track type (corrupt or newer file): skip the whole island,
    // its geometry cannot be reconstructed.
    if (getPortsTrack(root.type, root.isLeft).length === 0) return;
    rehydrated.push(root);

    const placed = new Set([root.id]);
    const queue = [root];

    while (queue.length > 0) {
      const parent = queue.shift();

      getPortsTrack(parent.type, parent.isLeft).forEach((parentPort) => {
        const childId = parent.connections?.[parentPort.id];
        if (!childId || placed.has(childId)) return;

        const childData = byId.get(childId);
        if (!childData) return;

        const childPorts = getPortsTrack(childData.type, childData.isLeft);
        const childPort = childPorts.find((cp) => childData.connections?.[cp.id] === parent.id);
        if (!childPort) return;

        // Child faces into the parent port: rotate its port 180° onto it.
        const worldPort = portToWorld(parentPort, parent.position, parent.rotation);
        const rotation = worldPort.rot - (childPort.rot + Math.PI);
        const offset = childPort.pos.clone().applyAxisAngle(UP, rotation);
        const pos = worldPort.pos.clone().sub(offset);

        const child = { ...childData, position: [pos.x, 0, pos.z], rotation };
        rehydrated.push(child);
        placed.add(child.id);
        queue.push(child);
      });
    }
  });

  return rehydrated;
};

export const LAYOUT_FORMAT = 'railsnap-layout';
export const LAYOUT_VERSION = 1;

/** Wraps the serialized islands in a versioned envelope for saving. */
export const serializeLayout = (tracks) => ({
  format: LAYOUT_FORMAT,
  version: LAYOUT_VERSION,
  savedAt: new Date().toISOString(),
  islands: serializeIslands(tracks),
});

/** Loads a layout file: versioned envelope or a legacy bare islands array. */
export const rehydrateLayout = (data) => {
  const islands = Array.isArray(data) ? data : data?.islands;
  if (!Array.isArray(islands)) {
    throw new Error('Invalid layout file: expected islands array');
  }
  return rehydrateIslands(islands);
};
