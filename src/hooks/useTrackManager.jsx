import { useState, useCallback } from 'react';
import { generateUUID } from 'three/src/math/MathUtils.js';
import { createTrack, addTrackToLayout, removeTrackFromLayout } from '../utils/trackGraph';

export const useTrackManager = (initialTracks = []) => {
  const [tracks, setTracks] = useState(initialTracks);

  const updateTrackGeometry = useCallback((trackId, geometry) => {
    setTracks((prev) => {
      const index = prev.findIndex((t) => t.id === trackId);
      // Bail out when nothing changes, otherwise the geometry-ready
      // callback in Track retriggers this on every render (infinite loop).
      if (index === -1 || prev[index].geometry === geometry) return prev;
      const next = [...prev];
      next[index] = { ...next[index], geometry };
      return next;
    });
  }, []);

  const deleteTrack = useCallback((trackId) => {
    setTracks((prev) => removeTrackFromLayout(prev, trackId));
  }, []);

  const addTrack = useCallback(
    (type, position, rotation = 0, snapInfo = null, isLeft = false, geometry = null) => {
      setTracks((prev) => {
        const newTrack = createTrack({
          id: generateUUID(),
          type,
          position,
          rotation,
          isLeft,
          snapInfo,
          geometry,
        });
        return addTrackToLayout(prev, newTrack, snapInfo);
      });
    },
    []
  );

  return { tracks, setTracks, addTrack, deleteTrack, updateTrackGeometry };
};
