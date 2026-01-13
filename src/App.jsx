import * as THREE from 'three';
import { STRAIGHT_LENGTH, CURVE_RADIUS, CURVE_ANGLE } from './utils/constants';
import { useState, useEffect } from 'react';
import Scene from './components/Scene';
import Toolbar from './components/ui/Toolbar';
import TrackCounter from './components/UI/TrackCounter';
import { generateUUID } from 'three/src/math/MathUtils.js';

const isValidTrackData = (data) => {
  if (!Array.isArray(data)) return false;

  return data.every(track => {
    return (
      typeof track.id === 'string' &&
      (track.type === 'STRAIGHT' || track.type === 'CURVED') &&
      Array.isArray(track.position) && track.position.length === 3 &&
      typeof track.rotation === 'number'
    );
  });
};

function App() {
  const [activeTool, setActiveTool] = useState(null);
  const [tracks, setTracks] = useState([]);

  console.log('tracksManager: ',  tracks)

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setActiveTool(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);    
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // --- RESET TRACKS ---
  const resetTracks = () => {
    setTracks([]);
  };

  // --- SAVE LOGIC ---
  const saveTracks = () => {
    const dataStr = JSON.stringify(tracks, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'my-train-track.json';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // --- LOAD LOGIC ---
  const loadTracks = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const loadedTracks = JSON.parse(e.target.result);

        // --- VALIDATION STEP ---
        if (isValidTrackData(loadedTracks)) {
          setTracks(loadedTracks);
        } else {
          alert("Error: The JSON file format is incorrect or corrupted.");
        }
      } catch (err) {
        alert("Error: Failed to parse JSON. Please upload a valid .json file.");
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  const addTrack = (type, position, rotation = 0, snapInfo = null, isLeftOverride=false) => {
    const newId = generateUUID();

    setTracks((prevTracks) => {
      // 1. Link the parent to the new track
      let updatedTracks = prevTracks.map((t) => {
        if (snapInfo && t.id === snapInfo.parentId) {
          return snapInfo.isStartSnap 
            ? { ...t, prevTrackId: newId } 
            : { ...t, nextTrackId: newId };
        }
        return t;
      });

      // 2. Create the new track object with connection IDs
      const newTrack = {
        id: newId,
        type: type === 'STRAIGHT' ? 'STRAIGHT' : 'CURVED',
        isLeft: type === 'STRAIGHT' ? false : isLeftOverride,
        position,
        rotation,
        prevTrackId: snapInfo ? snapInfo.parentId : null,
        nextTrackId: null, 
      };

      // 3. LOOP CLOSURE CHECK (Spatial)
      const isStraight = newTrack.type === 'STRAIGHT';
      const localEnd = isStraight 
        ? new THREE.Vector3(0, 0, STRAIGHT_LENGTH)
        : new THREE.Vector3(
            (CURVE_RADIUS - Math.cos(CURVE_ANGLE) * CURVE_RADIUS) * (newTrack.isLeft ? -1 : 1),
            0,
            Math.sin(CURVE_ANGLE) * CURVE_RADIUS
          );

      const worldEnd = localEnd
        .applyAxisAngle(new THREE.Vector3(0, 1, 0), newTrack.rotation)
        .add(new THREE.Vector3(...newTrack.position));

      updatedTracks = updatedTracks.map(t => {
        const startPos = new THREE.Vector3(...t.position);
        if (!t.prevTrackId && startPos.distanceTo(worldEnd) < 5) {
          newTrack.nextTrackId = t.id;
          return { ...t, prevTrackId: newTrack.id };
        }
        return t;
      });

      return [...updatedTracks, newTrack];
    });
  };

  const deleteTrack = (trackId) => {
    setTracks((prevTracks) => {
      return prevTracks
        .filter(t => t.id !== trackId)
        .map(t => {
          if (t.nextTrackId === trackId) return { ...t, nextTrackId: null };
          if (t.prevTrackId === trackId) return { ...t, prevTrackId: null };
          return t;
        });
    });
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
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
        onDeleteTrack={deleteTrack}/>
    </div>
  )
}

export default App
