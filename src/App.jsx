import { useState } from 'react';
import Scene from './components/canvas/Scene';
import Toolbar from './components/ui/Toolbar';



function App() {
  const [activeTool, setActiveTool] = useState(null);
  
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Toolbar onSelectTool={setActiveTool} />
      <Scene />
    </div>
  )
}

export default App
