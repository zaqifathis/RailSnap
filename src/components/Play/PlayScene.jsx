import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Environment } from '@react-three/drei';
import { DUPLO_STUD } from '../../constants/constants';
import Track from '../Tracks/Track';
import Train from './Train';

/** 3D-only scene for play mode: static track layout plus the animated train. */
const PlayScene = ({ tracks, route, isPlaying, speed, resetSignal }) => (
  <Canvas
    shadows
    dpr={[1, 2]}
    gl={{ antialias: true }}
    camera={{ position: [500, 500, 500], fov: 45, far: 100000 }}
    onCreated={({ gl }) => gl.setClearColor('#ecebeb')}
  >
    <ambientLight intensity={0.7} />
    <Environment preset="city" />
    <directionalLight
      position={[100, 200, 100]}
      intensity={0.8}
      castShadow
      shadow-bias={-0.0001}
      shadow-mapSize={[2048, 2048]}
    />

    <OrbitControls
      makeDefault
      enablePan
      maxPolarAngle={Math.PI / 2.2}
      minDistance={200}
      maxDistance={5000}
      enableDamping
      dampingFactor={0.05}
    />

    <Grid
      infiniteGrid
      cellSize={DUPLO_STUD}
      sectionSize={DUPLO_STUD * 10}
      fadeDistance={5000}
      fadeStrength={5}
      cellColor="#bebebe"
      sectionColor="#afaeae"
      cellThickness={1}
      sectionThickness={1.5}
      position={[0, -0.01, 0]}
    />

    {tracks.map((track) => (
      <Track
        key={track.id}
        type={track.type}
        position={track.position}
        rotation={track.rotation}
        isLeft={track.isLeft}
      />
    ))}

    <Train route={route} isPlaying={isPlaying} speed={speed} resetSignal={resetSignal} />
  </Canvas>
);

export default PlayScene;
