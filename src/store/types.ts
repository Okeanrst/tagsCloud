import { ThunkDispatch } from 'redux-thunk';
import { Action } from 'redux';
import { QueryStatusesT } from 'constants/queryStatuses';

import type { PositionedTagRectT, TagDataT } from 'types/types';

export type RootStateT = {
  tagsData: {
    data?: ReadonlyArray<TagDataT>;
    status: QueryStatusesT;
  };
  tagsCloud: {
    data?: ReadonlyArray<PositionedTagRectT>;
    status: QueryStatusesT;
  };
  useCanvas: boolean;
  fontLoaded: {
    data: boolean;
    status: QueryStatusesT;
  };
};

export type AppDispatchT = ThunkDispatch<RootStateT, void, Action>;
