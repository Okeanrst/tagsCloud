import type { AnyAction } from 'redux';
import {
  FONT_LOAD_REQUEST,
  FONT_LOAD_SUCCESS,
  FONT_LOAD_FAILURE,
} from '../actions/actionTypes';

import type { RootStateT } from '../types';

const fontLoaded = (
  state: RootStateT['fontLoaded'] = { isFetching: false, data: false },
  action: AnyAction,
) => {
  switch (action.type) {
    case FONT_LOAD_REQUEST:
      return { ...state, isFetching: true };
    case FONT_LOAD_SUCCESS:
      return { ...state, isFetching: false, data: true };
    case FONT_LOAD_FAILURE:
      return { ...state, isFetching: false };
    default:
      return state;
  }
};

export default fontLoaded;
