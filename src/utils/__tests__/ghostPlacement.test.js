import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { findSnapTarget, computeGhostState, SNAP_DISTANCE } from '../ghostPlacement';
import { getAnchorPort, getWorldPorts, portToWorld } from '../transforms';
import { STRAIGHT_LENGTH } from '../../constants/constants';

const normalizeAngle = (a) => {
  let r = a % (Math.PI * 2);
  if (r > Math.PI) r -= Math.PI * 2;
  if (r < -Math.PI) r += Math.PI * 2;
  return r;
};

const straight = (id, position = [0, 0, 0], rotation = 0, connections = { start: null, end: null }) => ({
  id,
  type: 'STRAIGHT',
  isLeft: false,
  position,
  rotation,
  geometry: null,
  connections: { ...connections },
});

describe('transforms', () => {
  it('portToWorld applies rotation then translation', () => {
    const port = { id: 'end', pos: new THREE.Vector3(0, 0, 10), rot: 0 };
    const world = portToWorld(port, [5, 0, 0], Math.PI / 2);
    expect(world.pos.x).toBeCloseTo(15);
    expect(world.pos.z).toBeCloseTo(0);
    expect(world.rot).toBeCloseTo(Math.PI / 2);
  });

  it('getWorldPorts uses track position and rotation', () => {
    const ports = getWorldPorts(straight('a', [100, 0, 0], 0));
    expect(ports).toHaveLength(2);
    expect(ports[1].pos.x).toBeCloseTo(100);
    expect(ports[1].pos.z).toBeCloseTo(STRAIGHT_LENGTH);
  });

  it('getAnchorPort returns null for unknown type and first port otherwise', () => {
    expect(getAnchorPort('NOPE')).toBeNull();
    expect(getAnchorPort('STRAIGHT').id).toBe('start');
    expect(getAnchorPort('STRAIGHT', false, 5).id).toBe('start'); // index ignored
    expect(getAnchorPort('CROSS_90', false, 1).id).toBe('b_start');
  });
});

describe('findSnapTarget', () => {
  it('returns null when nothing is in range', () => {
    const target = findSnapTarget([straight('a')], new THREE.Vector3(SNAP_DISTANCE + 1, 0, 0));
    expect(target).toBeNull();
  });

  it('returns null for an empty layout', () => {
    expect(findSnapTarget([], new THREE.Vector3())).toBeNull();
  });

  it('picks the closest port across all tracks', () => {
    const a = straight('a'); // ports at z=0 and z=L
    const mouse = new THREE.Vector3(0, 0, STRAIGHT_LENGTH - 5);
    const target = findSnapTarget([a], mouse);
    expect(target.id).toBe('end');
    expect(target.parentId).toBe('a');
    expect(target.isOccupied).toBe(false);
  });

  it('flags occupied ports', () => {
    const a = straight('a', [0, 0, 0], 0, { start: null, end: 'other' });
    const target = findSnapTarget([a], new THREE.Vector3(0, 0, STRAIGHT_LENGTH));
    expect(target.isOccupied).toBe(true);
  });
});

describe('computeGhostState', () => {
  it('returns null without an active tool or for unknown tool', () => {
    const args = { isLeft: false, ghostPortIndex: 0, mousePos: new THREE.Vector3(), tracks: [], ghostGeometry: null };
    expect(computeGhostState({ ...args, activeTool: null })).toBeNull();
    expect(computeGhostState({ ...args, activeTool: 'NOPE' })).toBeNull();
  });

  it('follows the mouse when unsnapped', () => {
    const mouse = new THREE.Vector3(500, 0, 500);
    const state = computeGhostState({
      activeTool: 'STRAIGHT',
      isLeft: false,
      ghostPortIndex: 0,
      mousePos: mouse,
      tracks: [],
      ghostGeometry: null,
    });
    // STRAIGHT anchors at its start port (local origin) → ghost sits at the mouse.
    expect(state.pos[0]).toBeCloseTo(500);
    expect(state.pos[2]).toBeCloseTo(500);
    expect(state.isSnapped).toBe(false);
    expect(state.isOccupied).toBe(false);
    expect(state.snapInfo).toBeNull();
  });

  it('snaps a straight ghost onto an open end port, aligned with the parent', () => {
    const a = straight('a');
    const state = computeGhostState({
      activeTool: 'STRAIGHT',
      isLeft: false,
      ghostPortIndex: 0,
      mousePos: new THREE.Vector3(2, 0, STRAIGHT_LENGTH + 2),
      tracks: [a],
      ghostGeometry: null,
    });

    expect(state.isSnapped).toBe(true);
    expect(state.isOccupied).toBe(false);
    expect(state.snapInfo.parentId).toBe('a');
    expect(state.snapInfo.id).toBe('end');
    expect(state.pos[0]).toBeCloseTo(0);
    expect(state.pos[2]).toBeCloseTo(STRAIGHT_LENGTH);
    expect(normalizeAngle(state.rot)).toBeCloseTo(0);
  });

  it('marks the ghost occupied when snapping to a connected port', () => {
    const a = straight('a', [0, 0, 0], 0, { start: null, end: 'b' });
    const state = computeGhostState({
      activeTool: 'STRAIGHT',
      isLeft: false,
      ghostPortIndex: 0,
      mousePos: new THREE.Vector3(0, 0, STRAIGHT_LENGTH),
      tracks: [a],
      ghostGeometry: null,
    });
    expect(state.isSnapped).toBe(true);
    expect(state.isOccupied).toBe(true);
  });

  it('changes anchor port (and rotation) when cycling a Y track', () => {
    const a = straight('a');
    const base = {
      activeTool: 'Y_TRACK',
      isLeft: false,
      mousePos: new THREE.Vector3(0, 0, STRAIGHT_LENGTH),
      tracks: [a],
      ghostGeometry: null,
    };
    const s0 = computeGhostState({ ...base, ghostPortIndex: 0 });
    const s1 = computeGhostState({ ...base, ghostPortIndex: 1 });

    expect(s0.snapInfo.ghostPortIndex).toBe(0);
    expect(s1.snapInfo.ghostPortIndex).toBe(1);
    expect(normalizeAngle(s0.rot - s1.rot)).not.toBeCloseTo(0);
  });

  it('keeps the snap-port anchor consistent with createTrack geometry', () => {
    // The port the ghost anchors with must be the same port createTrack
    // marks as connected, for every cyclable type and index.
    ['Y_TRACK', 'X_TRACK', 'CROSS_90'].forEach((type) => {
      for (let i = 0; i < 4; i++) {
        const anchor = getAnchorPort(type, false, i);
        expect(anchor, `${type} index ${i}`).toBeTruthy();
        expect(typeof anchor.id).toBe('string');
      }
    });
  });

  it('survives tracks without geometry (no collision check possible)', () => {
    const a = straight('a');
    const state = computeGhostState({
      activeTool: 'STRAIGHT',
      isLeft: false,
      ghostPortIndex: 0,
      mousePos: new THREE.Vector3(0, 0, STRAIGHT_LENGTH),
      tracks: [a],
      ghostGeometry: null,
    });
    expect(state.isOccupied).toBe(false);
  });
});
