import { RootStateT } from '../types';
import { FAILURE, PENDING, PRISTINE, SUCCESS } from 'constants/queryStatuses';
import { AnyAction } from 'redux';
import {
  ADD_DATA_ITEM,
  DELETE_DATA_ITEM,
  EDIT_DATA_ITEM,
  FETCH_DATA_FAILURE,
  FETCH_DATA_REQUEST,
  FETCH_DATA_SUCCESS
} from '../actions/actionTypes';

export const tagsDataReducer = (
  state: RootStateT['tagsData'] = { status: PRISTINE },
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
      const idToDelete = action.data;
      const data = state.data?.filter(item => item.id !== idToDelete);
      return { ...state, data };
    case EDIT_DATA_ITEM: {
      const itemData = action.data;
      const itemIndex =
        state.data?.findIndex(item => item.id === itemData.id) ?? -1;
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
      return { ...state, data: [...(state.data ?? []), action.data] };
    }
    default:
      return state;
  }
};
