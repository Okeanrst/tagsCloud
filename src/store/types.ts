import { ThunkDispatch } from 'redux-thunk';
import { Action } from 'redux';
import { QueryStatuses } from 'constants/queryStatuses';

import type { PositionedTagRectT, TagDataT, IdRectAreaMapT } from 'types/types';

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
    status: QueryStatuses.SUCCESS;
  } | {
    tagsPositions: null;
    sceneMap: null;
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
