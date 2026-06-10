import { describe, it, expect } from 'vitest';
import { getTrackPaths, getPortsTrack } from '../../constants/trackPaths';
import { STRAIGHT_LENGTH } from '../../constants/constants';

const TYPES = ['STRAIGHT', 'CURVED', 'Y_TRACK', 'X_TRACK', 'CROSS_90'];

describe('getTrackPaths', () => {
  it('returns empty array for unknown type', () => {
    expect(getTrackPaths('NOPE')).toEqual([]);
    expect(getTrackPaths(undefined)).toEqual([]);
    expect(getTrackPaths(null)).toEqual([]);
  });

  it('straight path spans the full track length', () => {
    const [path] = getTrackPaths('STRAIGHT');
    expect(path[0].length()).toBeCloseTo(0);
    expect(path[path.length - 1].z).toBeCloseTo(STRAIGHT_LENGTH);
  });

  it('curved left mirrors curved right across the x axis', () => {
    const [right] = getTrackPaths('CURVED', false);
    const [left] = getTrackPaths('CURVED', true);
    expect(left.length).toBe(right.length);
    right.forEach((p, i) => {
      expect(left[i].x).toBeCloseTo(-p.x);
      expect(left[i].z).toBeCloseTo(p.z);
    });
  });
});

describe('getPortsTrack', () => {
  it('returns expected port counts and unique ids', () => {
    const expected = { STRAIGHT: 2, CURVED: 2, Y_TRACK: 3, X_TRACK: 4, CROSS_90: 4 };
    TYPES.forEach((type) => {
      const ports = getPortsTrack(type);
      expect(ports.length).toBe(expected[type]);
      expect(new Set(ports.map((p) => p.id)).size).toBe(ports.length);
    });
  });

  it('returns no ports for unknown type', () => {
    expect(getPortsTrack('NOPE')).toEqual([]);
  });

  it('every port lies on a path endpoint (geometry consistency)', () => {
    const variants = [
      ['STRAIGHT', false],
      ['CURVED', false],
      ['CURVED', true],
      ['Y_TRACK', false],
      ['X_TRACK', false],
      ['CROSS_90', false],
    ];

    variants.forEach(([type, isLeft]) => {
      const paths = getTrackPaths(type, isLeft);
      const endpoints = paths.flatMap((path) => [path[0], path[path.length - 1]]);

      getPortsTrack(type, isLeft).forEach((port) => {
        const onEndpoint = endpoints.some((p) => p.distanceTo(port.pos) < 1e-6);
        expect(onEndpoint, `${type} (isLeft=${isLeft}) port ${port.id}`).toBe(true);
      });
    });
  });
});
