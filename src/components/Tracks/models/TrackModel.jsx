import { forwardRef, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { interactionColor, trackModelStyle } from '../../../constants/theme';
import { TRACK_MODELS, getTrackModelConfig } from '../../../constants/trackConfig';

const getMaterialColor = ({ isOccupied, isSnapped, isSelected }) => {
  if (isOccupied) return interactionColor.occupied;
  if (isSnapped) return interactionColor.snap;
  if (isSelected) return interactionColor.selected;
  return interactionColor.default;
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
    }, [mainNode]);

    if (!mainNode) return null;

    // Ghosts must not block raycasts aimed at the placement floor.
    const raycast = isGhost ? () => null : undefined;

    return (
      <group {...props} dispose={null}>
        <mesh
          ref={ref}
          raycast={raycast}
          name={config.node}
          castShadow
          receiveShadow
          geometry={mainNode.geometry}
          material={mainNode.material}
        >
          <meshStandardMaterial
            color={getMaterialColor({ isOccupied, isSnapped, isSelected })}
            roughness={trackModelStyle.roughness}
            metalness={trackModelStyle.metalness}
            transparent
            opacity={isGhost ? trackModelStyle.ghostOpacity : trackModelStyle.opacity}
          />
        </mesh>

        {(config.extraNodes || []).map((name) => (
          <mesh
            key={name}
            raycast={raycast}
            name={name}
            castShadow
            receiveShadow
            geometry={nodes[name].geometry}
            material={nodes[name].material}
          >
            {isGhost && (
              <meshStandardMaterial
                map={nodes[name].material?.map}
                transparent
                opacity={trackModelStyle.ghostOpacity}
              />
            )}
          </mesh>
        ))}
      </group>
    );
  }
);

TrackModel.displayName = 'TrackModel';

Object.values(TRACK_MODELS).forEach(({ url }) => useGLTF.preload(url));
