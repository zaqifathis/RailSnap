import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, GizmoHelper, GizmoViewport, Environment, ContactShadows } from '@react-three/drei';
import { DUPLO_STUD } from '../utils/constants';
import Track from './Track';
import { useState } from 'react';
import InteractionHandler from './InteractionHandler';

const Scene = ({ activeTool, tracks, onPlaceTrack, onDeleteTrack, onToggleTrack }) => {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <Canvas 
        shadows
        dpr={[1, 2]} 
        gl={{ antialias: true }} 
        camera={{ position: [500, 500, 500], fov: 45, far: 100000 }}
        onCreated={({ gl }) => { gl.setClearColor('#ecebeb'); }}
    >
      <ambientLight intensity={0.7} />
      <Environment preset="city" />
      
      <directionalLight 
        position={[100, 200, 100]} 
        intensity={1.0} 
        castShadow={true}
        shadow-mapSize={[2048, 2048]} 
      />

      <OrbitControls makeDefault />

      <GizmoHelper alignment="top-right" margin={[80, 80]}>
        <GizmoViewport axisColors={['red', 'green', 'blue']} labelColor="black" />
      </GizmoHelper>

      <Grid 
        infiniteGrid
        cellSize={DUPLO_STUD}
        sectionSize={DUPLO_STUD * 10}
        fadeDistance={5000}
        fadeStrength={5}
        followCamera={false}
        cellColor="#b7b7b7" 
        sectionColor="#a1a0a0"
        cellThickness={1}
        sectionThickness={1.5}
        position={[0, -0.01, 0]} 
      />

      {tracks.map(track => (
        <Track 
          key={track.id}
          {...track} // Spreads position, rotation, type, isLeft, activeState, etc.
          isSelected={hoveredId === track.id}
          onPointerOver={(e) => {
            e.stopPropagation();
            if (!activeTool) setHoveredId(track.id);
          }}
          onPointerOut={() => setHoveredId(null)}
          onClick={(e) => {
            e.stopPropagation();
            // Delete only if no tool is active
            if (!activeTool) onDeleteTrack(track.id);
          }}
          // 3. Right-click to toggle switch direction or X-track state
          onContextMenu={(e) => {
            e.stopPropagation();
            if (!activeTool) onToggleTrack(track.id);
          }}
        />
      ))}

      <InteractionHandler 
        activeTool={activeTool} 
        tracks={tracks} 
        onPlaceTrack={onPlaceTrack} 
      />
    </Canvas>
  );
};

export default Scene;