
import { useState, useEffect } from 'react';

import Scene from './components/Three/Scene';
import Toolbar from './components/UI/Toolbar';
import TrackCounter from './components/UI/TrackCounter';
import ViewToggle from './components/UI/ViewToggle';
import HelpMenu from './components/UI/HelpMenu';
import { useTrackStorage } from './hooks/useTrackStorage';
import { useTrackManager } from './hooks/useTrackManager';

function App() {
  const [viewMode, setViewMode] = useState('2D');
  const [activeTool, setActiveTool] = useState(null);
  
  const { tracks, setTracks, addTrack, deleteTrack, updateTrackGeometry } = useTrackManager();
  const { saveTracks, loadTracks } = useTrackStorage(tracks, setTracks);

  useEffect(() => {
    const handleKeyDown = (e) => e.key === 'Escape' && setActiveTool(null);
    window.addEventListener('keydown', handleKeyDown);    
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const resetTracks = () => setTracks([]);

  
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
        onUpdateTrackGeometry={updateTrackGeometry}
      />
    </div>
  );
}

export default App;
