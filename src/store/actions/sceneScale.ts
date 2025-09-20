import { SET_SCENE_SCALE } from '../actionTypes';
import { createAction } from './helpers';
import { RootStateT } from '../types';

export const setSceneScale = (payload: RootStateT['sceneScale']) => createAction(SET_SCENE_SCALE, payload);
