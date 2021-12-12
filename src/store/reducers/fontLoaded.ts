import type { AnyAction } from 'redux';
import {
  FONT_LOAD_REQUEST,
  FONT_LOAD_SUCCESS,
  FONT_LOAD_FAILURE,
} from '../actions/actionTypes';
import { PRISTINE, SUCCESS, FAILURE, PENDING } from 'constants/queryStatuses';

import type { RootStateT } from '../types';

const fontLoaded = (
  state: RootStateT['fontLoaded'] = { status: PRISTINE, data: false },
  action: AnyAction,
) => {
  switch (action.type) {
    case FONT_LOAD_REQUEST:
      return { ...state, status: PENDING };
    case FONT_LOAD_SUCCESS:
      return { status: SUCCESS, data: true };
    case FONT_LOAD_FAILURE:
      return { ...state, status: FAILURE };
    default:
      return state;
  }
};

export default fontLoaded;
