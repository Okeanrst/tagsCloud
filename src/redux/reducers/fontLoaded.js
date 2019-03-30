import {
  FONT_LOAD_REQUEST, FONT_LOAD_SUCCESS, FONT_LOAD_FAILURE
} from '../actions/actionTypes';

const fontLoaded = (state = {isFetching: false, data: false}, action) => {
	switch (action.type) {
    case FONT_LOAD_REQUEST:
      return {...state, isFetching: true};
    case FONT_LOAD_SUCCESS:
      return {...state, isFetching: false, data: true};
    case FONT_LOAD_FAILURE:
      return {...state, isFetching: false};
    default:
      return state;
  }
};

export default fontLoaded;
