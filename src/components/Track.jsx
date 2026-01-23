import React, { useMemo } from 'react';
import { Line, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { STRAIGHT_LENGTH, CURVE_RADIUS, CURVE_ANGLE } from '../constants/constants';

import {TrackStraight} from './models/TrackStraight';
import { TrackCurved } from './models/TrackCurved';
import { TrackCross60 } from './models/TrackCross60';
import { TrackCurvedLeft } from './models/TrackCurvedLeft';
import { TrackYSwitch } from './models/TrackYSwitch';
import { TrackCross90 } from './models/TrackCross90';
import { interactionColor } from '../constants/theme';
import { trackColors } from '../constants/theme';
import { getTrackPaths } from '../constants/trackPaths';

const Track = ({ 
  position= [0, 0, 0],
  rotation=0,
  type = 'STRAIGHT', 
  isLeft = false, 
  isGhost = false, 
  isOccupied = false, 
  isSnapped = false,
  isSelected = false, 
  onPointerOver,
  onPointerOut,
  onClick 
}) => {  

  const paths = useMemo(() => getTrackPaths(type, isLeft), [type, isLeft]);

  let trackColor;
  if (isSelected) {
    trackColor = interactionColor.selected;
  } else if (isGhost) {
    if (isOccupied) trackColor = interactionColor.occupied;
    else if (isSnapped) trackColor = interactionColor.snap;
    else trackColor = interactionColor.default;
  } else {
      if (type === "STRAIGHT") trackColor = trackColors.straight;
      if (type === "CURVED") trackColor = trackColors.curved
      if (type === "Y_TRACK") trackColor = trackColors.y_track
      if (type === "X_TRACK") trackColor = trackColors.x_track
  }

  return (
    <group 
      position={position}          
      rotation={[0, rotation, 0]}
      onPointerOver={onPointerOver} 
      onPointerOut={onPointerOut} 
      onClick={onClick}
    >
      {type === 'STRAIGHT' && (
        <TrackStraight 
          isGhost={isGhost}
          isOccupied={isOccupied}
          isSnapped={isSnapped}
          isSelected={isSelected}
        />
      )}
      {type === 'CURVED' && (
        isLeft ? (<TrackCurvedLeft isGhost={isGhost} isOccupied={isOccupied} isSnapped={isSnapped} isSelected={isSelected}/>) : 
        (<TrackCurved 
          isGhost={isGhost} 
          isOccupied={isOccupied} 
          isSnapped={isSnapped}
          isSelected={isSelected}
          />)
      )}
      {type === 'X_TRACK' && (
        <TrackCross60 
          isGhost={isGhost}
          isOccupied={isOccupied}
          isSnapped={isSnapped}
          isSelected={isSelected}
        />
      )}
      {type === 'Y_TRACK' && (
        <TrackYSwitch 
          isGhost={isGhost}
          isOccupied={isOccupied}
          isSnapped={isSnapped}
          isSelected={isSelected}
        />
      )}
      {type === 'CROSS_90' && (
        <TrackCross90 
          isGhost={isGhost}
          isOccupied={isOccupied}
          isSnapped={isSnapped}
          isSelected={isSelected}
        />
      )}
      {paths.map((pts, index) => {
        return (
          <Line 
            key={index}
            points={pts}
            visible={false} // turn true for check
            color={trackColor} 
            lineWidth={isSelected ? 6 : (isGhost ? 5 : 3)} 
            transparent={isGhost} 
            opacity={isGhost ? 0.5 : 1}
          />
        );
      })}
    </group>
    
  );
};

export default Track;