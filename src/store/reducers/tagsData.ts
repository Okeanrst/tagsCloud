import { RootStateT } from '../types';
import { QueryStatuses } from 'constants/queryStatuses';
import { AnyAction } from 'redux';
import {
  TAGS_DATA_ADD_DATA_ITEM,
  TAGS_DATA_DELETE_ALL_DATA,
  TAGS_DATA_DELETE_DATA_ITEM,
  TAGS_DATA_EDIT_DATA_ITEM,
  TAGS_DATA_FETCH_FAILURE,
  TAGS_DATA_FETCH_REQUEST,
  TAGS_DATA_FETCH_SUCCESS,
  RESET_TAGS_DATA,
} from '../actions/actionTypes';

const { PENDING, PRISTINE, SUCCESS, FAILURE } = QueryStatuses;

export const selectTargetTagDataItem = (state: RootStateT, targetId: string) => {
  return (state.tagsData?.data ?? []).find(({ id }) => id === targetId);
};

export const tagsDataReducer = (
  state: RootStateT['tagsData'] = { status: PRISTINE, data: null },
  action: AnyAction,
) => {
  switch (action.type) {
    case TAGS_DATA_FETCH_REQUEST:
      return { status: PENDING, data: null };
    case TAGS_DATA_FETCH_SUCCESS:
      return { status: SUCCESS, data: action.payload };
    case TAGS_DATA_FETCH_FAILURE:
      return { status: FAILURE, data: null };
    case TAGS_DATA_DELETE_DATA_ITEM:
      if (state.status !== SUCCESS) {
        return state;
      }
      const idToDelete = action.payload;
      const data = state.data.filter((item) => item.id !== idToDelete);
      return { ...state, data };
    case TAGS_DATA_EDIT_DATA_ITEM: {
      if (state.status !== SUCCESS) {
        return state;
      }
      const itemData = action.payload;
      const itemIndex = state.data.findIndex((item) => item.id === itemData.id) ?? -1;
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
    case TAGS_DATA_ADD_DATA_ITEM: {
      if (state.status !== SUCCESS) {
        return state;
      }
      return { ...state, data: [...state.data, action.payload] };
    }
    case TAGS_DATA_DELETE_ALL_DATA:
      return { status: SUCCESS, data: [] };
    case RESET_TAGS_DATA:
      return { status: PRISTINE, data: null };
    default:
      return state;
  }
};
