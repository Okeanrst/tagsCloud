import { ThunkDispatch } from 'redux-thunk';
import { Action } from 'redux';

import type { PositionedTagRectT, TagDataT } from 'types/types';

export type RootStateT = {
  rawData: {
    data?: ReadonlyArray<TagDataT>;
    isFetching: boolean;
  };
  tagsCloud: {
    data?: ReadonlyArray<PositionedTagRectT>;
    isFetching: boolean;
  };
  useCanvas: boolean;
  fontLoaded: {
    data: any;
    isFetching: boolean;
  };
};

export type AppDispatchT = ThunkDispatch<RootStateT, void, Action>;
