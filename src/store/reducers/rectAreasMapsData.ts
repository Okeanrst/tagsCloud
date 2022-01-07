import { RootStateT } from '../types';
import { AnyAction } from 'redux';
import { ADD_RECT_AREAS_MAPS, DELETE_RECT_AREA_MAP } from '../actions/actionTypes';

export const rectAreasMapsDataReducer = (state: RootStateT['rectAreasMapsData'] = [], action: AnyAction) => {
  switch (action.type) {
    case ADD_RECT_AREAS_MAPS:
      return [...state, ...action.payload];
    case DELETE_RECT_AREA_MAP:
      const keyToDelete = action.payload;
      return state.filter(item => item.key !== keyToDelete);
    default:
      return state;
  }
};
