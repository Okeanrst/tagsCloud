import { ThunkDispatch } from 'redux-thunk';
import { Action } from 'redux';
import { QueryStatuses } from 'constants/queryStatuses';

import type { PositionedTagRectT, TagDataT, IdRectAreaMapT } from 'types/types';
import type {
  ClosedVacancyT,
  PreparedBottomEdgeVacancyT,
  PreparedTopEdgeVacancyT,
  PreparedLeftEdgeVacancyT,
  PreparedRightEdgeVacancyT,
} from 'utilities/positioningAlgorithm/types';

export type RootStateT = {
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
      closedVacancies: ClosedVacancyT[];
      topEdgeVacancies: PreparedTopEdgeVacancyT[];
      bottomEdgeVacancies: PreparedBottomEdgeVacancyT[];
      leftEdgeVacancies: PreparedLeftEdgeVacancyT[];
      rightEdgeVacancies: PreparedRightEdgeVacancyT[];
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
