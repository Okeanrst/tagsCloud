import * as types from './actionTypes';
import { createAction } from './helpers';
import FontFaceObserver from 'fontfaceobserver';

export default function loadFont() {
  return (dispatch) => {
    if (sessionStorage.getItem('fontLoaded')) {
			return dispatch(createAction(types.FONT_LOAD_SUCCESS));
    }
    dispatch(createAction(types.FONT_LOAD_REQUEST));
    const font = new FontFaceObserver('Open Sans');
    font.load(null, 5000)
      .then(function () {
        sessionStorage.setItem('fontLoaded', 1);
        dispatch(createAction(types.FONT_LOAD_SUCCESS));
		  }).catch(error => {
        sessionStorage.removeItem('fontLoaded');
        dispatch(createAction(types.FONT_LOAD_FAILURE));
		  });
  };  
}