import { ThunkDispatch } from 'redux-thunk';
import { Action } from 'redux';
import { QueryStatuses } from 'constants/queryStatuses';
import { VacancyKinds } from 'utilities/positioningAlgorithm/types';
import type { PositionedTagRectT, TagDataT, IdRectAreaMapT } from 'types/types';
import type {
  ClosedVacancyT,
  PreparedBottomEdgeVacancyT,
  PreparedTopEdgeVacancyT,
  PreparedLeftEdgeVacancyT,
  PreparedRightEdgeVacancyT,
} from 'utilities/positioningAlgorithm/types';
import {
  FontFamilies,
  PickingStrategies,
  SortingClosedVacanciesStrategies,
  SortingEdgeVacanciesStrategies
} from 'constants/index';

export type RootStateT = {
  settings: {
    fontFamily: FontFamilies,
    shouldDrawFinalMap: boolean;
    shouldDrawStepMap: boolean;
    shouldDrawVacanciesMap: boolean;
    shouldDrawFinalVacanciesMap: boolean;
    shouldTryAnotherAngle: boolean;
    addIfEmptyIndex: number;
    pickingClosedVacancyStrategy: PickingStrategies,
    pickingEdgeVacancyStrategy: PickingStrategies,
    sortingClosedVacanciesStrategy: SortingClosedVacanciesStrategies,
    sortingEdgeVacanciesStrategy: SortingEdgeVacanciesStrategies,
    sceneMapResolution: number,
    minFontSize: number,
    maxFontSize: number,
  },
  tagsData: {
    data: ReadonlyArray<TagDataT>;
    status: QueryStatuses.SUCCESS;
  } | {
    data: null;
    status: QueryStatuses.PRISTINE | QueryStatuses.PENDING | QueryStatuses.FAILURE
  };
  tagsCloud: {
    tagsPositions: ReadonlyArray<PositionedTagRectT>;
    sceneMap: [number, number, boolean][] | [number, number][];
    vacancies: {
      [VacancyKinds.closedVacancies]: ClosedVacancyT[];
      [VacancyKinds.topEdgeVacancies]: PreparedTopEdgeVacancyT[];
      [VacancyKinds.bottomEdgeVacancies]: PreparedBottomEdgeVacancyT[];
      [VacancyKinds.leftEdgeVacancies]: PreparedLeftEdgeVacancyT[];
      [VacancyKinds.rightEdgeVacancies]: PreparedRightEdgeVacancyT[];
    };
    status: QueryStatuses.SUCCESS;
  } | {
    tagsPositions: null;
    sceneMap: null;
    vacancies: null;
    status: QueryStatuses.PRISTINE | QueryStatuses.PENDING | QueryStatuses.FAILURE;
  };
  useCanvas: boolean;
  fontLoaded: {
    data: boolean;
    status: QueryStatuses;
  };
  rectAreasMapsData: ReadonlyArray<IdRectAreaMapT>;
  incrementalBuild: {
    status: QueryStatuses;
    tagsIds: string[];
  };
};

export type AppDispatchT = ThunkDispatch<RootStateT, void, Action>;

export type GetStateT = () => RootStateT;
