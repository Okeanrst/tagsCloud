import { AnyAction } from 'redux';
import { RootStateT } from '../types';
import {
  NOTIFICATIONS_REPLACE,
  NOTIFICATIONS_POP,
  NOTIFICATIONS_PUSH,
  NOTIFICATIONS_DELETE,
} from '../actions/actionTypes';

export const notificationsReducer = (state: RootStateT['notifications'] = [], action: AnyAction) => {
  switch (action.type) {
    case NOTIFICATIONS_PUSH:
      return [...state, ...action.payload];
    case NOTIFICATIONS_POP:
      return state.slice(1);
    case NOTIFICATIONS_REPLACE:
      return action.payload;
    case NOTIFICATIONS_DELETE:
      return state.filter(({ id }) => id !== action.payload);
    default:
      return state;
  }
};
