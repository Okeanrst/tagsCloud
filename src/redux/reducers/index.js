'use strict';

import { combineReducers } from 'redux';
import {
  FETCH_DATA_REQUEST, FETCH_DATA_SUCCESS, FETCH_DATA_FAILURE,
  PROCESS_DATA_REQUEST, PROCESS_DATA_SUCCESS, PROCESS_DATA_FAILURE,
} from '../actions/actionTypes';

const rawDataReducer = (state = {}, action) => {
  switch (action.type) {
    case FETCH_DATA_REQUEST:
      return {...state, isFetching: true};
    case FETCH_DATA_SUCCESS:
      return {...state, isFetching: false, data: action.data};
    case FETCH_DATA_FAILURE:
      return {...state, isFetching: false};
    default:
      return state;
  }
};

const tagsCloudReducer = (state = {}, action) => {
  switch (action.type) {
    case PROCESS_DATA_REQUEST:
      return {...state, isFetching: true, data: action.data};
    case PROCESS_DATA_SUCCESS:
      return {...state, isFetching: false};
    case PROCESS_DATA_FAILURE:
      return {...state, isFetching: false};
    default:
      return state;
  }
};

export default combineReducers({
  rawData: rawDataReducer,
  tagsCloud: tagsCloudReducer,
});