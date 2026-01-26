import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, GizmoHelper, GizmoViewport, Environment } from '@react-three/drei';
import { DUPLO_STUD } from '../constants/constants';
import Track from './Track';
import { useState, useEffect, useRef } from 'react';
import InteractionHandler from './InteractionHandler';
import { easing } from 'maath';
import * as THREE from 'three';

const CameraController = ({ viewMode }) => {
  const { camera, controls } = useThree();
  const isTransitioning = useRef(false);
  
  // Pre-allocate a vector to avoid creating new objects every frame
  const targetVec = useRef(new THREE.Vector3());

  useEffect(() => {
    isTransitioning.current = true;
    if (controls) {
      controls.target.set(0, 0, 0);
      controls.update(); 
    }
  }, [viewMode, controls]);

  useFrame((state, delta) => {
    if (!isTransitioning.current) return;

    const is2D = viewMode === '2D';
    const targetPos = is2D ? [0, 1500, 0] : [500, 500, 500];
    const targetUp = is2D ? [0, 0, -1] : [0, 1, 0];

    targetVec.current.set(...targetPos);
    easing.damp3(camera.position, targetPos, 0.25, delta);
    easing.damp3(camera.up, targetUp, 0.25, delta);
    camera.lookAt(0, 0, 0);

    const dist = camera.position.distanceTo(targetVec.current);
    
    // If we are within 5 units (or about 0.5% of total travel), stop the force
    if (dist < 5) {
      isTransitioning.current = false;
      camera.position.copy(targetVec.current);
      if (controls) controls.update();
    }
  });

  return null;
};


const Scene = ({ viewMode, activeTool, tracks, onPlaceTrack, onDeleteTrack, onToggleTrack}) => {
  const [hoveredId, setHoveredId] = useState(null);

  return (
    <Canvas 
        shadows
        dpr={[1, 2]} 
        gl={{ antialias: true }} 
        camera={{ 
        position: viewMode === '3D' ? [500, 500, 500] : [0, 1000, 0], 
        fov: 45,
        far: 100000
      }}
        onCreated={({ gl }) => { gl.setClearColor('#ecebeb'); }}
    >
      <ambientLight intensity={0.7} />
      <Environment preset="city" />
      
      <directionalLight 
        position={[100, 200, 100]} 
        intensity={0.8} 
        castShadow={true}
        shadow-bias={-0.0001}
        shadow-mapSize={[2048, 2048]} 
      />

      <CameraController viewMode={viewMode} />
      <OrbitControls 
        makeDefault 
        enableRotate={viewMode === '3D'}
        enablePan={true}
        screenSpacePanning={viewMode === '2D'}
        maxPolarAngle={viewMode === '3D' ? Math.PI / 3 : Math.PI / 2}
        minDistance={300}   
        maxDistance={5000}
        enableDamping={true} 
        dampingFactor={0.05}
      />

      <Grid 
        infiniteGrid
        cellSize={DUPLO_STUD}
        sectionSize={DUPLO_STUD * 10}
        fadeDistance={5000}
        fadeStrength={5}
        followCamera={false}
        cellColor="#bebebe" 
        sectionColor="#afaeae"
        cellThickness={1}
        sectionThickness={1.5}
        position={[0, -0.01, 0]} 
      />

      {tracks.map(track => (
        <Track 
          key={track.id}
          {...track}
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