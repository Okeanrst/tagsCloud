import { saveAs } from 'file-saver';
import { RectAreaT } from 'types/types';
import { VacancyKinds, VacancyT } from 'utilities/positioningAlgorithm/types';
import { VacanciesManager } from 'utilities/positioningAlgorithm/vacanciesManager';
import { isVacancyLargeEnoughToFitRect } from 'utilities/positioningAlgorithm/calcTagsPositions';
import { Dimensions, SceneEdgesT } from 'utilities/positioningAlgorithm/sceneMap';
import React from 'react';
import { SizeT, ViewBoxT, SceneFrameT } from 'types/types';
import { CoordinatesT, VacanciesT } from './types';

export type FrameOffsetT = { top: number; left: number };

export const downloadTagCloudHtmlFile = (html: string, fileName?: string) => {
  const blob = new Blob([html], {
    type: 'text/html;charset=utf-8',
  });
  saveAs(blob, fileName ?? 'tagCloud.html');
};

export const getEventDocumentCoordinates = (
  event:
    | MouseEvent
    | TouchEvent
    | React.MouseEvent
    | React.TouchEvent
    | React.SyntheticEvent<Element, MouseEvent | TouchEvent>,
) => {
  let pageX: number | null = null;
  let pageY: number | null = null;
  if (event instanceof MouseEvent) {
    ({ pageX, pageY } = event);
  } else if (window.TouchEvent && event instanceof TouchEvent) {
    ({ pageX, pageY } = event.touches[0]);
  } else if ('nativeEvent' in event && event.nativeEvent instanceof MouseEvent) {
    ({ pageX, pageY } = event.nativeEvent);
  } else if ('nativeEvent' in event && window.TouchEvent && event.nativeEvent instanceof TouchEvent) {
    const touch = event.nativeEvent.touches[0];
    if (touch) {
      ({ pageX, pageY } = touch);
    }
  }
  return { pageX, pageY };
};

export const getActiveVacanciesByCoordinates = (
  point: CoordinatesT,
  rectArea: RectAreaT,
  vacancies: VacanciesT,
): VacanciesT => {
  const { closedVacancies, topEdgeVacancies, bottomEdgeVacancies, leftEdgeVacancies, rightEdgeVacancies } = vacancies;

  function processVacancies<T extends VacancyT>(vacanciesToProcess: T[]) {
    const suitableVacancies: T[] = [];
    vacanciesToProcess.forEach((vacancy) => {
      if (!vacancy || !VacanciesManager.checkIsPointBelongToVacancy(point, vacancy)) {
        return;
      }
      if (!isVacancyLargeEnoughToFitRect(rectArea, vacancy)) {
        return;
      }
      // check is big enough
      suitableVacancies.push(vacancy);
    });
    return suitableVacancies;
  }

  return {
    closedVacancies: processVacancies(closedVacancies),
    topEdgeVacancies: processVacancies(topEdgeVacancies),
    bottomEdgeVacancies: processVacancies(bottomEdgeVacancies),
    leftEdgeVacancies: processVacancies(leftEdgeVacancies),
    rightEdgeVacancies: processVacancies(rightEdgeVacancies),
  };
};

export const flatVacancies = (vacancies: VacanciesT) => {
  const sortedVacancies: { vacancy: VacancyT; kind: VacancyKinds }[] = [];
  for (const kind of Object.values(VacancyKinds)) {
    sortedVacancies.push(...vacancies[kind].map((vacancy) => ({ vacancy, kind })));
  }
  return sortedVacancies;
};

// in document ->
// coordinates in CanvasFrame ->
// coordinates in Canvas ->
// coordinates in Scene ->
// coordinates in svg
export const documentCoordinatesToCanvasFrameCoordinates = (
  documentCoordinates: CoordinatesT,
  canvasRect: DOMRect,
): CoordinatesT => {
  const { top, left } = canvasRect;
  return { x: documentCoordinates.x - left, y: documentCoordinates.y - top };
};

export const limitCoordinatesWithCanvasFrameBoundaries = (
  coordinates: CoordinatesT,
  canvasRect: DOMRect,
): CoordinatesT => {
  const { width, height } = canvasRect;
  const { x, y } = coordinates;
  return {
    x: Math.min(Math.max(0, x), width),
    y: Math.min(Math.max(0, y), height),
  };
};

