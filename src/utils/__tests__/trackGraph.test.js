import { describe, it, expect } from 'vitest';
import {
  createTrack,
  addTrackToLayout,
  removeTrackFromLayout,
  serializeIslands,
  rehydrateIslands,
} from '../trackGraph';
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

describe('createTrack', () => {
  it('initializes all ports to null when unsnapped', () => {
    const t = createTrack({ id: 't1', type: 'X_TRACK', position: [0, 0, 0] });
    expect(t.connections).toEqual({ a_start: null, b_start: null, a_end: null, b_end: null });
  });

  it('connects the anchor port to the parent when snapped', () => {
    const t = createTrack({
      id: 't1',
      type: 'STRAIGHT',
      position: [0, 0, 0],
      snapInfo: { parentId: 'p1', id: 'end', ghostPortIndex: 0 },
    });
    expect(t.connections.start).toBe('p1');
    expect(t.connections.end).toBeNull();
  });

  it('cycles the Y track anchor port with ghostPortIndex', () => {
    const make = (i) =>
      createTrack({
        id: 't1',
        type: 'Y_TRACK',
        position: [0, 0, 0],
        snapInfo: { parentId: 'p1', id: 'end', ghostPortIndex: i },
      });
    expect(make(0).connections.start).toBe('p1');
    expect(make(1).connections.end_left).toBe('p1');
    expect(make(2).connections.end_right).toBe('p1');
    expect(make(3).connections.start).toBe('p1'); // wraps around
  });

  it('cycles only the two entry ports for crossings', () => {
    const make = (type, i) =>
      createTrack({
        id: 't1',
        type,
        position: [0, 0, 0],
        snapInfo: { parentId: 'p1', id: 'end', ghostPortIndex: i },
      });
    expect(make('X_TRACK', 0).connections.a_start).toBe('p1');
    expect(make('X_TRACK', 1).connections.b_start).toBe('p1');
    expect(make('CROSS_90', 2).connections.a_start).toBe('p1'); // wraps around
  });
});

describe('addTrackToLayout', () => {
  it('links the parent port back to the new track', () => {
    const parent = straight('p1');
    const child = createTrack({
      id: 'c1',
      type: 'STRAIGHT',
      position: [0, 0, STRAIGHT_LENGTH],
      snapInfo: { parentId: 'p1', id: 'end', ghostPortIndex: 0 },
    });
    const layout = addTrackToLayout([parent], child, { parentId: 'p1', id: 'end' });

    expect(layout).toHaveLength(2);
    expect(layout[0].connections.end).toBe('c1');
    expect(parent.connections.end).toBeNull(); // input not mutated
  });

  it('appends without touching others when unsnapped', () => {
    const existing = straight('p1');
    const layout = addTrackToLayout([existing], straight('t2'));
    expect(layout).toHaveLength(2);
    expect(layout[0]).toBe(existing);
  });
});

describe('removeTrackFromLayout', () => {
  it('removes the track and nulls connections pointing at it', () => {
    const a = straight('a', [0, 0, 0], 0, { start: null, end: 'b' });
    const b = straight('b', [0, 0, STRAIGHT_LENGTH], 0, { start: 'a', end: null });
    const result = removeTrackFromLayout([a, b], 'b');

    expect(result).toHaveLength(1);
    expect(result[0].connections.end).toBeNull();
  });

  it('handles unknown ids and empty layouts', () => {
    const a = straight('a');
    expect(removeTrackFromLayout([a], 'nope')).toEqual([a]);
    expect(removeTrackFromLayout([], 'a')).toEqual([]);
  });

  it('handles tracks without a connections object', () => {
    const odd = { id: 'x', type: 'STRAIGHT', position: [0, 0, 0], rotation: 0 };
    expect(removeTrackFromLayout([odd], 'other')).toEqual([odd]);
  });
});

describe('serializeIslands', () => {
  it('returns empty array for no tracks', () => {
    expect(serializeIslands([])).toEqual([]);
  });

  it('keeps position/rotation only on the island root and drops geometry', () => {
    const a = straight('a', [0, 0, 0], 0, { start: null, end: 'b' });
    const b = straight('b', [0, 0, STRAIGHT_LENGTH], 0, { start: 'a', end: null });
    b.geometry = { fake: true };

    const islands = serializeIslands([a, b]);
    expect(islands).toHaveLength(1);
    expect(islands[0]).toHaveLength(2);
    expect(islands[0][0].position).toEqual([0, 0, 0]);
    expect(islands[0][1].position).toBeUndefined();
    islands[0].forEach((t) => expect(t.geometry).toBeUndefined());
  });

  it('splits disconnected tracks into separate islands', () => {
    const a = straight('a');
    const b = straight('b', [500, 0, 0]);
    const islands = serializeIslands([a, b]);
    expect(islands).toHaveLength(2);
  });

  it('prefers a straight/curved track with an open port as root', () => {
    const y = {
      ...straight('y'),
      type: 'Y_TRACK',
      connections: { start: 's', end_left: null, end_right: null },
    };
    const s = straight('s', [0, 0, 0], 0, { start: null, end: 'y' });
    const islands = serializeIslands([y, s]);
    expect(islands[0][0].id).toBe('s');
  });

  it('handles a closed loop with no open ports', () => {
    const a = straight('a', [0, 0, 0], 0, { start: 'b', end: 'b' });
    const b = straight('b', [0, 0, STRAIGHT_LENGTH], 0, { start: 'a', end: 'a' });
    const islands = serializeIslands([a, b]);
    expect(islands).toHaveLength(1);
    expect(islands[0]).toHaveLength(2);
  });

  it('ignores dangling connection ids', () => {
    const a = straight('a', [0, 0, 0], 0, { start: null, end: 'ghost-id' });
    const islands = serializeIslands([a]);
    expect(islands).toHaveLength(1);
    expect(islands[0]).toHaveLength(1);
  });

  it('does not mutate the input tracks', () => {
    const a = straight('a', [0, 0, 0], 0, { start: null, end: 'b' });
    const b = straight('b', [0, 0, STRAIGHT_LENGTH], 0, { start: 'a', end: null });
    const input = [a, b];
    serializeIslands(input);
    expect(input).toHaveLength(2);
    expect(a.connections.end).toBe('b');
  });
});

