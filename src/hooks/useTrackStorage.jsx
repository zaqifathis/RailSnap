import { getTrackPaths } from '../constants/trackPaths';

export const useTrackStorage = (tracks, setTracks) => {

  // --- SAVE LOGIC ---
  const saveTracks = () => {
    const persistentData = tracks.map(({ id, type, isLeft, position, rotation, connections }) => ({
      id, type, isLeft, position, rotation, connections
    }));

    const dataStr = JSON.stringify(persistentData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'my-rail-layout.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  // --- LOAD LOGIC ---
  const loadTracks = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const loaded = JSON.parse(e.target.result);        
        const rehydrated = loaded.map(track => ({
          ...track,
          paths: getTrackPaths(track.type, track.isLeft)
        }));
        
        setTracks(rehydrated);
      } catch (err) {
        console.error("Failed to parse JSON", err);
        alert("Failed to load tracks. Please check the file format.");
      }
    };
    reader.readAsText(file);
  };

  return { saveTracks, loadTracks };
};