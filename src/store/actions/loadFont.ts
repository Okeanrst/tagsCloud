import * as actionTypes from './actionTypes';
import { createAction } from './helpers';
import FontFaceObserver from 'fontfaceobserver';
import { Dispatch } from 'redux';

import { AppDispatchT } from '../types';

const { FONT_LOAD_SUCCESS, FONT_LOAD_REQUEST, FONT_LOAD_FAILURE } = actionTypes;

export function loadFont(): (dispatch: Dispatch) => void {
  return (dispatch: AppDispatchT) => {
    if (sessionStorage.getItem('fontLoaded')) {
      // return dispatch(createAction(FONT_LOAD_SUCCESS));
    }
    dispatch(createAction(FONT_LOAD_REQUEST));
    const font = new FontFaceObserver('Open Sans');
    font
      .load(null, 5000)
      .then(function () {
        sessionStorage.setItem('fontLoaded', JSON.stringify(1));
        dispatch(createAction(FONT_LOAD_SUCCESS));
      })
      .catch(() => {
        sessionStorage.removeItem('fontLoaded');
        dispatch(createAction(FONT_LOAD_FAILURE));
      });
  };
}
