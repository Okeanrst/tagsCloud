import React from 'react';
import { Dimensions, SceneEdgesT, SceneMap } from 'utilities/positioningAlgorithm/sceneMap';
import { VacancyKinds, VacancyT } from 'utilities/positioningAlgorithm/types';
import { SizeT, ViewBoxT } from 'types/types';

type ActiveVacanciesPropsT = {
  sceneMapEdges: SceneEdgesT | null;
  vacancies: { vacancy: VacancyT; kind: VacancyKinds; importance: 0 | 1 | 2 }[] | null;
  svgSize: SizeT;
  viewBox: ViewBoxT;
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

const renderVacancyRect = (
  vacancy: VacancyT,
  sceneMapEdges: SceneEdgesT,
  { kind, importance, sceneMapResolution }: { kind: string; importance: 0 | 1 | 2; sceneMapResolution: number },
) => {
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
      key={`${left},${right},${top},${bottom},${kind}`}
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
  viewBox,
  transform,
  sceneMapResolution,
}: ActiveVacanciesPropsT) => {
  const rects: React.ReactNode[] = [];
  if (vacancies && sceneMapEdges) {
    vacancies.forEach(({ vacancy, kind, importance }) => {
      rects.push(
        renderVacancyRect(vacancy, sceneMapEdges, {
          kind,
          importance,
          sceneMapResolution,
        }),
      );
    });
  }

  return (
    <svg {...svgSize} style={activeVacanciesStyle} viewBox={viewBox.join(' ')}>
      <g transform={transform}>{rects}</g>
    </svg>
  );
};
