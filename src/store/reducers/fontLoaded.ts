import type { AnyAction } from 'redux';
import { FONT_LOAD_REQUEST, FONT_LOAD_SUCCESS, FONT_LOAD_FAILURE, FONT_LOAD_RESET } from '../actions/actionTypes';
import { QueryStatuses } from 'constants/queryStatuses';

import type { RootStateT } from '../types';

const { PENDING, PRISTINE, SUCCESS, FAILURE } = QueryStatuses;

const initState = { status: PRISTINE, data: false };

const fontLoaded = (state: RootStateT['fontLoaded'] = initState, action: AnyAction) => {
  switch (action.type) {
    case FONT_LOAD_REQUEST:
      return { ...state, status: PENDING };
    case FONT_LOAD_SUCCESS:
      return { status: SUCCESS, data: true };
    case FONT_LOAD_FAILURE:
      return { ...state, status: FAILURE };
    case FONT_LOAD_RESET:
      return initState;
    default:
      return state;
  }
};

export default fontLoaded;
