import React from 'react';
import { Dimensions, SceneEdgesT, SceneMap } from 'utilities/positioningAlgorithm/sceneMap';
import { VacancyKinds, VacancyT } from 'utilities/positioningAlgorithm/types';
import { SizeT, ViewBoxT } from 'types/types';

type ActiveVacanciesPropsT = {
  sceneMapEdges: SceneEdgesT | null;
  vacancies: { id: string; vacancy: VacancyT; kind: VacancyKinds; importance: 0 | 1 | 2 }[] | null;
  svgSize: SizeT;
  svgViewBox: ViewBoxT;
  transform: string;
  sceneMapResolution: number;
};

const activeVacanciesStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
};

const vacancyStrokeWidthByImportance: Record<0 | 1 | 2, number> = {
  0: 0.5,
  1: 1,
  2: 2,
};

type RenderVacancyRectArgsT = {
  id: string;
  vacancy: VacancyT;
  sceneMapEdges: SceneEdgesT;
  importance: 0 | 1 | 2;
  sceneMapResolution: number;
};

const renderVacancyRect = ({ id, vacancy, sceneMapEdges, importance, sceneMapResolution }: RenderVacancyRectArgsT) => {
  // when the coordinate is not defined, then it is a vacancy on the edge (an edge vacancy)
  const left = Number.isFinite(vacancy.left) ? vacancy.left : sceneMapEdges[Dimensions.MINUS_X];
  const right = Number.isFinite(vacancy.right) ? vacancy.right : sceneMapEdges[Dimensions.X];
  const top = Number.isFinite(vacancy.top) ? vacancy.top : sceneMapEdges[Dimensions.Y];
  const bottom = Number.isFinite(vacancy.bottom) ? vacancy.bottom : sceneMapEdges[Dimensions.MINUS_Y];

  if (left > right || top < bottom) {
    // the case when vacancy is outside the scene
    return null;
  }

  return (
    <rect
      fill="purple"
      fillOpacity="0"
      height={SceneMap.countPositions(bottom, top) * sceneMapResolution}
      key={id}
      stroke="blue"
      strokeOpacity="0.25"
      strokeWidth={vacancyStrokeWidthByImportance[importance]}
      width={SceneMap.countPositions(left, right) * sceneMapResolution}
      x={SceneMap.getPositionLeftEdge(left) * sceneMapResolution}
      y={-SceneMap.getPositionRightEdge(top) * sceneMapResolution}
    />
  );
};

export const Vacancies = ({
  sceneMapEdges,
  vacancies,
  svgSize,
  svgViewBox,
  transform,
  sceneMapResolution,
}: ActiveVacanciesPropsT) => {
  const rects: React.ReactNode[] = [];
  if (vacancies && sceneMapEdges) {
    vacancies.forEach(({ id, vacancy, importance }) => {
      rects.push(
        renderVacancyRect({
          id,
          vacancy,
          sceneMapEdges,
          importance,
          sceneMapResolution,
        }),
      );
    });
  }

  return (
    <svg {...svgSize} style={activeVacanciesStyle} viewBox={svgViewBox.join(' ')}>
      <g transform={transform}>{rects}</g>
    </svg>
  );
};
