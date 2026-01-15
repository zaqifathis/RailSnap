
import { useState, useEffect } from 'react';
import Scene from './components/Scene';
import Toolbar from './components/UI/Toolbar';
import TrackCounter from './components/UI/TrackCounter';
import { generateUUID } from 'three/src/math/MathUtils.js';


// --- File Validator ---
const isValidTrackData = (data) => {
  if (!Array.isArray(data)) return false;
  return data.every(track => (
    typeof track.id === 'string' &&
    ['STRAIGHT', 'CURVED', 'Y_TRACK', 'X_TRACK'].includes(track.type) &&
    Array.isArray(track.position) &&
    typeof track.rotation === 'number'
  ));
};

function App() {
  const [activeTool, setActiveTool] = useState(null);
  const [tracks, setTracks] = useState([]);

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
    link.download = 'train-network.json';
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
  const addTrack = (type, position, rotation = 0, snapInfo = null, isLeftOverride = false) => {
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
        const yPorts = ['base', 'left', 'right'];
        primaryPort = yPorts[snapInfo?.ghostPortIndex % 3 || 0];
      } 
      else if (type === 'X_TRACK') {
        const xPorts = ['a_start', 'b_start'];
        primaryPort = xPorts[snapInfo?.ghostPortIndex % 2 || 0];
      }

      const newTrack = {
        id: newId,
        type,
        isLeft: type === 'STRAIGHT' || type === 'X_TRACK' || type === 'Y_TRACK' ? isLeftOverride : isLeftOverride,
        position,
        rotation,
        connections: {[primaryPort]: snapInfo ? snapInfo.parentId : null}
      };

      // Note: Spatial loop closure check for multiple ports is complex 
      // and usually better handled in InteractionHandler.
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
          
          // Scrub the deleted track ID from all connection ports
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
        onSelectTool={setActiveTool} 
        onSave={saveTracks} 
        onLoad={loadTracks}
        onReset={resetTracks} 
      />
      <Scene 
        activeTool={activeTool} 
        tracks={tracks} 
        onPlaceTrack={addTrack}
        onDeleteTrack={deleteTrack}
      />
    </div>
  );
}

export default App;
