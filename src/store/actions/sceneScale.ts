import { createAction } from './helpers';
import { SET_SCENE_SCALE, RESET_SCENE_SCALE } from './actionTypes';
import { AppDispatchT, GetStateT, RootStateT } from '../types';

export const setSceneScale =
  (arg: RootStateT['sceneScale'] | ((scale: RootStateT['sceneScale']) => RootStateT['sceneScale'])) =>
  (dispatch: AppDispatchT, getState: GetStateT) => {
    const { sceneScale: currentSceneScale } = getState();
    const payload = typeof arg === 'function' ? arg(currentSceneScale) : arg;
    dispatch(createAction(SET_SCENE_SCALE, payload));
  };

export const resetSceneScale = () => createAction(RESET_SCENE_SCALE);
