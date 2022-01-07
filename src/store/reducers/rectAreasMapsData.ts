import { RootStateT } from '../types';
import { AnyAction } from 'redux';
import { RECT_AREAS_MAPS_ADD_MAPS, RECT_AREAS_MAPS_REMOVE_MAPS } from '../actions/actionTypes';

export const rectAreasMapsDataReducer = (state: RootStateT['rectAreasMapsData'] = [], action: AnyAction) => {
  switch (action.type) {
    case RECT_AREAS_MAPS_ADD_MAPS:
      return [...(new Map([...state, ...action.payload].map(map => ([map.key, map]))).values())];
    case RECT_AREAS_MAPS_REMOVE_MAPS:
      const unusedKeys = new Set(action.payload);
      return state.filter(item => !unusedKeys.has(item.key));
    default:
      return state;
  }
};
