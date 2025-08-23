import React from 'react';
import { getBorderCoordinates } from 'utilities/tagsCloud/getBorderCoordinates';
import { COORDINATE_GRID_CANVAS_Z_INDEX } from './constants';
import { PositionedTagRectT, SizeT, ViewBoxT } from 'types/types';

type PropsT = {
  tagsPositions: ReadonlyArray<PositionedTagRectT>;
  svgSize: SizeT;
  viewBox: ViewBoxT;
  sceneMapResolution: number;
  svgSizeFactor: number;
};

const style: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  outline: '1px solid',
  zIndex: COORDINATE_GRID_CANVAS_Z_INDEX,
};

export function CoordinateGrid({ tagsPositions, svgSize, viewBox, sceneMapResolution, svgSizeFactor }: PropsT) {
  const sceneMapUnitSize = sceneMapResolution;

  const [, , width, height] = viewBox;

  const borderCoordinates = getBorderCoordinates(tagsPositions);

  if (!borderCoordinates) {
    return null;
  }

  const { left, right, top, bottom } = borderCoordinates;

  const lines = [];

  for (let row = bottom + sceneMapUnitSize; row < top; row = row + sceneMapUnitSize) {
    const translateY = top - row;
    lines.push(
      <line
        key={`row${row}`}
        stroke="black"
        strokeWidth={row === 0 ? 2 / svgSizeFactor : 1 / svgSizeFactor}
        x1="0"
        x2={width}
        y1={translateY}
        y2={translateY}
      />,
    );
  }

  for (let col = left + sceneMapUnitSize; col < right; col = col + sceneMapUnitSize) {
    const translateX = -left + col;

    lines.push(
      <line
        key={`col${col}`}
        stroke="blue"
        strokeWidth={col === 0 ? 2 / svgSizeFactor : 1 / svgSizeFactor}
        x1={translateX}
        x2={translateX}
        y1="0"
        y2={height}
      />,
    );
  }

  return (
    <svg {...svgSize} style={style} viewBox={viewBox.join(' ')}>
      <g>{lines}</g>
    </svg>
  );
}
