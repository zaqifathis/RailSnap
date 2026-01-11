import { useState } from 'react';
import Scene from './components/canvas/Scene';
import Toolbar from './components/ui/Toolbar';
import { generateUUID } from 'three/src/math/MathUtils.js';

function App() {
  const [activeTool, setActiveTool] = useState(null);
  const [tracks, setTracks] = useState([]);

  console.log('tracksManager: ',  tracks)
  const addTrack = (type, position, rotation=0) => {
    setTracks([...tracks, { 
      id: generateUUID(), 
      type: type === 'STRAIGHT' ? 'STRAIGHT' : 'CURVED',
      isLeft: type === 'CURVE_LEFT',
      position,
      rotation // Store the rotation in radians
    }]);
    setActiveTool(null); 
  };

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Toolbar onSelectTool={setActiveTool}/>
      <Scene activeTool={activeTool} 
        tracks={tracks} 
        onPlaceTrack={addTrack}/>
    </div>
  )
}

export default App
