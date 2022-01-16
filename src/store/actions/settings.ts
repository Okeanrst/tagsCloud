import { batch } from 'react-redux';
import { AppDispatchT, GetStateT, RootStateT } from '../types';
import { createAction } from './helpers';
import * as actionTypes from './actionTypes';

export function updateSettings(data: Partial<RootStateT['settings']>) {
  return (dispatch: AppDispatchT, getState: GetStateT) => {
    const { settings: { fontFamily } } = getState();
    batch(() => {
      if ('fontFamily' in data && fontFamily !== data.fontFamily) {
        dispatch(createAction(actionTypes.FONT_LOAD_RESET));
        dispatch(createAction(actionTypes.RECT_AREAS_MAPS_RESET));
      }
      dispatch(createAction(actionTypes.SETTINGS_UPDATE, data));
    });
  };
}
