import { describe, it, expect } from 'vitest';
import { buildRoute, sampleRoute } from '../trainRoute';
import { rehydrateIslands } from '../trackGraph';
import { STRAIGHT_LENGTH, CURVE_RADIUS, CURVE_ANGLE } from '../../constants/constants';

const straight = (id, position = [0, 0, 0], rotation = 0, connections = { start: null, end: null }) => ({
  id,
  type: 'STRAIGHT',
  isLeft: false,
  position,
  rotation,
  connections: { ...connections },
});

const circleOfCurves = () => {
  const ids = Array.from({ length: 12 }, (_, i) => `c${i}`);
  const island = ids.map((id, i) => ({
    id,
    type: 'CURVED',
    isLeft: false,
    connections: { start: ids[(i + 11) % 12], end: ids[(i + 1) % 12] },
    ...(i === 0 ? { position: [0, 0, 0], rotation: 0 } : {}),
  }));
  return rehydrateIslands([island]);
};

describe('buildRoute', () => {
  it('returns null for empty or missing tracks', () => {
    expect(buildRoute([])).toBeNull();
    expect(buildRoute(null)).toBeNull();
  });

  it('builds a single straight track route', () => {
    const route = buildRoute([straight('a')]);
    expect(route.isLoop).toBe(false);
    expect(route.totalLength).toBeCloseTo(STRAIGHT_LENGTH);
  });

  it('chains connected tracks', () => {
    const a = straight('a', [0, 0, 0], 0, { start: null, end: 'b' });
    const b = straight('b', [0, 0, STRAIGHT_LENGTH], 0, { start: 'a', end: null });
    const route = buildRoute([a, b]);
    expect(route.isLoop).toBe(false);
    expect(route.totalLength).toBeCloseTo(2 * STRAIGHT_LENGTH);
  });

  it('stops at dangling connections instead of crashing', () => {
    const a = straight('a', [0, 0, 0], 0, { start: null, end: 'ghost' });
    const route = buildRoute([a]);
    expect(route.totalLength).toBeCloseTo(STRAIGHT_LENGTH);
  });

  it('detects a closed loop and matches the circle circumference', () => {
    const route = buildRoute(circleOfCurves());
    expect(route.isLoop).toBe(true);
    // 12 arcs of 30° = full circle; polyline slightly under 2πR.
    const circumference = 12 * CURVE_RADIUS * CURVE_ANGLE;
    expect(route.totalLength).toBeGreaterThan(circumference * 0.995);
    expect(route.totalLength).toBeLessThanOrEqual(circumference + 1e-6);
  });

  it('lets pickBranch choose the Y switch branch', () => {
    const y = {
      id: 'y',
      type: 'Y_TRACK',
      isLeft: false,
      position: [0, 0, 0],
      rotation: 0,
      connections: { start: null, end_left: null, end_right: null },
    };
    const first = buildRoute([y]);
    const second = buildRoute([y], { pickBranch: (options) => options[options.length - 1] });
    const endA = first.points[first.points.length - 1];
    const endB = second.points[second.points.length - 1];
    expect(endA.distanceTo(endB)).toBeGreaterThan(1);
  });
});

describe('sampleRoute', () => {
  it('clamps open routes at both ends', () => {
    const route = buildRoute([straight('a')]);
    const startSample = sampleRoute(route, -50);
    const endSample = sampleRoute(route, route.totalLength + 50);
    expect(startSample.position.z).toBeCloseTo(0);
    expect(endSample.position.z).toBeCloseTo(STRAIGHT_LENGTH);
  });

  it('interpolates positions and unit tangents', () => {
    const route = buildRoute([straight('a')]);
    const { position, tangent } = sampleRoute(route, STRAIGHT_LENGTH / 2);
    expect(position.z).toBeCloseTo(STRAIGHT_LENGTH / 2);
    expect(tangent.length()).toBeCloseTo(1);
    expect(tangent.z).toBeCloseTo(1);
  });

  it('wraps distances around closed loops, both directions', () => {
    const route = buildRoute(circleOfCurves());
    const a = sampleRoute(route, 10);
    const b = sampleRoute(route, route.totalLength + 10);
    const c = sampleRoute(route, -route.totalLength + 10);
    expect(a.position.distanceTo(b.position)).toBeLessThan(1e-6);
    expect(a.position.distanceTo(c.position)).toBeLessThan(1e-6);
  });

  it('writes into provided output vectors without allocating', () => {
    const route = buildRoute([straight('a')]);
    const outPos = route.points[0].clone();
    const outTan = route.points[0].clone();
    const result = sampleRoute(route, 10, outPos, outTan);
    expect(result.position).toBe(outPos);
    expect(result.tangent).toBe(outTan);
  });
});
