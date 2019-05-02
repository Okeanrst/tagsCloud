import { combineReducers } from 'redux';
import {
  FETCH_DATA_REQUEST, FETCH_DATA_SUCCESS, FETCH_DATA_FAILURE,
  DELETE_DATA_ITEM, EDIT_DATA_ITEM, ADD_DATA_ITEM,
  PROCESS_DATA_REQUEST, PROCESS_DATA_SUCCESS, PROCESS_DATA_FAILURE,
  RESET_TAGS_CLOUD_DATA,
  USE_CANVAS_TOGGLE
} from '../actions/actionTypes';
import fontLoaded from './fontLoaded';

const rawDataReducer = (state = {isFetching: false}, action) => {
  switch (action.type) {
    case FETCH_DATA_REQUEST:
      return {...state, isFetching: true};
    case FETCH_DATA_SUCCESS:
      return {...state, isFetching: false, data: action.data};
    case FETCH_DATA_FAILURE:
      return {...state, isFetching: false};
    case DELETE_DATA_ITEM:
      const idToDelete = action.data;
      const data = state.data.filter(item => item.id !== idToDelete);
      return {...state, data};
    case EDIT_DATA_ITEM: {
      const itemData = action.data;
      const itemIndex = state.data.findIndex(item => item.id === itemData.id);
      let data = state.data;
      if (itemIndex > -1) {
        data = [
          ...state.data.slice(0, itemIndex),
          itemData,
          ...state.data.slice(itemIndex + 1)
        ];
      }
      return {...state, data};
    }
    case ADD_DATA_ITEM: {
      return {...state, data: [...state.data, action.data]};
    }
    default:
      return state;
  }
};

const tagsCloudReducer = (state = {isFetching: false}, action) => {
  switch (action.type) {
    case PROCESS_DATA_REQUEST:
      return {...state, isFetching: true};
    case PROCESS_DATA_SUCCESS:
      return {...state, isFetching: false, data: action.data};
    case PROCESS_DATA_FAILURE:
      return {...state, isFetching: false};
    case RESET_TAGS_CLOUD_DATA:
      return {...state, isFetching: false, data: undefined};
    default:
      return state;
  }
};

const useCanvasReducer = (state = false, action) => {
  if (action.type === USE_CANVAS_TOGGLE) return !state;
  return state;
}

export default combineReducers({
  rawData: rawDataReducer,
  tagsCloud: tagsCloudReducer,
  useCanvas: useCanvasReducer,
  fontLoaded,
});