// Rendered pixels per svgViewBox user unit (svg element size vs visible svgViewBox from sceneFrame).
export const getViewBoxUniformScale = (svgSize: SizeT, svgViewBox: ViewBoxT) => {
  const [, , vbWidth, vbHeight] = svgViewBox;
  return Math.min(svgSize.width / vbWidth, svgSize.height / vbHeight);
};

// Offset of the visible svgViewBox within full-scene canvas coordinates (sceneFrame pan).
export const getCanvasFrameOffset = (
  noScaleSvgViewBox: ViewBoxT,
  svgViewBox: ViewBoxT,
  svgSizeFactor: number,
): FrameOffsetT => {
  const [fullSceneMinX, fullSceneMinY] = noScaleSvgViewBox;
  const [minX, minY] = svgViewBox;
  return { left: (minX - fullSceneMinX) * svgSizeFactor, top: (minY - fullSceneMinY) * svgSizeFactor };
};

// Map pointer position inside the SVG element to full-scene canvas coordinates.
export const canvasFrameCoordinatesToCanvasCoordinates = ({
  coordinates,
  svgSize,
  svgViewBox,
  noScaleSvgViewBox,
  svgSizeFactor,
}: {
  coordinates: CoordinatesT;
  svgSize: SizeT;
  svgViewBox: ViewBoxT;
  noScaleSvgViewBox: ViewBoxT;
  svgSizeFactor: number;
}) => {
  const uniformScale = getViewBoxUniformScale(svgSize, svgViewBox);

  const viewBoxLocalX = coordinates.x / uniformScale;
  const viewBoxLocalY = coordinates.y / uniformScale;
  const { left: panOffsetX, top: panOffsetY } = getCanvasFrameOffset(noScaleSvgViewBox, svgViewBox, svgSizeFactor);

  return {
    x: panOffsetX + viewBoxLocalX * svgSizeFactor,
    y: panOffsetY + viewBoxLocalY * svgSizeFactor,
  };
};

export const canvasCoordinatesToSceneCoordinates = (
  canvasCoordinates: CoordinatesT,
  {
    sceneMapEdges,
    svgSizeFactor,
    sceneMapResolution,
  }: { sceneMapEdges: SceneEdgesT; svgSizeFactor: number; sceneMapResolution: number },
) => {
  const { x, y } = canvasCoordinates;

  return {
    x: (x / svgSizeFactor + sceneMapEdges[Dimensions.MINUS_X] * sceneMapResolution) / sceneMapResolution,
    y: (sceneMapEdges[Dimensions.Y] * sceneMapResolution - y / svgSizeFactor) / sceneMapResolution,
  };
};

export const sceneCoordinatesToCanvasCoordinates = (
  sceneCoordinates: CoordinatesT,
  {
    sceneMapEdges,
    svgSizeFactor,
    sceneMapResolution,
  }: { sceneMapEdges: SceneEdgesT; svgSizeFactor: number; sceneMapResolution: number },
) => {
  const { x, y } = sceneCoordinates;

  return {
    x: (x - sceneMapEdges[Dimensions.MINUS_X] * sceneMapResolution) * svgSizeFactor,
    y: (sceneMapEdges[Dimensions.Y] * sceneMapResolution - y) * svgSizeFactor,
  };
};

export const calcSVGSizeFactor = (svgSize: SizeT, svgViewBox: ViewBoxT) => {
  const [, , width] = svgViewBox;
  return svgSize.width / width;
};

export const getSVGViewBox = ({
  noScaleSvgViewBox,
  sceneFrame,
}: {
  sceneFrame: SceneFrameT;
  noScaleSvgViewBox: ViewBoxT;
}): ViewBoxT => {
  const [minX, minY, width, height] = noScaleSvgViewBox;
  const { left, top, width: sceneWidth, height: sceneHeight } = sceneFrame;

  return [
    Math.round(minX + width * left),
    Math.round(minY + height * top),
    Math.round(width * sceneWidth),
    Math.round(height * sceneHeight),
  ];
};
