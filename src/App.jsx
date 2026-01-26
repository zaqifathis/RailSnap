
import { useState, useEffect } from 'react';
import * as THREE from 'three';
import { generateUUID } from 'three/src/math/MathUtils.js';
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';

import Scene from './components/Scene';
import Toolbar from './components/UI/Toolbar';
import TrackCounter from './components/UI/TrackCounter';
import ViewToggle from './components/UI/ViewToggle';
import HelpMenu from './components/UI/HelpMenu';
import { getTrackPaths } from './constants/trackPaths';

if (!THREE.BufferGeometry.prototype.computeBoundsTree) {
  THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
  THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
  THREE.Mesh.prototype.raycast = acceleratedRaycast;
}

// --- File Validator ---
const isValidTrackData = (data) => {
  if (!Array.isArray(data)) return false;
  return data.every(track => (
    typeof track.id === 'string' &&
    ['STRAIGHT', 'CURVED', 'Y_TRACK', 'X_TRACK', 'CROSS_90'].includes(track.type) &&
    Array.isArray(track.position) &&
    typeof track.rotation === 'number'
  ));
};

function App() {
  const [activeTool, setActiveTool] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [viewMode, setViewMode] = useState('2D');

  useEffect(() => {
    const handleKeyDown = (e) => e.key === 'Escape' && setActiveTool(null);
    window.addEventListener('keydown', handleKeyDown);    
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const resetTracks = () => setTracks([]);

  // --- SAVE TRACKS ---
  const saveTracks = () => {
    const dataStr = JSON.stringify(tracks, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'my-rail-track.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  // --- LOAD TRACKS ---
  const loadTracks = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const loaded = JSON.parse(e.target.result);
        if (isValidTrackData(loaded)) setTracks(loaded);
        else alert("Invalid JSON format.");
      } catch (err) { alert("Failed to parse JSON."); }
    };
    reader.readAsText(file);
  };

  // --- NEW ADD TRACK LOGIC ---
  const addTrack = (type, position, rotation = 0, snapInfo = null, isLeftOverride = false, geometry) => {
    const newId = generateUUID();

    setTracks((prevTracks) => {
      // 1. Update the parent track's connections
      let updatedTracks = prevTracks.map((t) => {
        if (snapInfo && t.id === snapInfo.parentId) {
          return {
            ...t, connections: {...(t.connections || {}), [snapInfo.id]: newId }
          };
        }
        return t;
      });

      // 2. Identify which port on the NEW track connects to the parent
      let primaryPort = 'start';
      if (type === 'Y_TRACK') {
        const yPorts = ['start', 'end_left', 'end_right'];
        primaryPort = yPorts[snapInfo?.ghostPortIndex % 3 || 0];
      } 
      else if (type === 'X_TRACK') {
        const xPorts = ['a_start', 'b_start'];
        primaryPort = xPorts[snapInfo?.ghostPortIndex % 2 || 0];
      }

      const newTrack = {
        id: newId,
        type,
        isLeft: isLeftOverride,
        position,
        rotation,
        geometry,
        paths: getTrackPaths(type, isLeftOverride),
        connections: { 
          start: null, 
          end: null, 
          end_left: null, 
          end_right: null,
          a_start: null,
          a_end: null,
          b_start: null,
          b_end: null,
          ...{[primaryPort]: snapInfo ? snapInfo.parentId : null} 
        }
      };

      return [...updatedTracks, newTrack];
    });
  };

  // --- UPDATED DELETE LOGIC ---
  const deleteTrack = (trackId) => {
    setTracks((prevTracks) => {
      return prevTracks
        .filter(t => t.id !== trackId)
        .map(t => {
          if (!t.connections) return t;
          
          const newConnections = { ...t.connections };
          Object.keys(newConnections).forEach(port => {
            if (newConnections[port] === trackId) {
              newConnections[port] = null;
            }
          });
          
          return { ...t, connections: newConnections };
        });
    });
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, overflow: 'hidden' }}>
      <TrackCounter tracks={tracks} />
      <Toolbar 
        activeTool={activeTool}
        onSelectTool={setActiveTool} 
        onSave={saveTracks} 
        onLoad={loadTracks}
        onReset={resetTracks} 
      />
      <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
      <HelpMenu />
      <Scene 
        viewMode={viewMode}
        activeTool={activeTool} 
        tracks={tracks} 
        onPlaceTrack={addTrack}
        onDeleteTrack={deleteTrack}
        onToggleTrack={() => {}}
      />
    </div>
  );
}

export default App;
