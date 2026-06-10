import { serializeLayout, rehydrateLayout } from '../utils/trackGraph';

const downloadJson = (data, filename) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const useTrackStorage = (tracks, setTracks) => {
  const saveTracks = () => {
    downloadJson(serializeLayout(tracks), 'rail-layout.json');
  };

  const loadTracks = (event) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        setTracks(rehydrateLayout(JSON.parse(e.target.result)));
      } catch (err) {
        console.error('Failed to load layout:', err);
      } finally {
        // Reset so picking the same file again still fires onChange.
        input.value = '';
      }
    };
    reader.readAsText(file);
  };

  return { saveTracks, loadTracks };
};