describe('rehydrateIslands', () => {
  it('throws on malformed input', () => {
    expect(() => rehydrateIslands({})).toThrow();
    expect(() => rehydrateIslands('nope')).toThrow();
  });

  it('skips empty or invalid islands', () => {
    expect(rehydrateIslands([[], null, 'bad'])).toEqual([]);
  });

  it('defaults a root without position/rotation to the origin', () => {
    const [root] = rehydrateIslands([[{ id: 'a', type: 'STRAIGHT', connections: {} }]]);
    expect(root.position).toEqual([0, 0, 0]);
    expect(root.rotation).toBe(0);
  });

  it('round-trips a chain of straight tracks', () => {
    const a = straight('a', [0, 0, 0], 0, { start: null, end: 'b' });
    const b = straight('b', [0, 0, STRAIGHT_LENGTH], 0, { start: 'a', end: null });

    const loaded = rehydrateIslands(serializeIslands([a, b]));
    expect(loaded).toHaveLength(2);

    const lb = loaded.find((t) => t.id === 'b');
    expect(lb.position[0]).toBeCloseTo(0);
    expect(lb.position[2]).toBeCloseTo(STRAIGHT_LENGTH);
    expect(normalizeAngle(lb.rotation)).toBeCloseTo(0);
  });

  it('round-trips a rotated root with a curved child', () => {
    const rootRot = Math.PI / 4;
    const a = straight('a', [10, 0, -20], rootRot, { start: null, end: 'c' });
    const c = {
      id: 'c',
      type: 'CURVED',
      isLeft: true,
      position: [0, 0, 0], // wrong on purpose: rehydrate must recompute it
      rotation: 0,
      connections: { start: 'a', end: null },
    };

    const loaded = rehydrateIslands(serializeIslands([a, c]));
    const lc = loaded.find((t) => t.id === 'c');

    // Child sits at parent's end port: [10,0,-20] + rot(y, π/4) · [0,0,L]
    expect(lc.position[0]).toBeCloseTo(10 + Math.sin(rootRot) * STRAIGHT_LENGTH);
    expect(lc.position[2]).toBeCloseTo(-20 + Math.cos(rootRot) * STRAIGHT_LENGTH);
    expect(normalizeAngle(lc.rotation)).toBeCloseTo(rootRot);
    expect(lc.isLeft).toBe(true);
  });

  it('drops children whose connection has no back-reference', () => {
    const islands = [
      [
        { id: 'a', type: 'STRAIGHT', connections: { start: null, end: 'b' }, position: [0, 0, 0], rotation: 0 },
        { id: 'b', type: 'STRAIGHT', connections: { start: null, end: null } }, // no link back to 'a'
      ],
    ];
    const loaded = rehydrateIslands(islands);
    expect(loaded.map((t) => t.id)).toEqual(['a']);
  });

  it('ignores connections to ids missing from the island', () => {
    const islands = [
      [
        { id: 'a', type: 'STRAIGHT', connections: { start: null, end: 'missing' }, position: [0, 0, 0], rotation: 0 },
      ],
    ];
    expect(rehydrateIslands(islands)).toHaveLength(1);
  });

  it('round-trips a closed loop of 12 curves', () => {
    // Build a full circle by chaining 12 right curves (30° each) via rehydrate
    // math itself, then close the loop and round-trip it.
    const ids = Array.from({ length: 12 }, (_, i) => `c${i}`);
    const island = ids.map((id, i) => ({
      id,
      type: 'CURVED',
      isLeft: false,
      connections: { start: ids[(i + 11) % 12], end: ids[(i + 1) % 12] },
      ...(i === 0 ? { position: [0, 0, 0], rotation: 0 } : {}),
    }));

    const placed = rehydrateIslands([island]);
    expect(placed).toHaveLength(12);

    const again = rehydrateIslands(serializeIslands(placed));
    expect(again).toHaveLength(12);

    again.forEach((t) => {
      const orig = placed.find((p) => p.id === t.id);
      expect(t.position[0]).toBeCloseTo(orig.position[0], 4);
      expect(t.position[2]).toBeCloseTo(orig.position[2], 4);
      expect(normalizeAngle(t.rotation - orig.rotation)).toBeCloseTo(0, 4);
    });
  });
});
