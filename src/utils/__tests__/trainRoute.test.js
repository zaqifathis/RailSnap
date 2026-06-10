import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { buildRoute, sampleRoute, nearestRouteDistance } from '../trainRoute';
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

/**
 * Figure-eight: two circles (11 curves + the Y's right branch each),
 * crossed over via the Y left branches. Geometrically exact: every loop
 * is 12 right turns of 30°.
 */
const figureEight = () => {
  const circle = (yId, otherYId, prefix) => {
    const ids = Array.from({ length: 11 }, (_, i) => `${prefix}${i + 1}`);
    const curves = ids.map((id, i) => ({
      id,
      type: 'CURVED',
      isLeft: false,
      connections: {
        start: i === 0 ? yId : ids[i - 1],
        end: i === 10 ? yId : ids[i + 1],
      },
    }));
    const y = {
      id: yId,
      type: 'Y_TRACK',
      isLeft: false,
      connections: { start: ids[10], end_left: otherYId, end_right: ids[0] },
      ...(yId === 'y1' ? { position: [0, 0, 0], rotation: 0 } : {}),
    };
    return [y, ...curves];
  };
  return rehydrateIslands([[...circle('y1', 'y2', 'c'), ...circle('y2', 'y1', 'd')]]);
};

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

  it('routes Y switches by their lever state', () => {
    const y = {
      id: 'y',
      type: 'Y_TRACK',
      isLeft: false,
      position: [0, 0, 0],
      rotation: 0,
      connections: { start: null, end_left: null, end_right: null },
    };
    const left = buildRoute([y]); // default: main line curves left
    const right = buildRoute([y], { switches: { y: 'right' } });

    const endLeft = left.points[left.points.length - 1];
    const endRight = right.points[right.points.length - 1];
    expect(endLeft.x).toBeLessThan(0);
    expect(endRight.x).toBeGreaterThan(0);
  });

  it('keeps the train moving through a figure-eight (never a dead end)', () => {
    const route = buildRoute(figureEight());
    expect(route.isLoop).toBe(true);

    // Default (left) at y1 crosses over into the second circle and keeps
    // cycling it: lead-in tail plus a cycle longer than nothing.
    expect(route.loopStartDistance).toBeGreaterThan(0);
    expect(route.totalLength - route.loopStartDistance).toBeGreaterThan(
      10 * CURVE_RADIUS * CURVE_ANGLE * 0.99
    );
  });

  it('changes the figure-eight route when a switch is flipped', () => {
    const tracks = figureEight();
    const crossing = buildRoute(tracks); // y1 left: cross to circle 2
    const circling = buildRoute(tracks, { switches: { y1: 'right' } }); // stay in circle 1

    expect(circling.isLoop).toBe(true);
    expect(circling.loopStartDistance).toBe(0);
    // Staying in one circle is shorter than crossing over.
    expect(circling.totalLength).toBeLessThan(crossing.totalLength);

    // Circle 1 is exactly 12 arcs of 30°.
    const circumference = 12 * CURVE_RADIUS * CURVE_ANGLE;
    expect(circling.totalLength).toBeGreaterThan(circumference * 0.995);
    expect(circling.totalLength).toBeLessThanOrEqual(circumference + 1e-6);
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

  it('wraps rho-shaped routes back to the cycle start, not the tail', () => {
    // Tail 0..100, cycle 100..300 (synthetic straight-line route).
    const points = [0, 100, 200, 300].map((z) => new THREE.Vector3(0, 0, z));
    const route = {
      points,
      cumulative: [0, 100, 200, 300],
      totalLength: 300,
      isLoop: true,
      loopStartDistance: 100,
    };
    expect(sampleRoute(route, 350).position.z).toBeCloseTo(150);
    expect(sampleRoute(route, 50).position.z).toBeCloseTo(50); // tail still reachable
    expect(sampleRoute(route, -50).position.z).toBeCloseTo(0); // no wrap below the start
  });
});

describe('nearestRouteDistance', () => {
  it('finds the distance of the closest point on the route', () => {
    const route = buildRoute([straight('a')]);
    const d = nearestRouteDistance(route, new THREE.Vector3(7, 0, 60));
    expect(d).toBeCloseTo(60);
  });

  it('clamps to the route ends', () => {
    const route = buildRoute([straight('a')]);
    expect(nearestRouteDistance(route, new THREE.Vector3(0, 0, -50))).toBeCloseTo(0);
    expect(
      nearestRouteDistance(route, new THREE.Vector3(0, 0, STRAIGHT_LENGTH + 50))
    ).toBeCloseTo(STRAIGHT_LENGTH);
  });

  it('round-trips with sampleRoute on a curve', () => {
    const route = buildRoute(circleOfCurves());
    const target = route.totalLength * 0.37;
    const { position } = sampleRoute(route, target);
    expect(nearestRouteDistance(route, position)).toBeCloseTo(target, 1);
  });
});
