import { PickingStrategies } from 'constants/index';
import { formRectAreaMapKey } from '../prepareRectAreasMaps';
import { getRectAreaOfRectAreaMap } from '../rectAreaMap/rectAreaMap';
import {
  creatMapPositionedTagRect,
  getSceneMapVacancies,
  moveRectAreaPositionsOnSceneMap,
  Options,
  pickClosedVacancy,
  pickEdgeVacancy,
  preparePositionedTagRect,
  rotateRectArea,
} from './calcTagsPositions';
import { PositionT, SceneMap } from './sceneMap';
import { EDGE } from './edgesManager';

import { IdRectAreaMapT, PositionedTagRectT } from 'types/types';
import {
  ClosedVacancyT,
  PreparedBottomEdgeVacancyT,
  PreparedLeftEdgeVacancyT,
  PreparedRightEdgeVacancyT,
  PreparedTopEdgeVacancyT,
  VacancyKinds,
  VacancyT,
} from './types';

const { ASC, DESC } = PickingStrategies;

export const updateTagPosition = (
  {
    tagId,
    vacancy,
    vacancyKind,
    isRotated,
  }: {
    tagId: string;
    vacancy: VacancyT;
    vacancyKind: VacancyKinds;
    isRotated: boolean;
  },
  {
    sceneMapPositions,
    tagsPositions,
    rectAreasMaps,
    options,
  }: {
    sceneMapPositions: PositionT[] | null;
    tagsPositions: ReadonlyArray<PositionedTagRectT> | null;
    rectAreasMaps: ReadonlyArray<IdRectAreaMapT>;
    options: Options;
  },
) => {
  const currentTagPosition = tagsPositions?.find(({ id }) => id === tagId);

  if (!currentTagPosition || !sceneMapPositions) {
    return null;
  }

  const rectAreaMapKey = formRectAreaMapKey(currentTagPosition.label, currentTagPosition.fontSize);

  const rectAreaMap = rectAreasMaps.find(({ key }) => key === rectAreaMapKey);

  if (!rectAreaMap?.map || !rectAreaMap?.mapMeta) {
    return null;
  }

  const tagRectArea = isRotated
    ? rotateRectArea(getRectAreaOfRectAreaMap(rectAreaMap.map))
    : getRectAreaOfRectAreaMap(rectAreaMap.map);

  if (!tagRectArea) {
    return null;
  }

  const { pickingClosedVacancyStrategy = DESC, pickingEdgeVacancyStrategy = ASC, sceneMapResolution } = options;

  let rectPosition;
  if (vacancyKind === VacancyKinds.closedVacancies) {
    ({ rectPosition } =
      pickClosedVacancy(tagRectArea, [vacancy as ClosedVacancyT], {
        pickingStrategy: pickingClosedVacancyStrategy,
      }) ?? {});
  } else if (
    [
      VacancyKinds.topEdgeVacancies,
      VacancyKinds.bottomEdgeVacancies,
      VacancyKinds.rightEdgeVacancies,
      VacancyKinds.leftEdgeVacancies,
    ].includes(vacancyKind)
  ) {
    const sceneEdges = new SceneMap(sceneMapPositions).getSceneEdges();
    let edge;
    let vacancies;
    switch (vacancyKind) {
      case VacancyKinds.topEdgeVacancies: {
        edge = EDGE.TOP;
        vacancies = [vacancy as PreparedTopEdgeVacancyT];
        break;
      }
      case VacancyKinds.bottomEdgeVacancies: {
        edge = EDGE.BOTTOM;
        vacancies = [vacancy as PreparedBottomEdgeVacancyT];
        break;
      }
      case VacancyKinds.leftEdgeVacancies: {
        edge = EDGE.LEFT;
        vacancies = [vacancy as PreparedLeftEdgeVacancyT];
        break;
      }
      case VacancyKinds.rightEdgeVacancies: {
        edge = EDGE.RIGHT;
        vacancies = [vacancy as PreparedRightEdgeVacancyT];
        break;
      }
    }
    ({ rectPosition } =
      pickEdgeVacancy(tagRectArea, vacancies, sceneEdges, edge, {
        force: true,
        pickingStrategy: pickingEdgeVacancyStrategy,
      }) ?? {});
  }

  if (!rectPosition) {
    return;
  }

  const nextMapPositionedTagRect = creatMapPositionedTagRect(currentTagPosition, rectPosition, isRotated);

  const sceneMap = moveRectAreaPositionsOnSceneMap(
    sceneMapPositions,
    currentTagPosition,
    nextMapPositionedTagRect,
    rectAreaMap.map,
  );

  preparePositionedTagRect(nextMapPositionedTagRect, rectAreaMap.mapMeta, sceneMapResolution);

  return {
    tagPosition: nextMapPositionedTagRect,
    sceneMap: sceneMap.toPositions(),
    vacancies: getSceneMapVacancies(sceneMap),
  };
};
