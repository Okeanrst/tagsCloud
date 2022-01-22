import { combineReducers, AnyAction } from 'redux';
import { USE_CANVAS_TOGGLE } from '../actions/actionTypes';
import { tagsDataReducer } from './tagsData';
import { tagsCloudReducer } from './tagsCloud';
import { incrementalBuildReducer } from './incrementalBuild';
import fontLoaded from './fontLoaded';
import { rectAreasMapsDataReducer } from './rectAreasMapsData';
import { settingsReducer } from './settings';
import { notificationsReducer } from './notifications';

import type { RootStateT } from '../types';

const useCanvasReducer = (
  state: RootStateT['useCanvas'] = false,
  action: AnyAction,
) => {
  if (action.type === USE_CANVAS_TOGGLE) return !state;
  return state;
};

export default combineReducers({
  settings: settingsReducer,
  tagsData: tagsDataReducer,
  tagsCloud: tagsCloudReducer,
  useCanvas: useCanvasReducer,
  fontLoaded,
  rectAreasMapsData: rectAreasMapsDataReducer,
  incrementalBuild: incrementalBuildReducer,
  notifications: notificationsReducer,
});
