import { combineReducers, AnyAction } from 'redux';
import {
  PROCESS_DATA_REQUEST,
  PROCESS_DATA_SUCCESS,
  PROCESS_DATA_FAILURE,
  RESET_TAGS_CLOUD_DATA,
  USE_CANVAS_TOGGLE,
} from '../actions/actionTypes';
import { tagsDataReducer } from './tagsData';
import fontLoaded from './fontLoaded';
import { PRISTINE, SUCCESS, FAILURE, PENDING } from 'constants/queryStatuses';

import type { RootStateT } from '../types';

const tagsCloudReducer = (
  state: RootStateT['tagsCloud'] = { status: PRISTINE },
  action: AnyAction,
) => {
  switch (action.type) {
    case PROCESS_DATA_REQUEST:
      return { ...state, status: PENDING };
    case PROCESS_DATA_SUCCESS:
      return { ...state, status: SUCCESS, data: action.data };
    case PROCESS_DATA_FAILURE:
      return { ...state, status: FAILURE };
    case RESET_TAGS_CLOUD_DATA:
      return { ...state, status: PRISTINE, data: undefined };
    default:
      return state;
  }
};

const useCanvasReducer = (
  state: RootStateT['useCanvas'] = false,
  action: AnyAction,
) => {
  if (action.type === USE_CANVAS_TOGGLE) return !state;
  return state;
};

export default combineReducers({
  tagsData: tagsDataReducer,
  tagsCloud: tagsCloudReducer,
  useCanvas: useCanvasReducer,
  fontLoaded,
});
