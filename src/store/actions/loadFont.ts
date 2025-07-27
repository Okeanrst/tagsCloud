import { batch } from 'react-redux';
import { NOTIFICATIONS_TYPES } from 'constants/index';
import { addNotification } from './notifications';
import * as actionTypes from './actionTypes';
import { createAction } from './helpers';
import FontFaceObserver from 'fontfaceobserver';
import { AppDispatchT, GetStateT } from '../types';

const { FONT_LOAD_SUCCESS, FONT_LOAD_REQUEST, FONT_LOAD_FAILURE } = actionTypes;

const TIMEOUT = 5000;

export function loadFont() {
  return (dispatch: AppDispatchT, getState: GetStateT) => {
    const {
      settings: { fontFamily },
    } = getState();
    if (sessionStorage.getItem('fontLoaded')) {
      // return dispatch(createAction(FONT_LOAD_SUCCESS));
    }
    dispatch(createAction(FONT_LOAD_REQUEST));
    const font = new FontFaceObserver(fontFamily);
    font
      .load(null, TIMEOUT)
      .then(function () {
        sessionStorage.setItem('fontLoaded', JSON.stringify(1));
        dispatch(createAction(FONT_LOAD_SUCCESS));
      })
      .catch(() => {
        sessionStorage.removeItem('fontLoaded');
        batch(() => {
          dispatch(createAction(FONT_LOAD_FAILURE));
          dispatch(
            addNotification({
              content: 'font is not loaded',
              type: NOTIFICATIONS_TYPES.ERROR,
              timeout: 5000,
            }),
          );
        });
      });
  };
}
