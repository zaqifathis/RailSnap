import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, GizmoHelper, GizmoViewport} from '@react-three/drei';
import { DUPLO_STUD} from '../utils/constants';
import Track from './Track';
import { useState } from 'react';
import InteractionHandler from './InteractionHandler';

const Scene = ({ activeTool, tracks, onPlaceTrack, onDeleteTrack }) => {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <Canvas 
        shadows
        dpr={[1, 2]} // Optimizes for high-DPI screens (Retina)
        gl={{ antialias: true}} 
        camera={{ position: [500, 500, 500], fov: 45, far: 100000 }}
        onCreated={({ gl }) => {gl.setClearColor('#ecebeb');}}>
      <ambientLight intensity={1.5} />
      <directionalLight 
        position={[100, 200, 100]} 
        intensity={1.0} 
        castShadow={true}
        shadow-mapSize={[2048, 2048]} // Higher resolution shadows
      />
      <OrbitControls makeDefault />

      {/* Box Viewer Helper */}
      <GizmoHelper alignment="top-right" margin={[80, 80]}>
        <GizmoViewport axisColors={['red', 'green', 'blue']} labelColor="black" />
      </GizmoHelper>

      <Grid 
            infiniteGrid
            cellSize={DUPLO_STUD}           // 16mm
            sectionSize={DUPLO_STUD * 10}    // Every 10 DUPLO_STUDs (160mm)
            fadeDistance={5000}        // How far the grid "exists"
            fadeStrength={5}           // Keep this low so it doesn't "cut off" harshly
            followCamera={false}       // Important: keeps the grid fixed to world origin
            cellColor="#e5e5e5" 
            sectionColor="#c7c5c5"
            cellThickness={1}          // Thinner lines reduce Moiré patterns
            sectionThickness={1.5}
            position={[0, -0.01, 0]} 
        />
      
      {tracks.map(track => (
        <group key={track.id} position={track.position} rotation={[0, track.rotation || 0, 0]}>
          <Track 
            type={track.type} 
            isLeft={track.isLeft} 
            isSelected={hoveredId === track.id}
            onPointerOver={(e) => {
              e.stopPropagation();
              if (!activeTool) setHoveredId(track.id);
            }}
            onPointerOut={() => setHoveredId(null)}
            onClick={(e) => {
              e.stopPropagation();
              if (!activeTool) onDeleteTrack(track.id);
            }}
          />
        </group>
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