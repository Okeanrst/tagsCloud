import { RootStateT } from '../types';
import { QueryStatuses } from 'constants/queryStatuses';
import { AnyAction } from 'redux';
import {
  ADD_DATA_ITEM,
  DELETE_DATA_ITEM,
  EDIT_DATA_ITEM,
  FETCH_DATA_FAILURE,
  FETCH_DATA_REQUEST,
  FETCH_DATA_SUCCESS
} from '../actions/actionTypes';

const { PENDING, PRISTINE, SUCCESS, FAILURE } = QueryStatuses;

export const tagsDataReducer = (
  state: RootStateT['tagsData'] = { status: PRISTINE, data: null },
  action: AnyAction,
) => {
  switch (action.type) {
    case FETCH_DATA_REQUEST:
      return { ...state, status: PENDING };
    case FETCH_DATA_SUCCESS:
      return { ...state, status: SUCCESS, data: action.data };
    case FETCH_DATA_FAILURE:
      return { ...state, status: FAILURE };
    case DELETE_DATA_ITEM:
      if (state.status !== SUCCESS) {
        return state;
      }
      const idToDelete = action.data;
      const data = state.data.filter(item => item.id !== idToDelete);
      return { ...state, data };
    case EDIT_DATA_ITEM: {
      if (state.status !== SUCCESS) {
        return state;
      }
      const itemData = action.data;
      const itemIndex = state.data.findIndex(item => item.id === itemData.id) ?? -1;
      let nextStateData = state.data;
      if (itemIndex > -1) {
        nextStateData = [
          ...(state.data ?? []).slice(0, itemIndex),
          itemData,
          ...(state.data ?? []).slice(itemIndex + 1),
        ];
      }
      return { ...state, data: nextStateData };
    }
    case ADD_DATA_ITEM: {
      if (state.status !== SUCCESS) {
        return state;
      }
      return { ...state, data: [...state.data, action.data] };
    }
    default:
      return state;
  }
};
