import { saveAs } from 'file-saver';
import { RectAreaT } from 'types/types';
import { VacancyKinds, VacancyT } from 'utilities/positioningAlgorithm/types';
import { VacanciesManager } from 'utilities/positioningAlgorithm/vacanciesManager';
import { isVacancyLargeEnoughToFitRect } from 'utilities/positioningAlgorithm/calcTagsPositions';
import { Dimensions, SceneEdgesT } from 'utilities/positioningAlgorithm/sceneMap';
import { ViewBoxT } from 'utilities/tagsCloud/tagSvgData';
import { SizeT } from 'types/types';
import { CoordinatesT, VacanciesT } from './types';

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

export const documentCoordinatesToCanvasCoordinates = (
  documentCoordinates: CoordinatesT,
  canvasRect: DOMRect,
): CoordinatesT => {
  const { top, left } = canvasRect;
  return { x: documentCoordinates.x - left, y: documentCoordinates.y - top };
};

export const limitCoordinatesWithCanvasBoundaries = (coordinates: CoordinatesT, canvasRect: DOMRect): CoordinatesT => {
  const { width, height } = canvasRect;
  const { x, y } = coordinates;
  return {
    x: Math.min(Math.max(0, x), width),
    y: Math.min(Math.max(0, y), height),
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

export const calcSVGSizeFactor = (svgSize: SizeT, viewBox: ViewBoxT) => {
  const [, , width] = viewBox;
  return svgSize.width / width;
};
