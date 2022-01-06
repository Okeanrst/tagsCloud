import { combineReducers, AnyAction } from 'redux';
import { USE_CANVAS_TOGGLE } from '../actions/actionTypes';
import { tagsDataReducer } from './tagsData';
import { tagsCloudReducer } from './tagsCloud';
import fontLoaded from './fontLoaded';

import type { RootStateT } from '../types';

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
