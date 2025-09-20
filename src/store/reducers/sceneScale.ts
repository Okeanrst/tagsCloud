import { RESET_TAGS_DATA, SET_SCENE_SCALE } from '../actionTypes';
import { RootStateT } from '../types';
import { AnyAction } from 'redux';

export const sceneScaleReducer = (state: RootStateT['sceneScale'] = null, action: AnyAction) => {
  switch (action.type) {
    case SET_SCENE_SCALE:
      return { ...action.payload };
    case RESET_TAGS_DATA:
      return null;
    default:
      return state;
  }
};
