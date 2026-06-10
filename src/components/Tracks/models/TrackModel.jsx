import * as THREE from 'three';
import { forwardRef, useEffect, useState } from 'react';
import { useGLTF, useCursor } from '@react-three/drei';
import { interactionColor, trackModelStyle } from '../../../constants/theme';
import { TRACK_MODELS, getTrackModelConfig } from '../../../constants/trackConfig';

const getMaterialColor = ({ isOccupied, isSnapped, isSelected }) => {
  if (isOccupied) return interactionColor.occupied;
  if (isSnapped) return interactionColor.snap;
  if (isSelected) return interactionColor.selected;
  return interactionColor.default;
};

/**
 * The GLB's own red switch piece. When onSwitchClick is given (play mode)
 * it becomes the clickable lever; 'left' mirrors the mesh across the
 * track centerline so it points at the branch the main line takes.
 */
const SwitchMesh = ({ node, isGhost, raycast, direction, onSwitchClick }) => {
  const [hovered, setHovered] = useState(false);
  const interactive = Boolean(onSwitchClick);
  useCursor(interactive && hovered);

  return (
    <mesh
      raycast={raycast}
      name={node.name}
      castShadow
      receiveShadow
      geometry={node.geometry}
      material={node.material}
      scale={[direction === 'left' ? -1 : 1, 1, 1]}
      onClick={
        interactive
          ? (e) => {
              e.stopPropagation();
              onSwitchClick();
            }
          : undefined
      }
      onPointerOver={
        interactive
          ? (e) => {
              e.stopPropagation();
              setHovered(true);
            }
          : undefined
      }
      onPointerOut={interactive ? () => setHovered(false) : undefined}
    >
      {isGhost && (
        <meshStandardMaterial map={node.material?.map} transparent opacity={trackModelStyle.ghostOpacity} />
      )}
    </mesh>
  );
};

/** Renders the GLB model for any track type and prepares its BVH for collision checks. */
export const TrackModel = forwardRef(
  (
    {
      type,
      isLeft = false,
      isGhost = false,
      isOccupied = false,
      isSnapped = false,
      isSelected = false,
      switchDirection,
      onSwitchClick,
      ...props
    },
    ref
  ) => {
    const config = getTrackModelConfig(type, isLeft);
    const { nodes } = useGLTF(config.url);
    const mainNode = nodes[config.node];

    useEffect(() => {
      if (!mainNode) return;
      const geo = mainNode.geometry;
      if (!geo.boundsTree) geo.computeBoundsTree();
      if (!geo.boundingBox) geo.computeBoundingBox();

      // Switch meshes get mirrored (scale -1) to show the lever state;
      // that flips triangle winding, so render both faces.
      (config.extraNodes || []).forEach((name) => {
        const material = nodes[name]?.material;
        if (material) material.side = THREE.DoubleSide;
      });
    }, [mainNode, nodes, config.extraNodes]);

    if (!mainNode) return null;

    // Ghosts must not block raycasts aimed at the placement floor.
    const raycast = isGhost ? () => null : undefined;

    return (
      <group {...props} dispose={null}>
        {/* No material prop: the child material is the only one, so swapping
            models (curved left/right) can never fall back to the raw GLB look. */}
        <mesh
          key={config.url}
          ref={ref}
          raycast={raycast}
          name={config.node}
          castShadow
          receiveShadow
          geometry={mainNode.geometry}
        >
          <meshStandardMaterial
            color={getMaterialColor({ isOccupied, isSnapped, isSelected })}
            roughness={trackModelStyle.roughness}
            metalness={trackModelStyle.metalness}
            transparent={isGhost}
            opacity={isGhost ? trackModelStyle.ghostOpacity : trackModelStyle.opacity}
          />
        </mesh>

        {(config.extraNodes || []).map((name) => (
          <SwitchMesh
            key={name}
            node={nodes[name]}
            isGhost={isGhost}
            raycast={raycast}
            direction={switchDirection}
            onSwitchClick={onSwitchClick}
          />
        ))}
      </group>
    );
  }
);

TrackModel.displayName = 'TrackModel';

Object.values(TRACK_MODELS).forEach(({ url }) => useGLTF.preload(url));
