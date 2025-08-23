import React from 'react';
import { ViewBoxT } from 'utilities/tagsCloud/tagSvgData';
import { REACT_AREAS_CANVAS_Z_INDEX } from './constants';
import { PositionedTagRectT, SizeT } from 'types/types';

type PropsT = {
  tagData: ReadonlyArray<PositionedTagRectT>;
  svgSize: SizeT;
  viewBox: ViewBoxT;
  transform: string;
  svgSizeFactor: number;
};

const rootStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  outline: '1px solid',
  zIndex: REACT_AREAS_CANVAS_Z_INDEX,
};

const reactStyle: React.CSSProperties = {
  position: 'relative',
};

export function ReactAreas({ tagData, svgSize, viewBox, transform, svgSizeFactor }: PropsT) {
  const rects = tagData.map(({ id, color, rectRight, rectTop, rectLeft, rectBottom }) => {
    const x = rectLeft;
    const y = -rectTop;

    const width = rectRight - rectLeft;
    const height = rectTop - rectBottom;

    return (
      <rect
        // fill="purple"
        fillOpacity="0"
        height={height}
        key={id}
        stroke={color}
        strokeOpacity="0.5"
        strokeWidth={3 / svgSizeFactor}
        style={reactStyle}
        width={width}
        x={x}
        y={y}
      />
    );
  });
  return (
    <svg {...svgSize} style={rootStyle} viewBox={viewBox.join(' ')}>
      <g transform={transform}>{rects}</g>
    </svg>
  );
}
