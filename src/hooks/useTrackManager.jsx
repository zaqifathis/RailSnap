import { useState } from 'react';
import { generateUUID } from 'three/src/math/MathUtils.js';
import { getPortsTrack } from '../constants/trackPaths';

export const useTrackManager = (initialTracks = []) => {
  const [tracks, setTracks] = useState(initialTracks);

  const updateTrackGeometry = (trackId, geometry) => {
    setTracks(prev => prev.map(t => 
      t.id === trackId ? { ...t, geometry } : t
    ));
  };

  const deleteTrack = (trackId) => {
    setTracks(prevTracks => 
      prevTracks
        .filter(t => t.id !== trackId)
        .map(t => {
          if (!t.connections) return t;
          const newConnections = { ...t.connections };
          Object.keys(newConnections).forEach(port => {
            if (newConnections[port] === trackId) newConnections[port] = null;
          });
          return { ...t, connections: newConnections };
        })
    );
  };

  const addTrack = (type, position, rotation = 0, snapInfo = null, isLeftOverride = false, geometry) => {
    const newId = generateUUID();

    setTracks((prevTracks) => {
      // Logic for connecting to parent
      let updatedTracks = prevTracks.map((t) => {
        if (snapInfo && t.id === snapInfo.parentId) {
          return {
            ...t, connections: { ...(t.connections || {}), [snapInfo.id]: newId }
          };
        }
        return t;
      });

      // Logic for initializing new track connections
      const allAvailablePorts = getPortsTrack(type, isLeftOverride);
      const initialConnections = {};
      allAvailablePorts.forEach(port => { initialConnections[port.id] = null; });

      if (snapInfo) {
        // Logic for determining the primary port (Y or X track specific)
        let primaryPortId = 'start';
        if (type === 'Y_TRACK') {
          const yPorts = ['start', 'end_left', 'end_right'];
          primaryPortId = yPorts[snapInfo.ghostPortIndex % 3];
        } else if (type === 'X_TRACK') {
          const xPorts = ['a_start', 'b_start'];
          primaryPortId = xPorts[snapInfo.ghostPortIndex % 2];
        }
        initialConnections[primaryPortId] = snapInfo.parentId;
      }

      const newTrack = {
        id: newId,
        type,
        isLeft: isLeftOverride,
        position,
        rotation,
        geometry,
        connections: initialConnections
      };

      return [...updatedTracks, newTrack];
    });
  };

  return { tracks, setTracks, addTrack, deleteTrack, updateTrackGeometry };
};