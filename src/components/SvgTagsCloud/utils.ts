import { saveAs } from 'file-saver';
import { RectAreaT, ScaleT } from 'types/types';
import { VacancyKinds, VacancyT } from 'utilities/positioningAlgorithm/types';
import { VacanciesManager } from 'utilities/positioningAlgorithm/vacanciesManager';
import { isVacancyLargeEnoughToFitRect } from 'utilities/positioningAlgorithm/calcTagsPositions';
import { Dimensions, SceneEdgesT } from 'utilities/positioningAlgorithm/sceneMap';
import React from 'react';
import { SizeT, ViewBoxT } from 'types/types';
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
    | React.SyntheticEvent<any, MouseEvent>
    | React.SyntheticEvent<any, TouchEvent> /* React.MouseEvent | React.TouchEvent*/,
) => {
  let pageX: number | null = null;
  let pageY: number | null = null;
  if (event instanceof MouseEvent) {
    ({ pageX, pageY } = event);
  } else if (window.TouchEvent && event instanceof TouchEvent) {
    ({ pageX, pageY } = event.touches[0]);
  } else if ('nativeEvent' in event && event.nativeEvent instanceof MouseEvent) {
    // @ts-ignore
    ({ pageX, pageY } = event);
  } else if ('nativeEvent' in event && window.TouchEvent && event.nativeEvent instanceof TouchEvent) {
    // @ts-ignore
    ({ pageX, pageY } = event.touches[0]);
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

export const sortActiveVacancies = (vacancies: VacanciesT) => {
  const sortedVacancies: { vacancy: VacancyT; kind: VacancyKinds }[] = [];
  for (let kind of Object.values(VacancyKinds)) {
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

// in Canvas coordinates; not scaled
export const canvasFrameCoordinatesToCanvasCoordinates = ({
  coordinates,
  canvasFrameOffset,
  scale,
}: {
  coordinates: CoordinatesT;
  canvasFrameOffset: FrameOffsetT;
  scale: number;
}) => {
  const { x, y } = coordinates;
  const { top: offsetTop, left: offsetLeft } = canvasFrameOffset;
  return { x: x / scale + offsetLeft, y: y / scale + offsetTop };
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

export const calcSVGSizeFactor = (svgSize: SizeT, viewBox: ViewBoxT) => {
  const [, , width] = viewBox;
  return svgSize.width / width;
};

export const getScaledViewBox = (
  viewBox: ViewBoxT,
  { scale, sceneHeight, sceneWidth }: { scale: ScaleT; sceneHeight: number; sceneWidth: number },
): ViewBoxT => {
  const {
    value: scaleValue,
    point: { x: centerX, y: centerY },
  } = scale;
  const centerXRatio = centerX / sceneWidth;
  const centerYRatio = centerY / sceneHeight;
  const [minX, minY, width, height] = viewBox;

  const scaledWidth = width / scaleValue;
  const scaledHeight = height / scaleValue;

  const getCenter = ({ start, size, ratio }: { start: number; size: number; ratio: number }) => start + size * ratio;

  const getFramePosition = ({ center, size, min, max }: { center: number; size: number; min: number; max: number }) => {
    const halfSize = size / 2;
    let start = center - halfSize;
    if (start < min) {
      start = min;
    } else if (start + size > max) {
      start = max - size;
    }
    return start;
  };

  const nextMinX = getFramePosition({
    center: getCenter({ start: minX, size: width, ratio: centerXRatio }),
    size: scaledWidth,
    min: minX,
    max: minX + width,
  });
  const nextMinY = getFramePosition({
    center: getCenter({ start: minY, size: height, ratio: centerYRatio }),
    size: scaledHeight,
    min: minY,
    max: minY + height,
  });

  return [Math.round(nextMinX), Math.round(nextMinY), Math.round(scaledWidth), Math.round(scaledHeight)];
};

// offset relative to Canvas; offset in Canvas coordinates
export const getCanvasFrameOffset = (
  fullSceneViewBox: ViewBoxT,
  viewBox: ViewBoxT,
  svgSizeFactor: number,
): FrameOffsetT => {
  const [fullSceneMinX, fullSceneMinY] = fullSceneViewBox;
  const [minX, minY] = viewBox;
  return { left: (minX - fullSceneMinX) * svgSizeFactor, top: (minY - fullSceneMinY) * svgSizeFactor };
};
