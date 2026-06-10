import * as THREE from 'three';
import { useRef, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { sampleRoute, nearestRouteDistance } from '../../utils/trainRoute';

/** Train speed in mm/s at slider value 1 (one straight piece per second). */
const BASE_SPEED = 130;
/** Distance between locomotive and wagon centers along the track. */
const CAR_GAP = 105;
const WHEEL_RADIUS = 9;

const Wheels = ({ wheelsRef }) => (
  <group ref={wheelsRef}>
    {[
      [-19, -25],
      [19, -25],
      [-19, 25],
      [19, 25],
    ].map(([x, z]) => (
      <group key={`${x}:${z}`} position={[x, WHEEL_RADIUS, z]}>
        <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[WHEEL_RADIUS, WHEEL_RADIUS, 6, 24]} />
          <meshStandardMaterial color="#2b2b2b" roughness={0.6} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[WHEEL_RADIUS * 0.45, WHEEL_RADIUS * 0.45, 6.5, 16]} />
          <meshStandardMaterial color="#f4c20d" roughness={0.5} />
        </mesh>
      </group>
    ))}
  </group>
);

const Locomotive = ({ wheelsRef }) => (
  <group>
    {/* chassis */}
    <mesh position={[0, 14, 0]} castShadow>
      <boxGeometry args={[40, 8, 86]} />
      <meshStandardMaterial color="#3b3b3b" roughness={0.6} />
    </mesh>
    {/* boiler body */}
    <mesh position={[0, 27, 14]} castShadow>
      <boxGeometry args={[34, 20, 52]} />
      <meshStandardMaterial color="#d9262c" roughness={0.45} />
    </mesh>
    {/* chimney */}
    <mesh position={[0, 42, 32]} castShadow>
      <cylinderGeometry args={[5, 7, 12, 20]} />
      <meshStandardMaterial color="#f4c20d" roughness={0.45} />
    </mesh>
    {/* cab */}
    <mesh position={[0, 34, -26]} castShadow>
      <boxGeometry args={[38, 30, 30]} />
      <meshStandardMaterial color="#1d6fd1" roughness={0.45} />
    </mesh>
    {/* cab roof */}
    <mesh position={[0, 51, -26]} castShadow>
      <boxGeometry args={[44, 5, 36]} />
      <meshStandardMaterial color="#f4c20d" roughness={0.45} />
    </mesh>
    {/* front buffer */}
    <mesh position={[0, 16, 45]} castShadow>
      <boxGeometry args={[34, 10, 6]} />
      <meshStandardMaterial color="#f4c20d" roughness={0.5} />
    </mesh>
    <Wheels wheelsRef={wheelsRef} />
  </group>
);

const Wagon = ({ wheelsRef }) => (
  <group>
    <mesh position={[0, 14, 0]} castShadow>
      <boxGeometry args={[40, 8, 76]} />
      <meshStandardMaterial color="#3b3b3b" roughness={0.6} />
    </mesh>
    <mesh position={[0, 26, 0]} castShadow>
      <boxGeometry args={[36, 18, 64]} />
      <meshStandardMaterial color="#2e9e44" roughness={0.45} />
    </mesh>
    {/* cargo studs, Duplo style */}
    {[-16, 0, 16].map((z) => (
      <mesh key={z} position={[0, 38, z]} castShadow>
        <cylinderGeometry args={[7, 7, 6, 20]} />
        <meshStandardMaterial color="#7ed957" roughness={0.45} />
      </mesh>
    ))}
    <Wheels wheelsRef={wheelsRef} />
  </group>
);

/**
 * Animated Duplo train. Follows the route polyline; speed is the slider
 * value (-3..3), negative drives backward. resetSignal puts it back at
 * the start of the route.
 */
const Train = ({ route, isPlaying, speed, resetSignal }) => {
  const locoRef = useRef();
  const wagonRef = useRef();
  const locoWheelsRef = useRef();
  const wagonWheelsRef = useRef();
  const distanceRef = useRef(CAR_GAP);
  const lastWorldPos = useRef(null);

  const scratch = useMemo(
    () => ({ pos: new THREE.Vector3(), tan: new THREE.Vector3() }),
    []
  );

  useEffect(() => {
    distanceRef.current = CAR_GAP;
    lastWorldPos.current = null;
  }, [resetSignal]);

  // Route rebuilt mid-ride (a switch flipped, track edited): keep the
  // train where it stands by remapping its position onto the new route.
  useEffect(() => {
    if (route && lastWorldPos.current) {
      distanceRef.current = Math.max(
        nearestRouteDistance(route, lastWorldPos.current),
        route.isLoop ? 0 : CAR_GAP
      );
    } else {
      distanceRef.current = CAR_GAP;
    }
  }, [route]);

  const placeCar = (ref, wheels, distance, delta) => {
    if (!ref.current) return;
    sampleRoute(route, distance, scratch.pos, scratch.tan);
    ref.current.position.copy(scratch.pos);
    ref.current.rotation.y = Math.atan2(scratch.tan.x, scratch.tan.z);
    if (wheels.current && isPlaying) {
      wheels.current.children.forEach((wheel) => {
        wheel.rotation.x += (speed * BASE_SPEED * delta) / WHEEL_RADIUS;
      });
    }
  };

  useFrame((_, delta) => {
    if (!route) return;

    if (isPlaying) {
      distanceRef.current += speed * BASE_SPEED * delta;
      if (!route.isLoop) {
        // Keep the whole train on the rails at both ends.
        distanceRef.current = Math.min(
          Math.max(distanceRef.current, CAR_GAP),
          route.totalLength
        );
      }
    }

    placeCar(locoRef, locoWheelsRef, distanceRef.current, delta);
    if (!lastWorldPos.current) lastWorldPos.current = new THREE.Vector3();
    lastWorldPos.current.copy(scratch.pos);
    placeCar(wagonRef, wagonWheelsRef, distanceRef.current - CAR_GAP, delta);
  });

  if (!route) return null;

  return (
    <>
      <group ref={locoRef}>
        <Locomotive wheelsRef={locoWheelsRef} />
      </group>
      <group ref={wagonRef}>
        <Wagon wheelsRef={wagonWheelsRef} />
      </group>
    </>
  );
};

export default Train;
